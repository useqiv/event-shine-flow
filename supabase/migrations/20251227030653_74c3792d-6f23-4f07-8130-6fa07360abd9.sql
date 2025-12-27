-- Create campaigns table for crowdfunding
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  goal_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  donor_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create donations table
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  transaction_id UUID REFERENCES public.wallet_transactions(id),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  donor_message TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Anyone can view active campaigns"
  ON public.campaigns FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can view their own campaigns"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Authenticated users can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own draft campaigns"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = creator_id AND status = 'draft');

CREATE POLICY "Admins can manage all campaigns"
  ON public.campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Donations policies
CREATE POLICY "Campaign owners can view their donations"
  ON public.donations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = donations.campaign_id 
    AND campaigns.creator_id = auth.uid()
  ));

CREATE POLICY "Donors can view their own donations"
  ON public.donations FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Authenticated users can donate"
  ON public.donations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Admins can manage all donations"
  ON public.donations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view non-anonymous donations on active campaigns"
  ON public.donations FOR SELECT
  USING (
    is_anonymous = false AND 
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = donations.campaign_id AND campaigns.status = 'active')
  );

-- Create trigger to update campaign stats on new donation
CREATE OR REPLACE FUNCTION public.update_campaign_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.campaigns
  SET 
    current_amount = current_amount + NEW.amount,
    donor_count = donor_count + 1,
    updated_at = now()
  WHERE id = NEW.campaign_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_donation_created
  AFTER INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_stats();

-- Create updated_at trigger for campaigns
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_campaigns_creator ON public.campaigns(creator_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_category ON public.campaigns(category);
CREATE INDEX idx_donations_campaign ON public.donations(campaign_id);
CREATE INDEX idx_donations_donor ON public.donations(donor_id);