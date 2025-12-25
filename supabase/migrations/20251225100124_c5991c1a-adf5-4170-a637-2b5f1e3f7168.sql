-- Schedule the social post function to run every hour
SELECT cron.schedule(
  'scheduled-social-post-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tirqmqzgksclsjxfiham.supabase.co/functions/v1/scheduled-social-post',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpcnFtcXpna3NjbHNqeGZpaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzgyMTksImV4cCI6MjA4MjE1NDIxOX0.Y96LDtj66PRezBMQgyiNZw7ppDZ1vkeMuu5qkrExuPY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);