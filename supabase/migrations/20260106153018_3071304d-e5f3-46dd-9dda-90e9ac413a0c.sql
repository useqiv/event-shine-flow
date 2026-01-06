-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove existing job if it exists (to avoid duplicates)
SELECT cron.unschedule('send-event-reminders-hourly') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-event-reminders-hourly');

-- Schedule hourly event reminder check (runs at the top of every hour)
SELECT cron.schedule(
  'send-event-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tirqmqzgksclsjxfiham.supabase.co/functions/v1/send-event-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpcnFtcXpna3NjbHNqeGZpaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzgyMTksImV4cCI6MjA4MjE1NDIxOX0.Y96LDtj66PRezBMQgyiNZw7ppDZ1vkeMuu5qkrExuPY'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);