-- Drop existing view and recreate with proper PII masking
DROP VIEW IF EXISTS public.donations_public;

CREATE VIEW public.donations_public
WITH (security_invoker = true)
AS
SELECT
  id,
  campaign_id,
  amount,
  currency,
  donor_message,
  is_anonymous,
  status,
  created_at,
  payment_method,
  CASE
    WHEN auth.uid() IN (SELECT creator_id FROM campaigns WHERE id = donations.campaign_id)
         OR has_role(auth.uid(), 'admin')
    THEN guest_name
    ELSE NULL
  END AS guest_name,
  CASE
    WHEN auth.uid() IN (SELECT creator_id FROM campaigns WHERE id = donations.campaign_id)
         OR has_role(auth.uid(), 'admin')
    THEN guest_email
    ELSE NULL
  END AS guest_email,
  CASE
    WHEN auth.uid() = donor_id
         OR auth.uid() IN (SELECT creator_id FROM campaigns WHERE id = donations.campaign_id)
         OR has_role(auth.uid(), 'admin')
    THEN donor_id
    ELSE NULL
  END AS donor_id
FROM public.donations;