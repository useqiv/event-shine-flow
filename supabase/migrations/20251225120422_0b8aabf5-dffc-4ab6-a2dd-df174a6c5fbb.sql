-- Admin-specific tables for platform management

-- Platform settings table
CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  setting_type text NOT NULL DEFAULT 'string', -- string, number, boolean, json
  category text NOT NULL DEFAULT 'general', -- general, payment, commission, email, sms
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage platform settings
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Anyone can view specific settings (for public info like currencies)
CREATE POLICY "Anyone can view public settings" ON public.platform_settings
FOR SELECT USING (category IN ('public', 'currency'));

-- Insert default settings
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, category, description) VALUES
('platform_commission_percentage', '10', 'number', 'commission', 'Platform commission percentage on all transactions'),
('vote_commission_percentage', '10', 'number', 'commission', 'Commission percentage on votes'),
('ticket_commission_percentage', '5', 'number', 'commission', 'Commission percentage on ticket sales'),
('minimum_payout_amount', '5000', 'number', 'payment', 'Minimum amount for payout requests'),
('supported_currencies', '["NGN", "USD", "EUR", "GBP", "GHS", "KES", "ZAR"]', 'json', 'currency', 'Supported currencies'),
('flutterwave_enabled', 'true', 'boolean', 'payment', 'Enable Flutterwave payment'),
('crypto_payment_enabled', 'false', 'boolean', 'payment', 'Enable cryptocurrency payments'),
('crypto_supported_currencies', '["BTC", "ETH", "USDT", "USDC"]', 'json', 'payment', 'Supported crypto currencies');

-- User management: Add suspended status and fraud score to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_reason text,
ADD COLUMN IF NOT EXISTS fraud_score integer NOT NULL DEFAULT 0;

-- Company/Organization approval status
CREATE TABLE public.organization_approvals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamp with time zone,
  rejection_reason text,
  special_commission_rate numeric,
  is_blacklisted boolean NOT NULL DEFAULT false,
  blacklisted_at timestamp with time zone,
  blacklist_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.organization_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage organization approvals" ON public.organization_approvals
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizations can view their own approval status" ON public.organization_approvals
FOR SELECT USING (auth.uid() = organization_id);

-- Fraud alerts table
CREATE TABLE public.fraud_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type text NOT NULL, -- suspicious_votes, duplicate_device, refund_abuse, blacklisted_card, duplicate_ticket, rapid_votes, bulk_votes
  severity text NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  status text NOT NULL DEFAULT 'pending', -- pending, investigating, resolved, dismissed
  entity_type text NOT NULL, -- user, organization, contest, event, vote, ticket
  entity_id uuid NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamp with time zone,
  resolution_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fraud alerts" ON public.fraud_alerts
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Content moderation queue
CREATE TABLE public.content_moderation (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type text NOT NULL, -- contestant_photo, contest_banner, event_poster, profile_avatar
  content_url text NOT NULL,
  entity_type text NOT NULL, -- contestant, contest, event, profile
  entity_id uuid NOT NULL,
  submitted_by uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage content moderation" ON public.content_moderation
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own moderation status" ON public.content_moderation
FOR SELECT USING (auth.uid() = submitted_by);

-- Admin activity log
CREATE TABLE public.admin_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES public.profiles(id),
  action_type text NOT NULL, -- user_suspend, user_activate, org_approve, org_reject, payout_approve, payout_reject, setting_change
  entity_type text, -- user, organization, payout, contest, event, setting
  entity_id uuid,
  description text NOT NULL,
  metadata jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all activity logs" ON public.admin_activity_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_logs
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create updated_at triggers
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_approvals_updated_at
BEFORE UPDATE ON public.organization_approvals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fraud_alerts_updated_at
BEFORE UPDATE ON public.fraud_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_moderation_updated_at
BEFORE UPDATE ON public.content_moderation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create admin statistics function
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
    'pending_org_approvals', (SELECT COUNT(*) FROM organization_approvals WHERE status = 'pending')
  ) INTO result;

  RETURN result;
END;
$$;