-- Create campaign_updates table
CREATE TABLE public.campaign_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_updates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view updates for active campaigns
CREATE POLICY "Anyone can view campaign updates"
ON public.campaign_updates
FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE status = 'active'
  )
);

-- Policy: Campaign owners can create updates
CREATE POLICY "Campaign owners can create updates"
ON public.campaign_updates
FOR INSERT
WITH CHECK (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE creator_id = auth.uid()
  )
);

-- Policy: Campaign owners can update their updates
CREATE POLICY "Campaign owners can update their updates"
ON public.campaign_updates
FOR UPDATE
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE creator_id = auth.uid()
  )
);

-- Policy: Campaign owners can delete their updates
CREATE POLICY "Campaign owners can delete updates"
ON public.campaign_updates
FOR DELETE
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE creator_id = auth.uid()
  )
);

-- Create index for better query performance
CREATE INDEX idx_campaign_updates_campaign ON public.campaign_updates(campaign_id);

-- Create trigger for updated_at
CREATE TRIGGER update_campaign_updates_timestamp
BEFORE UPDATE ON public.campaign_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to notify donors about campaign updates
CREATE OR REPLACE FUNCTION public.notify_donors_of_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_campaign RECORD;
  v_donor RECORD;
BEGIN
  -- Get campaign details
  SELECT title INTO v_campaign FROM public.campaigns WHERE id = NEW.campaign_id;
  
  -- Create notifications for all donors of this campaign
  INSERT INTO public.notifications (user_id, title, message, type, reference_id)
  SELECT DISTINCT 
    d.donor_id,
    'Campaign Update: ' || v_campaign.title,
    'New update posted: ' || NEW.title,
    'campaign_update',
    NEW.campaign_id
  FROM public.donations d
  WHERE d.campaign_id = NEW.campaign_id
    AND d.status = 'completed';
  
  RETURN NEW;
END;
$$;

-- Create trigger to notify donors on new update
CREATE TRIGGER notify_donors_on_campaign_update
AFTER INSERT ON public.campaign_updates
FOR EACH ROW
EXECUTE FUNCTION public.notify_donors_of_update();