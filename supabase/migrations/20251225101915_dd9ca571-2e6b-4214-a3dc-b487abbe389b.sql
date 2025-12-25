-- Create influencer_links table for tracking referrals
CREATE TABLE public.influencer_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  contest_id uuid REFERENCES public.contests(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  commission_type text NOT NULL DEFAULT 'percentage',
  commission_value numeric NOT NULL DEFAULT 0,
  total_clicks integer NOT NULL DEFAULT 0,
  total_conversions integer NOT NULL DEFAULT 0,
  total_revenue numeric NOT NULL DEFAULT 0,
  total_commission numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_influencer_code UNIQUE (code)
);

-- Create influencer_clicks table for detailed analytics
CREATE TABLE public.influencer_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id uuid NOT NULL REFERENCES public.influencer_links(id) ON DELETE CASCADE,
  user_agent text,
  ip_hash text,
  referrer text,
  clicked_at timestamp with time zone NOT NULL DEFAULT now(),
  converted boolean NOT NULL DEFAULT false,
  conversion_amount numeric,
  converted_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.influencer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_clicks ENABLE ROW LEVEL SECURITY;

-- RLS policies for influencer_links
CREATE POLICY "Organizations can manage their own influencer links"
  ON public.influencer_links
  FOR ALL
  USING (auth.uid() = organization_id);

CREATE POLICY "Anyone can view active influencer links by code"
  ON public.influencer_links
  FOR SELECT
  USING (is_active = true);

-- RLS policies for influencer_clicks
CREATE POLICY "Organizations can view clicks on their links"
  ON public.influencer_clicks
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.influencer_links
    WHERE influencer_links.id = influencer_clicks.link_id
    AND influencer_links.organization_id = auth.uid()
  ));

CREATE POLICY "Anyone can insert clicks"
  ON public.influencer_clicks
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_influencer_links_organization ON public.influencer_links(organization_id);
CREATE INDEX idx_influencer_links_code ON public.influencer_links(code);
CREATE INDEX idx_influencer_clicks_link ON public.influencer_clicks(link_id);
CREATE INDEX idx_influencer_clicks_date ON public.influencer_clicks(clicked_at);

-- Trigger for updated_at
CREATE TRIGGER update_influencer_links_updated_at
  BEFORE UPDATE ON public.influencer_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();