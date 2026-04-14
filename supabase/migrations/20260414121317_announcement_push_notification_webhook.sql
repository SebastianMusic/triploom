create trigger "announcement_push_notification"
after insert on public.announcement
for each row
execute function supabase_functions.http_request(
  'https://ccyrwyfmijmqijpyvefo.supabase.co/functions/v1/webhook-announcement-notification',
  'POST',
  '{"Content-Type":"application/json","X-Webhook-Secret":"<WEBHOOK_SECRET>"}',
  '{}',
  '5000'
);
