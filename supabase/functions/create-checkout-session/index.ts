import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_PRICE_NOK_MONTHLY = Deno.env.get("STRIPE_PRICE_ID")!;

const supabase = createClient(
	Deno.env.get("SUPABASE_URL")!,
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function stripeRequest(path: string, body: Record<string, unknown>): Promise<unknown> {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(body)) {
		if (value !== undefined && value !== null) {
			params.set(key, String(value));
		}
	}

	const res = await fetch(`https://api.stripe.com/v1${path}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	const data = await res.json();
	if (!res.ok) throw new Error((data as { error?: { message?: string } }).error?.message ?? "Stripe error");
	return data;
}

Deno.serve(async (req) => {
	const authHeader = req.headers.get("Authorization");
	const jwt = authHeader?.replace("Bearer ", "");

	if (!jwt) {
		return new Response(JSON.stringify({ error: "No JWT token provided" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
	if (authError || !user) {
		return new Response(JSON.stringify({ error: "Invalid or expired JWT token" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const { data: existingSub } = await supabase
			.from("subscription")
			.select("stripe_customer_id, status")
			.eq("user_id", user.id)
			.maybeSingle();

		if (existingSub?.status === "active") {
			return new Response(JSON.stringify({ error: "Already subscribed" }), {
				status: 409,
				headers: { "Content-Type": "application/json" },
			});
		}

		let customerId = existingSub?.stripe_customer_id ?? null;
		if (!customerId) {
			const customer = await stripeRequest("/customers", { email: user.email ?? "" }) as { id: string };
			customerId = customer.id;
		}

		const sessionParams: Record<string, unknown> = {
			mode: "subscription",
			"payment_method_types[0]": "card",
			"line_items[0][quantity]": "1",
			customer: customerId,
			"metadata[user_id]": user.id,
			success_url: "triploom://subscription-success",
			cancel_url: "triploom://subscription-cancel",
		};

		if (STRIPE_PRICE_NOK_MONTHLY) {
			sessionParams["line_items[0][price]"] = STRIPE_PRICE_NOK_MONTHLY;
		} else {
			sessionParams["line_items[0][price_data][currency]"] = "nok";
			sessionParams["line_items[0][price_data][unit_amount]"] = "2900";
			sessionParams["line_items[0][price_data][recurring][interval]"] = "month";
			sessionParams["line_items[0][price_data][product_data][name]"] = "Triploom Pro";
			sessionParams["line_items[0][price_data][product_data][description]"] =
				"Lag flere turer og organiser reiser uten begrensninger.";
		}

		const session = await stripeRequest("/checkout/sessions", sessionParams) as { url: string };

		await supabase.from("subscription").upsert(
			{ user_id: user.id, stripe_customer_id: customerId, status: "inactive", updated_at: new Date().toISOString() },
			{ onConflict: "user_id" },
		);

		return new Response(JSON.stringify({ url: session.url }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
});
