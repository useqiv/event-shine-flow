-- Fix SECURITY DEFINER views by recreating with SECURITY INVOKER
-- This ensures RLS policies are checked against the querying user

DROP VIEW IF EXISTS public.influencer_links_public;
CREATE VIEW public.influencer_links_public 
WITH (security_invoker = true) AS
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

GRANT SELECT ON public.influencer_links_public TO anon, authenticated;

DROP VIEW IF EXISTS public.organization_webhooks_safe;
CREATE VIEW public.organization_webhooks_safe 
WITH (security_invoker = true) AS
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