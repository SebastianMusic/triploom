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

	let body: { task_id?: string };
	try {
		body = await req.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { task_id } = body;
	if (!task_id) {
		return new Response(JSON.stringify({ error: "task_id is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Fetch task and its fields/options in one query
	const { data: task, error: taskError } = await supabase
		.from("task")
		.select(`
      id, title, trip_id,
      task_field (
        id, label, sort_order, type,
        task_field_option ( id, label, sort_order )
      )
    `)
		.eq("id", task_id)
		.single();

	if (taskError || !task) {
		return new Response(JSON.stringify({ error: "Task not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Verify the caller is an organizer or co-organizer of the trip
	const { data: participant } = await supabase
		.from("trip_participant")
		.select("role")
		.eq("trip_id", task.trip_id)
		.eq("user_id", user.id)
		.single();

	if (!participant || !ORGANIZER_ROLES.includes(participant.role)) {
		return new Response(
			JSON.stringify({ error: "Only organizers can export task data" }),
			{ status: 403, headers: { "Content-Type": "application/json" } },
		);
	}

	// Fetch the caller's email to send the export to
	const { data: callerProfile, error: profileError } = await supabase
		.from("profile")
		.select("email")
		.eq("id", user.id)
		.single();

	if (profileError || !callerProfile?.email) {
		return new Response(
			JSON.stringify({ error: "Could not resolve your profile email" }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}

	try {
		// Fetch assignments with participant profile info
		const { data: assignments, error: assignmentsError } = await supabase
			.from("task_assignment")
			.select(`
        participant_id, is_completed, completed_at, response,
        trip_participant:participant_id (
          user_id,
          profile:user_id ( user_name, email )
        )
      `)
			.eq("task_id", task_id);

		if (assignmentsError) throw new Error(assignmentsError.message);

		// Fetch all field responses for this task's participants
		const fields = [...((task as any).task_field ?? [])].sort(
			(a: any, b: any) => a.sort_order - b.sort_order,
		);

		const participantIds = (assignments ?? []).map((a: any) => a.participant_id);
		const fieldIds = fields.map((f: any) => f.id);

		let responses: any[] = [];
		if (participantIds.length > 0 && fieldIds.length > 0) {
			const { data: responseData, error: responsesError } = await supabase
				.from("task_field_response")
				.select("participant_id, task_field_id, value, is_checked, option_id")
				.in("participant_id", participantIds)
				.in("task_field_id", fieldIds);

			if (responsesError) throw new Error(responsesError.message);
			responses = responseData ?? [];
		}

		// Build lookup: option_id → label
		const optionLabel = new Map<string, string>();
		for (const field of fields) {
			for (const opt of (field.task_field_option ?? [])) {
				optionLabel.set(opt.id, opt.label);
			}
		}

		// Build lookup: "participantId::fieldId" → display value
		const responseValue = new Map<string, string>();
		for (const r of responses) {
			const key = `${r.participant_id}::${r.task_field_id}`;
			let val = "";
			if (r.option_id) {
				val = optionLabel.get(r.option_id) ?? "";
			} else if (r.value != null) {
				val = r.value;
			} else if (r.is_checked != null) {
				val = r.is_checked ? "Yes" : "No";
			}
			// A participant may have multiple responses for the same field (multi-select).
			// Append with a comma separator.
			const existing = responseValue.get(key);
			responseValue.set(key, existing ? `${existing}, ${val}` : val);
		}

		// Build one row per assignment (participant)
		const rows = (assignments ?? []).map((a: any) => {
			const row: Record<string, unknown> = {
				"Participant": (a.trip_participant as any)?.profile?.user_name ?? "",
				"Email": (a.trip_participant as any)?.profile?.email ?? "",
				"Completed": a.is_completed ? "Yes" : "No",
				"Completed At": a.is_completed ? (a.completed_at ?? "") : "",
			};
			for (const field of fields) {
				row[field.label] =
					responseValue.get(`${a.participant_id}::${field.id}`) ?? "";
			}
			return row;
		});

		const spreadsheetBase64 = jsonToSpreadsheetBase64(rows, "Responses");

		await sendSpreadsheetEmail({
			to: callerProfile.email,
			subject: `Task Export: ${(task as any).title ?? task_id}`,
			description: `Attached is the responses export for the task "${(task as any).title ?? task_id}".`,
			spreadsheetBase64,
			filename: "task-responses.xlsx",
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
