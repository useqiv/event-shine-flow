-- =====================================================
-- FIX: Create secure views for votes and tickets (masking guest info)
-- =====================================================

-- Create a secure view for votes that masks guest info from non-owners
CREATE OR REPLACE VIEW public.votes_public WITH (security_invoker = true) AS
SELECT 
  v.id,
  v.contest_id,
  v.contestant_id,
  v.user_id,
  v.quantity,
  v.amount_paid,
  v.payment_method,
  v.created_at,
  v.transaction_id,
  v.currency,
  v.platform_commission,
  v.net_amount,
  -- Mask guest info unless user is contest owner or admin
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.contests c 
      WHERE c.id = v.contest_id 
      AND c.organization_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin'::app_role)
    THEN v.guest_email
    ELSE NULL
  END as guest_email,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.contests c 
      WHERE c.id = v.contest_id 
      AND c.organization_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin'::app_role)
    THEN v.guest_name
    ELSE NULL
  END as guest_name
FROM public.votes v;

-- Create a secure view for tickets that masks guest info from non-owners
CREATE OR REPLACE VIEW public.tickets_public WITH (security_invoker = true) AS
SELECT 
  t.id,
  t.event_id,
  t.ticket_type_id,
  t.user_id,
  t.quantity,
  t.amount_paid,
  t.payment_method,
  t.qr_code,
  t.status,
  t.created_at,
  t.transaction_id,
  t.payment_reference_id,
  t.platform_commission,
  t.net_amount,
  -- Mask guest info unless user is event owner or admin
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = t.event_id 
      AND e.organization_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin'::app_role)
    THEN t.guest_email
    ELSE NULL
  END as guest_email,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = t.event_id 
      AND e.organization_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin'::app_role)
    THEN t.guest_name
    ELSE NULL
  END as guest_name
FROM public.tickets t;

-- Grant access to the views
GRANT SELECT ON public.votes_public TO authenticated;
GRANT SELECT ON public.tickets_public TO authenticated;