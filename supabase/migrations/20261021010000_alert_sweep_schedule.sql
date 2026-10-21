-- Every minute, ask the app to send any WhatsApp alerts that are due (mainly the locum wave
-- once the preferred head start ends). The endpoint is idempotent, so extra calls are harmless.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule(
  'class-cover-alert-sweep',
  '* * * * *',
  $$ select net.http_post(url := 'https://class-cover-five.vercel.app/api/notify/sweep', body := '{}'::jsonb, timeout_milliseconds := 20000) $$
);
