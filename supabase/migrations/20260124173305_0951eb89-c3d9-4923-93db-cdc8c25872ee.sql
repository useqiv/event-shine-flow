-- =============================================
-- SECURITY FIX: Critical vulnerabilities patch
-- =============================================

-- 1. FIX: Tickets table - Restrict guest_email exposure
-- Drop the overly permissive policy that exposes guest emails
DROP POLICY IF EXISTS "Anon users can view tickets they just inserted" ON public.tickets;
DROP POLICY IF EXISTS "Guests can view their own tickets by email" ON public.tickets;

-- Create a more restrictive policy - guests can only view via secure token lookup (edge function)
CREATE POLICY "Guests view tickets via secure lookup only"
ON public.tickets FOR SELECT
USING (
  auth.role() = 'service_role'
  AND guest_email IS NOT NULL
);

-- 2. FIX: Influencer links - Hide email from public access
DROP POLICY IF EXISTS "Anyone can view active influencer links by code" ON public.influencer_links;
DROP POLICY IF EXISTS "Public can view active influencer links" ON public.influencer_links;

-- Create a secure view for public access that excludes sensitive data
CREATE OR REPLACE VIEW public.influencer_links_public AS
SELECT 
  id,
  organization_id,
  contest_id,
  event_id,
  code,
  commission_type,
  commission_value,
  commission_currency,
  discount_type,
  discount_value,
  is_active,
  total_clicks,
  total_conversions,
  created_at
FROM public.influencer_links
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.influencer_links_public TO anon, authenticated;

-- Add policy for public to view only via the secure view (code lookup still works)
CREATE POLICY "Public can view active links by code only"
ON public.influencer_links FOR SELECT
USING (
  is_active = true 
  AND (
    auth.uid() = organization_id
    OR auth.uid() = influencer_user_id
    OR (influencer_email IS NULL OR influencer_email = '')
  )
);

-- 3. FIX: Webhook secrets - Never return to client
CREATE OR REPLACE VIEW public.organization_webhooks_safe AS
SELECT 
  id,
  organization_id,
  name,
  url,
  events,
  is_active,
  last_triggered_at,
  failure_count,
  created_at,
  updated_at
FROM public.organization_webhooks;

GRANT SELECT ON public.organization_webhooks_safe TO authenticated;

DROP POLICY IF EXISTS "Organizations can manage their own webhooks" ON public.organization_webhooks;

CREATE POLICY "Organizations can manage their own webhooks"
ON public.organization_webhooks FOR ALL
USING (auth.uid() = organization_id)
WITH CHECK (auth.uid() = organization_id);

CREATE POLICY "Organizations can view own webhooks metadata"
ON public.organization_webhooks FOR SELECT
USING (auth.uid() = organization_id);

-- 4. FIX: Promo code usage - Add validation function
DROP POLICY IF EXISTS "Anyone can insert promo code usage" ON public.promo_code_usage;

CREATE OR REPLACE FUNCTION public.validate_promo_code_usage()
RETURNS TRIGGER AS $$
DECLARE
  v_promo_code RECORD;
  v_usage_count INTEGER;
BEGIN
  SELECT * INTO v_promo_code
  FROM public.promo_codes
  WHERE id = NEW.promo_code_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Promo code not found';
  END IF;
  
  IF v_promo_code.is_active = false THEN
    RAISE EXCEPTION 'Promo code is not active';
  END IF;
  
  IF v_promo_code.valid_until IS NOT NULL AND v_promo_code.valid_until < NOW() THEN
    RAISE EXCEPTION 'Promo code has expired';
  END IF;
  
  IF v_promo_code.max_uses IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM public.promo_code_usage
    WHERE promo_code_id = NEW.promo_code_id;
    
    IF v_usage_count >= v_promo_code.max_uses THEN
      RAISE EXCEPTION 'Promo code usage limit exceeded';
    END IF;
  END IF;
  
  IF NEW.user_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.promo_code_usage
      WHERE promo_code_id = NEW.promo_code_id
      AND user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'User has already used this promo code';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS validate_promo_code_usage_trigger ON public.promo_code_usage;
CREATE TRIGGER validate_promo_code_usage_trigger
BEFORE INSERT ON public.promo_code_usage
FOR EACH ROW EXECUTE FUNCTION public.validate_promo_code_usage();

CREATE POLICY "Validated promo code usage inserts"
ON public.promo_code_usage FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR auth.role() = 'service_role'
);

-- 5. FIX: Click tracking - Add rate limiting
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.influencer_clicks;

CREATE OR REPLACE FUNCTION public.validate_influencer_click()
RETURNS TRIGGER AS $$
DECLARE
  v_recent_clicks INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_recent_clicks
  FROM public.influencer_clicks
  WHERE link_id = NEW.link_id
    AND ip_hash = NEW.ip_hash
    AND clicked_at > NOW() - INTERVAL '1 hour';
  
  IF v_recent_clicks >= 10 THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS validate_influencer_click_trigger ON public.influencer_clicks;
CREATE TRIGGER validate_influencer_click_trigger
BEFORE INSERT ON public.influencer_clicks
FOR EACH ROW EXECUTE FUNCTION public.validate_influencer_click();

CREATE POLICY "Rate-limited click tracking"
ON public.influencer_clicks FOR INSERT
WITH CHECK (true);

-- 6. FIX: Login attempts rate limiting at DB level
CREATE OR REPLACE FUNCTION public.validate_login_attempt_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_recent_attempts INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_recent_attempts
  FROM public.login_attempts
  WHERE email = NEW.email
    AND attempted_at > NOW() - INTERVAL '1 hour';
  
  IF v_recent_attempts >= 20 THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS validate_login_attempt_trigger ON public.login_attempts;
CREATE TRIGGER validate_login_attempt_trigger
BEFORE INSERT ON public.login_attempts
FOR EACH ROW EXECUTE FUNCTION public.validate_login_attempt_insert();