-- Clean up remaining security issues

-- 1. Add a restrictive policy to login_attempts (system-only access via SECURITY DEFINER)
-- This table should not have direct user access
CREATE POLICY "No direct access - use security definer functions"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (false);

-- 2. Remove duplicate influencer clicks policy
DROP POLICY IF EXISTS "Rate-limited click tracking" ON public.influencer_clicks;

-- 3. Remove duplicate form rate limits policy if exists
DROP POLICY IF EXISTS "Allow insert for form rate limits" ON public.form_submission_rate_limits;

-- 4. For tables that MUST allow public inserts (nomination_submissions, influencer_clicks),
-- we add rate-limiting validation at the database level instead of RLS
-- The validation is already in place via triggers (validate_influencer_click, etc.)

-- 5. Add a note: These INSERT policies with (true) are intentional for:
-- - nomination_submissions: Public nomination forms
-- - influencer_clicks: Public click tracking
-- - form_submission_rate_limits: Trigger-based rate limiting
-- All have database-level rate limiting via triggers/functions

-- 6. Ensure form_submission_rate_limits has proper restrictive SELECT
DROP POLICY IF EXISTS "No direct select on rate limits" ON public.form_submission_rate_limits;
CREATE POLICY "No direct select on rate limits"
ON public.form_submission_rate_limits
FOR SELECT
TO authenticated, anon
USING (false);