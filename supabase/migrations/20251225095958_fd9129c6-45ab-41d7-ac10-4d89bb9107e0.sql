-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create table to track social post analytics
CREATE TABLE public.social_post_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  platform TEXT NOT NULL,
  post_type TEXT NOT NULL,
  content TEXT,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  engagement_clicks INTEGER DEFAULT 0,
  engagement_impressions INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.social_post_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Organizations can view their own post logs"
ON public.social_post_logs
FOR SELECT
USING (auth.uid() = organization_id);

CREATE POLICY "Organizations can insert their own post logs"
ON public.social_post_logs
FOR INSERT
WITH CHECK (auth.uid() = organization_id);

-- Index for faster queries
CREATE INDEX idx_social_post_logs_org ON public.social_post_logs(organization_id);
CREATE INDEX idx_social_post_logs_contest ON public.social_post_logs(contest_id);
CREATE INDEX idx_social_post_logs_posted_at ON public.social_post_logs(posted_at DESC);