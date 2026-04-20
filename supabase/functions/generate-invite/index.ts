import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ORGANIZER_ROLES } from "../_shared/types.ts"

const supabase = createClient(
	Deno.env.get("SUPABASE_URL")!,
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
	const authHeader = req.headers.get("Authorization");
	const jwt = authHeader?.replace("Bearer ", "");

	if (!jwt) {
		return new Response(
			JSON.stringify({ error: "No JWT token provided" }),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}

	const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

	if (authError || !user) {
		return new Response(
			JSON.stringify({ error: "Invalid or expired JWT token" }),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}

	let body;
	try {
		body = await req.json();
	} catch {
		return new Response(
			JSON.stringify({ error: "Invalid JSON body" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const { trip_id } = body;

	if (!trip_id) {
		return new Response(
			JSON.stringify({ error: "Missing trip_id" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const { data: participant, error: participantError } = await supabase
		.from("trip_participant")
		.select("role")
		.eq("trip_id", trip_id)
		.eq("user_id", user.id)
		.single();

	if (participantError) {
		return new Response(
			JSON.stringify({ error: "Failed to verify participant role" }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}

	if (!participant) {
		return new Response(
			JSON.stringify({ error: "User is not a participant in this trip" }),
			{ status: 403, headers: { "Content-Type": "application/json" } },
		);
	}

	const allowedRoles = ORGANIZER_ROLES;
	if (!allowedRoles.includes(participant.role)) {
		return new Response(
			JSON.stringify({ error: "Only organizers can generate invite links" }),
			{ status: 403, headers: { "Content-Type": "application/json" } },
		);
	}

	const token = crypto.randomUUID();

	const { error: upsertError } = await supabase
		.from("trip_invite_url")
		.upsert(
			{
				trip_id,
				invite_url: token,
				type: "default",
			},
			{
				onConflict: "trip_id",
			},
		);

	if (upsertError) {
		return new Response(
			JSON.stringify({ error: `Failed to create invite: ${upsertError.message}` }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}

	const invite_url = `triploom://join/${token}`;

	return new Response(
		JSON.stringify({ invite_url }),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
});
