-- Fix the trigger to allow system/admin updates (e.g., migrations adding columns)
CREATE OR REPLACE FUNCTION public.enforce_influencer_link_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if no auth context (system/migration updates)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

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