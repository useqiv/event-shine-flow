-- Create campaign analytics table for tracking metrics
CREATE TABLE public.campaign_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour INTEGER,
  views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  donations_count INTEGER NOT NULL DEFAULT 0,
  donations_amount NUMERIC NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  source VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_campaign_analytics UNIQUE (campaign_id, date, hour, source)
);

-- Enable RLS
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Campaign owners can view their analytics
CREATE POLICY "Campaign owners can view analytics"
ON public.campaign_analytics
FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE creator_id = auth.uid()
  )
);

-- Policy: Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
ON public.campaign_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to track campaign views
CREATE OR REPLACE FUNCTION public.track_campaign_view(
  p_campaign_id UUID,
  p_source VARCHAR DEFAULT 'direct'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.campaign_analytics (campaign_id, date, hour, views, unique_visitors, source)
  VALUES (
    p_campaign_id,
    CURRENT_DATE,
    EXTRACT(HOUR FROM NOW())::INTEGER,
    1,
    1,
    p_source
  )
  ON CONFLICT (campaign_id, date, hour, source)
  DO UPDATE SET
    views = campaign_analytics.views + 1;
END;
$$;

-- Create trigger to track donations in analytics
CREATE OR REPLACE FUNCTION public.track_donation_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.campaign_analytics (campaign_id, date, hour, donations_count, donations_amount, source)
  VALUES (
    NEW.campaign_id,
    CURRENT_DATE,
    EXTRACT(HOUR FROM NOW())::INTEGER,
    1,
    NEW.amount,
    'donation'
  )
  ON CONFLICT (campaign_id, date, hour, source)
  DO UPDATE SET
    donations_count = campaign_analytics.donations_count + 1,
    donations_amount = campaign_analytics.donations_amount + NEW.amount;
  
  RETURN NEW;
END;
$$;

-- Create trigger on donations table
CREATE TRIGGER track_donation_analytics_trigger
AFTER INSERT ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.track_donation_analytics();

-- Create index for better query performance
CREATE INDEX idx_campaign_analytics_campaign_date ON public.campaign_analytics(campaign_id, date);
CREATE INDEX idx_campaign_analytics_date ON public.campaign_analytics(date);