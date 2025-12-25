-- Create table for auto-posting schedules
CREATE TABLE public.contest_auto_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  platform TEXT NOT NULL DEFAULT 'twitter',
  post_type TEXT NOT NULL DEFAULT 'leaderboard',
  schedule_interval TEXT NOT NULL DEFAULT 'daily',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_posted_at TIMESTAMP WITH TIME ZONE,
  next_post_at TIMESTAMP WITH TIME ZONE,
  custom_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contest_id, platform, post_type)
);

-- Enable RLS
ALTER TABLE public.contest_auto_posts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Organizations can manage their own auto-posts"
ON public.contest_auto_posts
FOR ALL
USING (auth.uid() = organization_id);

CREATE POLICY "Admins can manage all auto-posts"
ON public.contest_auto_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for efficient querying
CREATE INDEX idx_contest_auto_posts_next_post ON public.contest_auto_posts(next_post_at) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_contest_auto_posts_updated_at
BEFORE UPDATE ON public.contest_auto_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();