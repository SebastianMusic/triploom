import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ORGANIZER_ROLES } from "../_shared/types.ts";
import { jsonToSpreadsheetBase64 } from "../_shared/spreadsheet.ts";
import { sendSpreadsheetEmail } from "../_shared/email.ts";

const supabase = createClient(
	Deno.env.get("SUPABASE_URL")!,
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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
		return new Response(
			JSON.stringify({ error: "Invalid or expired JWT token" }),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}

	let body: { trip_id?: string; email?: string };
	try {
		body = await req.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { trip_id, email } = body;
	if (!trip_id || !email) {
		return new Response(
			JSON.stringify({ error: "trip_id and email are required" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const { data: participant } = await supabase
		.from("trip_participant")
		.select("role")
		.eq("trip_id", trip_id)
		.eq("user_id", user.id)
		.single();

	if (!participant || !ORGANIZER_ROLES.includes(participant.role)) {
		return new Response(
			JSON.stringify({ error: "Only organizers can export data" }),
			{ status: 403, headers: { "Content-Type": "application/json" } },
		);
	}

	try {
		const { data: events, error: eventsError } = await supabase
			.from("event")
			.select(`
        title,
        description,
        location,
        start_time,
        end_time,
        is_optional,
        price_range,
        event_participation (
          role,
          trip_participant:participant_id (
            profile:user_id ( user_name, email )
          )
        )
      `)
			.eq("trip_id", trip_id);

		if (eventsError) throw new Error(eventsError.message);

		const rows = (events ?? []).flatMap((event: any) => {
			const participations: any[] = event.event_participation ?? [];
			if (participations.length === 0) {
				return [{
					title: event.title ?? "",
					description: event.description ?? "",
					location: event.location ?? "",
					start_time: event.start_time ?? "",
					end_time: event.end_time ?? "",
					is_optional: event.is_optional ? "Yes" : "No",
					price_range: event.price_range ?? "",
					participant_name: "",
					participant_email: "",
					participant_role: "",
				}];
			}
			return participations.map((p: any) => ({
				title: event.title ?? "",
				description: event.description ?? "",
				location: event.location ?? "",
				start_time: event.start_time ?? "",
				end_time: event.end_time ?? "",
				is_optional: event.is_optional ? "Yes" : "No",
				price_range: event.price_range ?? "",
				participant_name: p.trip_participant?.profile?.user_name ?? "",
				participant_email: p.trip_participant?.profile?.email ?? "",
				participant_role: p.role ?? "",
			}));
		});

		const spreadsheetBase64 = jsonToSpreadsheetBase64(rows, "Events");

		await sendSpreadsheetEmail({
			to: email,
			subject: "Trip Events Export",
			description:
				"Please find attached the events export for your trip.",
			spreadsheetBase64,
			filename: "events.xlsx",
		});

		return new Response(JSON.stringify({ success: true }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err.message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
});
