-- Create event auto posts table similar to contest auto posts
CREATE TABLE public.event_auto_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'twitter',
  post_type TEXT NOT NULL DEFAULT 'event_countdown',
  schedule_interval TEXT NOT NULL DEFAULT 'daily',
  custom_message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_posted_at TIMESTAMP WITH TIME ZONE,
  next_post_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_auto_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Organizations can manage their own event auto-posts"
ON public.event_auto_posts
FOR ALL
USING (auth.uid() = organization_id);

CREATE POLICY "Admins can manage all event auto-posts"
ON public.event_auto_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_event_auto_posts_updated_at
BEFORE UPDATE ON public.event_auto_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();