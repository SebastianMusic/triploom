import "@supabase/functions-js/edge-runtime.d.ts";
import { getPushTokensForTrip, sendNotification } from "../_shared/notifications.ts";

Deno.serve(async (req) => {
  const { title, body, tokens, trip_id } = await req.json();

  if (!title || !body) {
    return new Response(
      JSON.stringify({ error: "title and body are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!tokens && !trip_id) {
    return new Response(
      JSON.stringify({ error: "either tokens or trip_id is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const resolvedTokens: string[] = tokens ?? await getPushTokensForTrip(trip_id);
    const res = await sendNotification(resolvedTokens, title, body);
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
