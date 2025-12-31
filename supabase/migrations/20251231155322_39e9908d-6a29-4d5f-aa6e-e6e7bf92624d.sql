-- Allow influencers to claim an unclaimed active link (one-time claim)
DROP POLICY IF EXISTS "Influencers can claim active influencer links" ON public.influencer_links;
CREATE POLICY "Influencers can claim active influencer links"
ON public.influencer_links
FOR UPDATE
USING (
  is_active = true
  AND influencer_user_id IS NULL
)
WITH CHECK (
  is_active = true
  AND influencer_user_id = auth.uid()
);

-- Create trigger to enforce that non-org users can only claim (set influencer_user_id) and not change other fields
CREATE OR REPLACE FUNCTION public.enforce_influencer_link_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Organizations can manage their own links
  IF auth.uid() = NEW.organization_id THEN
    RETURN NEW;
  END IF;

  -- Non-org updates: only allow a claim (NULL -> auth.uid()) and no other changes (except updated_at)
  IF NOT (
    OLD.influencer_user_id IS NULL
    AND NEW.influencer_user_id = auth.uid()
    AND (to_jsonb(NEW) - 'influencer_user_id' - 'updated_at') = (to_jsonb(OLD) - 'influencer_user_id' - 'updated_at')
  ) THEN
    RAISE EXCEPTION 'Influencer link updates are restricted';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_influencer_link_claim ON public.influencer_links;
CREATE TRIGGER trg_enforce_influencer_link_claim
BEFORE UPDATE ON public.influencer_links
FOR EACH ROW
EXECUTE FUNCTION public.enforce_influencer_link_claim();