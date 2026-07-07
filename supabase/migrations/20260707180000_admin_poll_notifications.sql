-- Poll approval stats for admin dashboard + email notification setting
INSERT INTO public.platform_settings (setting_key, setting_value, category, value_type, description)
VALUES (
  'notify_poll_requests',
  'true',
  'notification',
  'boolean',
  'Notify admins when a poll / quick vote is created or submitted for approval'
)
ON CONFLICT (setting_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_admin_statistics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'user')),
    'total_organizations', (SELECT COUNT(*) FROM user_roles WHERE role = 'organization'),
    'active_contests', (SELECT COUNT(*) FROM contests WHERE is_active = true AND end_date > NOW()),
    'active_events', (SELECT COUNT(*) FROM events WHERE is_active = true AND event_date > NOW()),
    'total_revenue', (SELECT COALESCE(SUM(amount_paid), 0) FROM votes) + (SELECT COALESCE(SUM(amount_paid), 0) FROM tickets),
    'pending_payouts', (SELECT COALESCE(SUM(amount), 0) FROM payouts WHERE status = 'pending'),
    'total_tickets_sold', (SELECT COALESCE(SUM(quantity), 0) FROM tickets),
    'total_votes', (SELECT COALESCE(SUM(quantity), 0) FROM votes),
    'pending_fraud_alerts', (SELECT COUNT(*) FROM fraud_alerts WHERE status = 'pending'),
    'pending_content_reviews', (SELECT COUNT(*) FROM content_moderation WHERE status = 'pending'),
    'pending_org_approvals', (SELECT COUNT(*) FROM organization_approvals WHERE status = 'pending'),
    'pending_poll_approvals', (
      SELECT COUNT(*)
      FROM forms
      WHERE form_type = 'poll'
        AND approval_status = 'pending'
    )
  ) INTO result;

  RETURN result;
END;
$$;
