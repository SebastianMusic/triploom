import "@supabase/functions-js/edge-runtime.d.ts";
import { getPushTokensForTripExcluding, getPushTokensForUsers, sendNotification } from "../_shared/notifications.ts";

Deno.serve(async (req) => {
  const { title, body, tokens, trip_id, user_ids, exclude_user_id } = await req.json();

  if (!title || !body) {
    return new Response(
      JSON.stringify({ error: "title and body are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!tokens && !trip_id && !user_ids) {
    return new Response(
      JSON.stringify({ error: "one of tokens, trip_id, or user_ids is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    let resolvedTokens: string[];
    if (tokens) resolvedTokens = tokens;
    else if (trip_id) resolvedTokens = await getPushTokensForTripExcluding(trip_id, exclude_user_id ?? null);
    else resolvedTokens = await getPushTokensForUsers(user_ids);
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
