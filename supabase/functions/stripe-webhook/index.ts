import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabase = createClient(
	Deno.env.get("SUPABASE_URL")!,
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
	const parts = signature.split(",");
	let timestamp = "";
	const signatures: string[] = [];

	for (const part of parts) {
		const [key, value] = part.split("=");
		if (key === "t") timestamp = value;
		if (key === "v1") signatures.push(value);
	}

	if (!timestamp || signatures.length === 0) return false;

	const signedPayload = `${timestamp}.${payload}`;
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
	const expected = Array.from(new Uint8Array(mac))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return signatures.includes(expected);
}

Deno.serve(async (req) => {
	if (req.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	const signature = req.headers.get("stripe-signature");
	if (!signature) {
		return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const payload = await req.text();

	const valid = await verifyStripeSignature(payload, signature, STRIPE_WEBHOOK_SECRET);
	if (!valid) {
		return new Response(JSON.stringify({ error: "Invalid signature" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	let event: { type: string; data: { object: Record<string, unknown> } };
	try {
		event = JSON.parse(payload);
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const obj = event.data.object;

	try {
		switch (event.type) {
			case "checkout.session.completed": {
				const userId = (obj.metadata as Record<string, string>)?.user_id;
				const customerId = obj.customer as string;
				const subscriptionId = obj.subscription as string;
				if (!userId) break;

				await supabase.from("subscription").upsert(
					{
						user_id: userId,
						stripe_customer_id: customerId,
						stripe_subscription_id: subscriptionId,
						status: "active",
						updated_at: new Date().toISOString(),
					},
					{ onConflict: "user_id" },
				);
				break;
			}

			case "customer.subscription.updated": {
				const customerId = obj.customer as string;
				const stripeStatus = obj.status as string;
				const cancelAtPeriodEnd = obj.cancel_at_period_end as boolean;
				const periodEnd = obj.current_period_end as number | null;

				const resolvedStatus =
					stripeStatus === "active" && cancelAtPeriodEnd ? "canceling" : stripeStatus;

				await supabase
					.from("subscription")
					.update({
						status: resolvedStatus,
						current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
						updated_at: new Date().toISOString(),
					})
					.eq("stripe_customer_id", customerId);
				break;
			}

			case "customer.subscription.deleted": {
				const customerId = obj.customer as string;

				await supabase
					.from("subscription")
					.update({ status: "canceled", updated_at: new Date().toISOString() })
					.eq("stripe_customer_id", customerId);
				break;
			}

			case "invoice.payment_failed": {
				const customerId = obj.customer as string;

				await supabase
					.from("subscription")
					.update({ status: "past_due", updated_at: new Date().toISOString() })
					.eq("stripe_customer_id", customerId);
				break;
			}
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(JSON.stringify({ received: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
});
