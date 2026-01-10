-- Fix the security definer view issue by using SECURITY INVOKER
DROP VIEW IF EXISTS public.donations_safe;

CREATE VIEW public.donations_safe 
WITH (security_invoker = true) AS
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