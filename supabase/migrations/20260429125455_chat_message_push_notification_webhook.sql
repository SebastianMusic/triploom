create trigger "chat_message_push_notification"
after insert on public.message
for each row
execute function supabase_functions.http_request(
  'https://ccyrwyfmijmqijpyvefo.supabase.co/functions/v1/webhook-chat-message-notification',
  'POST',
  '{"Content-Type":"application/json","X-Webhook-Secret":"<WEBHOOK_SECRET>"}',
  '{}',
  '5000'
);
