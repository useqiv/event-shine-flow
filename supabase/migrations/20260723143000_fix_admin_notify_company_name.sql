-- Fix admin notification triggers that incorrectly read company_name from profiles.
-- company_name lives on organization_settings, not profiles.

CREATE OR REPLACE FUNCTION public.notify_admins_on_payout_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile record;
BEGIN
  IF NEW.status IS DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT p.full_name, p.email, os.company_name
  INTO v_profile
  FROM public.profiles p
  LEFT JOIN public.organization_settings os ON os.organization_id = p.id
  WHERE p.id = NEW.organization_id;

  PERFORM public.queue_admin_email_notification(
    'payout_request',
    jsonb_build_object(
      'organization_name', COALESCE(v_profile.company_name, v_profile.full_name, 'Unknown Organization'),
      'amount', NEW.amount,
      'currency', COALESCE(NEW.currency, 'NGN'),
      'payment_method', NEW.payment_method,
      'bank_name', NEW.bank_name,
      'account_number', NEW.account_number,
      'account_name', NEW.account_name,
      'usdt_address', NEW.usdt_address,
      'dashboard_url', 'https://useqiv.com/admin/payouts'
    )
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admins_on_poll_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile record;
BEGIN
  IF NEW.form_type IS DISTINCT FROM 'poll' OR NEW.approval_status IS DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.approval_status = 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT p.full_name, p.email, os.company_name
  INTO v_profile
  FROM public.profiles p
  LEFT JOIN public.organization_settings os ON os.organization_id = p.id
  WHERE p.id = NEW.user_id;

  PERFORM public.queue_admin_email_notification(
    'poll_pending',
    jsonb_build_object(
      'poll_title', NEW.title,
      'organization_name', COALESCE(v_profile.company_name, v_profile.full_name, 'Unknown Organization'),
      'organization_email', COALESCE(v_profile.email, 'N/A'),
      'submitted_at', COALESCE(NEW.created_at, NOW()),
      'dashboard_url', 'https://useqiv.com/admin/polls'
    )
  );

  RETURN NEW;
END;
$$;
