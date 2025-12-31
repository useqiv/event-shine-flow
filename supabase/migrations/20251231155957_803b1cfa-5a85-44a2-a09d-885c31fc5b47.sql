-- Add commission_currency column to influencer_links
ALTER TABLE public.influencer_links
ADD COLUMN IF NOT EXISTS commission_currency TEXT DEFAULT 'NGN';

-- Update existing links to inherit currency from their linked entity
UPDATE public.influencer_links il
SET commission_currency = COALESCE(
  -- Get currency from contest's vote_currency
  (SELECT c.vote_currency FROM public.contests c WHERE c.id = il.contest_id),
  -- Or get currency from the first ticket type of the event
  (SELECT tt.currency FROM public.ticket_types tt WHERE tt.event_id = il.event_id LIMIT 1),
  'NGN'
);

-- Create function to auto-set commission_currency on new links
CREATE OR REPLACE FUNCTION public.set_influencer_link_currency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If currency not set, derive from linked entity
  IF NEW.commission_currency IS NULL OR NEW.commission_currency = '' THEN
    IF NEW.contest_id IS NOT NULL THEN
      SELECT vote_currency INTO NEW.commission_currency
      FROM public.contests WHERE id = NEW.contest_id;
    ELSIF NEW.event_id IS NOT NULL THEN
      SELECT currency INTO NEW.commission_currency
      FROM public.ticket_types WHERE event_id = NEW.event_id LIMIT 1;
    END IF;
  END IF;
  
  -- Default to NGN if still not set
  IF NEW.commission_currency IS NULL OR NEW.commission_currency = '' THEN
    NEW.commission_currency := 'NGN';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_influencer_link_currency ON public.influencer_links;
CREATE TRIGGER trg_set_influencer_link_currency
BEFORE INSERT ON public.influencer_links
FOR EACH ROW
EXECUTE FUNCTION public.set_influencer_link_currency();