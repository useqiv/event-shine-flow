-- Fix remaining RLS "Always True" policies by adding database-level validation
-- These INSERT policies must remain permissive for public access, but we add rate limiting via triggers

-- =============================================
-- 1. Ensure nomination_submissions has rate limiting trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_nomination_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_recent_submissions INTEGER;
  v_ip_hash TEXT;
BEGIN
  -- Generate IP hash for rate limiting (use email as fallback identifier)
  v_ip_hash := encode(sha256(COALESCE(NEW.submitter_email, 'anonymous')::bytea), 'hex');
  
  -- Check for rate limiting: max 5 submissions per email per hour per category
  SELECT COUNT(*) INTO v_recent_submissions
  FROM public.nomination_submissions
  WHERE category_id = NEW.category_id
    AND submitter_email = NEW.submitter_email
    AND submitted_at > NOW() - INTERVAL '1 hour';
  
  IF v_recent_submissions >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 5 nominations per hour per category';
  END IF;
  
  -- Validate required fields
  IF NEW.submitter_email IS NULL OR NEW.submitter_email = '' THEN
    RAISE EXCEPTION 'Submitter email is required';
  END IF;
  
  IF NEW.nominee_name IS NULL OR NEW.nominee_name = '' THEN
    RAISE EXCEPTION 'Nominee name is required';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS validate_nomination_submission_trigger ON public.nomination_submissions;
CREATE TRIGGER validate_nomination_submission_trigger
  BEFORE INSERT ON public.nomination_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_nomination_submission();

-- =============================================
-- 2. Ensure influencer_clicks validation trigger exists
-- (Already exists as validate_influencer_click, but let's verify/enhance it)
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_influencer_click()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_recent_clicks INTEGER;
  v_link_exists BOOLEAN;
BEGIN
  -- Verify the link exists and is active
  SELECT EXISTS (
    SELECT 1 FROM public.influencer_links 
    WHERE id = NEW.link_id AND is_active = true
  ) INTO v_link_exists;
  
  IF NOT v_link_exists THEN
    RETURN NULL; -- Silently reject invalid link clicks
  END IF;
  
  -- Rate limit: max 10 clicks per IP hash per hour per link
  IF NEW.ip_hash IS NOT NULL THEN
    SELECT COUNT(*) INTO v_recent_clicks
    FROM public.influencer_clicks
    WHERE link_id = NEW.link_id
      AND ip_hash = NEW.ip_hash
      AND clicked_at > NOW() - INTERVAL '1 hour';
    
    IF v_recent_clicks >= 10 THEN
      RETURN NULL; -- Silently reject excessive clicks (don't error for tracking)
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS validate_influencer_click_trigger ON public.influencer_clicks;
CREATE TRIGGER validate_influencer_click_trigger
  BEFORE INSERT ON public.influencer_clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_influencer_click();

-- =============================================
-- 3. Add INSERT policy for form_submission_rate_limits (trigger-protected)
-- =============================================
DROP POLICY IF EXISTS "System can insert rate limits" ON public.form_submission_rate_limits;

-- Only allow inserts with valid form_id reference
CREATE POLICY "Rate limit inserts require valid form"
ON public.form_submission_rate_limits
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forms f 
    WHERE f.id = form_id 
    AND f.is_active = true
    AND f.is_accepting_responses = true
  )
);

-- =============================================
-- 4. Clean up duplicate policies
-- =============================================
DROP POLICY IF EXISTS "Organizations can view submissions for their nominations" ON public.nomination_submissions;
DROP POLICY IF EXISTS "Organizations can view clicks on their links" ON public.influencer_clicks;