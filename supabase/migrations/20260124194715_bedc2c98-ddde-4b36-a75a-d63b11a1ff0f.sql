-- Fix HIGH RISK: Always True RLS Policies
-- These tables have overly permissive policies that need to be restricted

-- =============================================
-- 1. FIX form_submission_rate_limits
-- Only system should write, no one should read directly
-- =============================================
DROP POLICY IF EXISTS "Anyone can insert rate limit records" ON public.form_submission_rate_limits;
DROP POLICY IF EXISTS "Anyone can view rate limits" ON public.form_submission_rate_limits;

-- Only allow inserts via trigger (SECURITY DEFINER functions bypass RLS)
-- No direct user access needed - this is internal rate limiting data

-- =============================================
-- 2. FIX login_attempts  
-- Only system should write, no one should read directly
-- =============================================
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Anyone can view login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow insert for rate limiting" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow select for rate limiting" ON public.login_attempts;

-- No direct user access - handled by SECURITY DEFINER functions (check_login_rate_limit, record_login_attempt)

-- =============================================
-- 3. FIX nomination_submissions
-- Users can only see their own submissions, orgs can see submissions to their nominations
-- =============================================
DROP POLICY IF EXISTS "Anyone can submit nominations" ON public.nomination_submissions;
DROP POLICY IF EXISTS "Anyone can view submissions" ON public.nomination_submissions;
DROP POLICY IF EXISTS "Public can submit nominations" ON public.nomination_submissions;
DROP POLICY IF EXISTS "Public can view approved submissions" ON public.nomination_submissions;

-- Allow public to submit (required for nomination forms)
CREATE POLICY "Public can submit nominations"
ON public.nomination_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only organization owners can view submissions to their nominations
CREATE POLICY "Organizations can view their nomination submissions"
ON public.nomination_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.nomination_categories nc
    JOIN public.nominations n ON n.id = nc.nomination_id
    WHERE nc.id = nomination_submissions.category_id
    AND n.organization_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Organizations can delete submissions from their nominations
CREATE POLICY "Organizations can delete their nomination submissions"
ON public.nomination_submissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.nomination_categories nc
    JOIN public.nominations n ON n.id = nc.nomination_id
    WHERE nc.id = nomination_submissions.category_id
    AND n.organization_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================
-- 4. FIX influencer_clicks
-- Only the influencer link system should write, limited read access
-- =============================================
DROP POLICY IF EXISTS "Anyone can record clicks" ON public.influencer_clicks;
DROP POLICY IF EXISTS "Anyone can view clicks" ON public.influencer_clicks;
DROP POLICY IF EXISTS "Public can record clicks" ON public.influencer_clicks;
DROP POLICY IF EXISTS "Link owners can view clicks" ON public.influencer_clicks;

-- Allow public click recording (required for tracking)
CREATE POLICY "Public can record influencer clicks"
ON public.influencer_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only organization owners and assigned influencers can view click data
CREATE POLICY "Link owners can view their click data"
ON public.influencer_clicks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.influencer_links il
    WHERE il.id = influencer_clicks.link_id
    AND (
      il.organization_id = auth.uid()
      OR il.influencer_user_id = auth.uid()
    )
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================
-- 5. Additional: Ensure votes table has proper guest protection
-- =============================================
DROP POLICY IF EXISTS "Anyone can insert votes" ON public.votes;

-- Allow authenticated users to vote, allow anon for guest votes
CREATE POLICY "Users can insert votes"
ON public.votes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

CREATE POLICY "Guest votes allowed"
ON public.votes
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
);

-- =============================================
-- 6. Additional: Ensure tickets table has proper guest protection
-- =============================================
DROP POLICY IF EXISTS "Anyone can purchase tickets" ON public.tickets;

-- Allow authenticated users to purchase
CREATE POLICY "Users can purchase tickets"
ON public.tickets
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

-- Allow anon for guest purchases
CREATE POLICY "Guest ticket purchases allowed"
ON public.tickets
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
);