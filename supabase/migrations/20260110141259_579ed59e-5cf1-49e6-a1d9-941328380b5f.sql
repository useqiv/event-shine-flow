-- =============================================
-- FIX #1: PROFILES TABLE - Restrict public access to PII
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create policy: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = profiles.id);

-- Create policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy: Organization team members can see limited profile info
-- (This allows team invites and member displays to work)
CREATE POLICY "Team members can view teammate profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.organization_id = tm2.organization_id
    WHERE tm1.user_id = profiles.id AND tm2.user_id = auth.uid()
  )
);

-- =============================================
-- FIX #2: DONATIONS TABLE - Protect anonymous donor identity
-- =============================================

-- Drop the overly permissive policy that shows ALL donations
DROP POLICY IF EXISTS "Authenticated users can view donations" ON public.donations;

-- Drop old campaign owner policy
DROP POLICY IF EXISTS "Campaign owners can view their donations" ON public.donations;

-- Recreate: Campaign owners can see donation records
CREATE POLICY "Campaign owners can view their campaign donations" 
ON public.donations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = donations.campaign_id 
    AND campaigns.creator_id = auth.uid()
  )
);

-- Create a secure view for campaign owners that hides anonymous donor info
CREATE OR REPLACE VIEW public.donations_safe AS
SELECT 
  donations.id,
  donations.campaign_id,
  CASE WHEN donations.is_anonymous THEN NULL ELSE donations.donor_id END as donor_id,
  donations.amount,
  donations.currency,
  donations.payment_method,
  donations.status,
  CASE WHEN donations.is_anonymous THEN NULL ELSE donations.donor_message END as donor_message,
  donations.is_anonymous,
  donations.transaction_id,
  donations.created_at
FROM public.donations;

-- Grant access to the view
GRANT SELECT ON public.donations_safe TO authenticated;
GRANT SELECT ON public.donations_safe TO anon;