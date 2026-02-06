-- Schedule weekly organization report every Monday at 9 AM UTC
SELECT cron.schedule(
  'send-weekly-org-report',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://tirqmqzgksclsjxfiham.supabase.co/functions/v1/send-weekly-org-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpcnFtcXpna3NjbHNqeGZpaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzgyMTksImV4cCI6MjA4MjE1NDIxOX0.Y96LDtj66PRezBMQgyiNZw7ppDZ1vkeMuu5qkrExuPY'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);