-- Server-side admin email notifications for payout requests and poll approvals

CREATE OR REPLACE FUNCTION public.queue_admin_email_notification(
  p_type text,
  p_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://tirqmqzgksclsjxfiham.supabase.co/functions/v1/send-admin-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpcnFtcXpna3NjbHNqeGZpaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzgyMTksImV4cCI6MjA4MjE1NDIxOX0.Y96LDtj66PRezBMQgyiNZw7ppDZ1vkeMuu5qkrExuPY'
    ),
    body := jsonb_build_object(
      'type', p_type,
      'data', p_data
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to queue admin email notification (%): %', p_type, SQLERRM;
END;
$$;

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

  SELECT full_name, email, company_name
  INTO v_profile
  FROM public.profiles
  WHERE id = NEW.organization_id;

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

CREATE OR REPLACE FUNCTION public.notify_admins_on_influencer_payout_insert()
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

  SELECT full_name, email
  INTO v_profile
  FROM public.profiles
  WHERE id = NEW.influencer_user_id;

  PERFORM public.queue_admin_email_notification(
    'payout_request',
    jsonb_build_object(
      'organization_name', COALESCE(v_profile.full_name, 'Influencer'),
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

  SELECT full_name, email, company_name
  INTO v_profile
  FROM public.profiles
  WHERE id = NEW.user_id;

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

DROP TRIGGER IF EXISTS notify_admins_on_payout_insert ON public.payouts;
CREATE TRIGGER notify_admins_on_payout_insert
AFTER INSERT ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_payout_insert();

DROP TRIGGER IF EXISTS notify_admins_on_influencer_payout_insert ON public.influencer_payouts;
CREATE TRIGGER notify_admins_on_influencer_payout_insert
AFTER INSERT ON public.influencer_payouts
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_influencer_payout_insert();

DROP TRIGGER IF EXISTS notify_admins_on_poll_pending ON public.forms;
CREATE TRIGGER notify_admins_on_poll_pending
AFTER INSERT OR UPDATE OF approval_status, form_type ON public.forms
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_poll_pending();
