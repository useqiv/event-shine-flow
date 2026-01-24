-- =====================================================
-- FIX 1: Voucher Double-Redemption Race Condition
-- =====================================================

-- Add advisory lock function for voucher redemption
CREATE OR REPLACE FUNCTION public.redeem_voucher_safely(
  p_voucher_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_voucher RECORD;
  v_lock_obtained BOOLEAN;
BEGIN
  -- Try to obtain advisory lock for this voucher
  v_lock_obtained := pg_try_advisory_xact_lock(hashtext(p_voucher_id::text));
  
  IF NOT v_lock_obtained THEN
    RAISE EXCEPTION 'Voucher is being processed by another request';
  END IF;
  
  -- Check voucher status with FOR UPDATE to lock row
  SELECT * INTO v_voucher 
  FROM public.vouchers 
  WHERE id = p_voucher_id 
  FOR UPDATE NOWAIT;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher not found';
  END IF;
  
  IF v_voucher.is_redeemed THEN
    RAISE EXCEPTION 'Voucher already redeemed';
  END IF;
  
  IF v_voucher.expires_at IS NOT NULL AND v_voucher.expires_at < NOW() THEN
    RAISE EXCEPTION 'Voucher has expired';
  END IF;
  
  -- Mark as redeemed
  UPDATE public.vouchers 
  SET is_redeemed = true, 
      redeemed_at = NOW(),
      redeemed_by = p_user_id
  WHERE id = p_voucher_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- FIX 2: Form Submission Rate Limiting
-- =====================================================

-- Create rate limit tracking table for form submissions
CREATE TABLE IF NOT EXISTS public.form_submission_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.form_submission_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow inserts (no reads for regular users)
DROP POLICY IF EXISTS "Allow insert for form rate limits" ON public.form_submission_rate_limits;
CREATE POLICY "Allow insert for form rate limits"
  ON public.form_submission_rate_limits
  FOR INSERT
  WITH CHECK (true);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_form_rate_limits_lookup 
  ON public.form_submission_rate_limits(form_id, ip_hash, submitted_at);

-- Auto-cleanup old rate limit records (keep only last 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_form_rate_limits()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.form_submission_rate_limits 
  WHERE submitted_at < NOW() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS cleanup_old_form_rate_limits ON public.form_submission_rate_limits;
CREATE TRIGGER cleanup_old_form_rate_limits
  AFTER INSERT ON public.form_submission_rate_limits
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_form_rate_limits();

-- Rate limiting trigger for form_responses (10 submissions per hour per IP per form)
CREATE OR REPLACE FUNCTION public.check_form_submission_rate()
RETURNS TRIGGER AS $$
DECLARE
  submission_count INTEGER;
  v_ip_hash TEXT;
BEGIN
  -- Get IP hash from session (or use a placeholder if not available)
  v_ip_hash := COALESCE(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    'unknown'
  );
  v_ip_hash := encode(sha256(v_ip_hash::bytea), 'hex');
  
  -- Count recent submissions
  SELECT COUNT(*) INTO submission_count
  FROM public.form_submission_rate_limits
  WHERE form_id = NEW.form_id
    AND ip_hash = v_ip_hash
    AND submitted_at > NOW() - INTERVAL '1 hour';
  
  IF submission_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 10 submissions per hour';
  END IF;
  
  -- Record this submission
  INSERT INTO public.form_submission_rate_limits (form_id, ip_hash)
  VALUES (NEW.form_id, v_ip_hash);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_form_submission_rate_limit ON public.form_responses;
CREATE TRIGGER enforce_form_submission_rate_limit
  BEFORE INSERT ON public.form_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.check_form_submission_rate();

-- Add size limit check for response_data
CREATE OR REPLACE FUNCTION public.check_form_response_size()
RETURNS TRIGGER AS $$
BEGIN
  -- Limit response_data to 100KB
  IF length(NEW.response_data::text) > 102400 THEN
    RAISE EXCEPTION 'Response data exceeds maximum size of 100KB';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_form_response_size ON public.form_responses;
CREATE TRIGGER enforce_form_response_size
  BEFORE INSERT OR UPDATE ON public.form_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.check_form_response_size();

-- =====================================================
-- FIX 3: Donor Contact Info Protection
-- =====================================================

-- Create safe view for donations that hides guest contact info
CREATE OR REPLACE VIEW public.donations_public WITH (security_invoker = true) AS
SELECT 
  id,
  campaign_id,
  donor_id,
  amount,
  currency,
  is_anonymous,
  donor_message,
  payment_method,
  status,
  created_at,
  -- Only show guest info to campaign owner or admin
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.campaigns c 
      WHERE c.id = donations.campaign_id 
      AND c.creator_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::app_role)
    THEN guest_email
    ELSE NULL
  END as guest_email,
  CASE 
    WHEN is_anonymous THEN NULL
    WHEN EXISTS (
      SELECT 1 FROM public.campaigns c 
      WHERE c.id = donations.campaign_id 
      AND c.creator_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::app_role)
    THEN guest_name
    ELSE NULL
  END as guest_name
FROM public.donations;

-- =====================================================
-- FIX 4: Social Media Token Protection
-- =====================================================

-- Create safe view for social accounts (excludes tokens)
CREATE OR REPLACE VIEW public.organization_social_accounts_safe WITH (security_invoker = true) AS
SELECT 
  id,
  organization_id,
  platform,
  account_name,
  is_connected,
  token_expires_at,
  created_at,
  updated_at
  -- Excludes: access_token, refresh_token
FROM public.organization_social_accounts;

-- =====================================================
-- FIX 5: Banking Details Protection
-- =====================================================

-- Create safe view for organization settings (excludes banking details for non-owners)
CREATE OR REPLACE VIEW public.organization_settings_safe WITH (security_invoker = true) AS
SELECT 
  id,
  organization_id,
  company_name,
  company_email,
  company_phone,
  company_address,
  default_currency,
  preferred_payout_method,
  created_at,
  updated_at,
  -- Only show banking details to the organization owner or admin
  CASE 
    WHEN organization_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN bank_name
    ELSE NULL
  END as bank_name,
  CASE 
    WHEN organization_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN account_number
    ELSE NULL
  END as account_number,
  CASE 
    WHEN organization_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN account_name
    ELSE NULL
  END as account_name,
  CASE 
    WHEN organization_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN usdt_address
    ELSE NULL
  END as usdt_address
FROM public.organization_settings;

-- Create safe view for payouts (excludes banking details for non-owners)
CREATE OR REPLACE VIEW public.payouts_safe WITH (security_invoker = true) AS
SELECT 
  id,
  organization_id,
  amount,
  currency,
  status,
  payment_method,
  reference_id,
  created_at,
  updated_at,
  processed_at,
  -- Only show banking details to the organization owner or admin
  CASE 
    WHEN organization_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN bank_name
    ELSE '***HIDDEN***'
  END as bank_name,
  CASE 
    WHEN organization_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN account_number
    ELSE '***HIDDEN***'
  END as account_number,
  CASE 
    WHEN organization_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN account_name
    ELSE '***HIDDEN***'
  END as account_name,
  CASE 
    WHEN organization_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN usdt_address
    ELSE '***HIDDEN***'
  END as usdt_address
FROM public.payouts;

-- Create safe view for influencer profiles
CREATE OR REPLACE VIEW public.influencer_profiles_safe WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  display_name,
  bio,
  total_earnings,
  pending_earnings,
  paid_earnings,
  payment_method,
  created_at,
  updated_at,
  -- Only show banking details to the influencer themselves or admin
  CASE 
    WHEN user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN bank_name
    ELSE NULL
  END as bank_name,
  CASE 
    WHEN user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN account_number
    ELSE NULL
  END as account_number,
  CASE 
    WHEN user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN account_name
    ELSE NULL
  END as account_name,
  CASE 
    WHEN user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN usdt_address
    ELSE NULL
  END as usdt_address
FROM public.influencer_profiles;

-- Create safe view for influencer payouts
CREATE OR REPLACE VIEW public.influencer_payouts_safe WITH (security_invoker = true) AS
SELECT 
  id,
  influencer_user_id,
  amount,
  currency,
  status,
  payment_method,
  created_at,
  updated_at,
  processed_at,
  processed_by,
  rejection_reason,
  -- Only show banking details to the influencer themselves or admin
  CASE 
    WHEN influencer_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN bank_name
    ELSE '***HIDDEN***'
  END as bank_name,
  CASE 
    WHEN influencer_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN account_number
    ELSE '***HIDDEN***'
  END as account_number,
  CASE 
    WHEN influencer_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN account_name
    ELSE '***HIDDEN***'
  END as account_name,
  CASE 
    WHEN influencer_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
    THEN usdt_address
    ELSE '***HIDDEN***'
  END as usdt_address
FROM public.influencer_payouts;