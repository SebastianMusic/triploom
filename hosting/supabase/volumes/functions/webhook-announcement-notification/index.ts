import "@supabase/functions-js/edge-runtime.d.ts";
import { getPushTokensForTrip, sendNotification } from "../_shared/notifications.ts";
import type { Tables } from "../../../types/database.types.ts";

// This function is designed to be called exclusively from the Supabase database
// webhook that fires on INSERT into the announcement table. It assumes the
// incoming body is a Supabase webhook payload.

Deno.serve(async (req) => {
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (!secret || req.headers.get("X-Webhook-Secret") !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { record }: { record: Tables<"announcement"> } = await req.json();

  const { trip_id, title, description } = record;


  if (!trip_id || !title) {
    return new Response(
      JSON.stringify({ error: "record is missing trip_id or title" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const tokens = await getPushTokensForTrip(trip_id);
    const res = await sendNotification(tokens, title, description ?? "");
    return new Response(JSON.stringify(res), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
