-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the activate-scheduled-contests function to run every 5 minutes
SELECT cron.schedule(
  'activate-scheduled-contests',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://tirqmqzgksclsjxfiham.supabase.co/functions/v1/activate-scheduled-contests',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpcnFtcXpna3NjbHNqeGZpaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzgyMTksImV4cCI6MjA4MjE1NDIxOX0.Y96LDtj66PRezBMQgyiNZw7ppDZ1vkeMuu5qkrExuPY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);