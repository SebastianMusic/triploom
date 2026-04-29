import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getPushTokensForChatRoomExcluding, sendNotification } from "../_shared/notifications.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (!secret || req.headers.get("X-Webhook-Secret") !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { record } = await req.json();
  const { content, user_id: senderId, group_chat_id: chatRoomId } = record;

  if (!chatRoomId || !senderId) {
    return new Response(
      JSON.stringify({ error: "Missing chatRoomId or senderId" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const [profileRes, roomRes] = await Promise.all([
      supabase.from("profile").select("user_name").eq("id", senderId).single(),
      supabase.from("group_chat").select("chat_name").eq("id", chatRoomId).single(),
    ]);

    const senderName = profileRes.data?.user_name ?? "Someone";
    const roomName = roomRes.data?.chat_name ?? "Chat";

    const hasText = content && content.trim().length > 0;
    const body = hasText
      ? `${senderName}: ${content}`
      : `${senderName} sent a photo`;

    const tokens = await getPushTokensForChatRoomExcluding(chatRoomId, senderId);
    const res = await sendNotification(tokens, roomName, body, { group_chat_id: chatRoomId });
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
