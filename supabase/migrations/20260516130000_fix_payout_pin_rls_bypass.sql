-- SECURITY DEFINER payout RPCs must bypass RLS (invoker policies block inserts otherwise).

ALTER FUNCTION public.request_organization_payout(numeric, text, text, text, text)
  SET row_security = off;

ALTER FUNCTION public.org_has_payout_pin()
  SET row_security = off;

CREATE OR REPLACE FUNCTION public.org_has_payout_pin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  v_org_id := public.get_payout_organization_id();
  IF v_org_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.organization_payout_pins
    WHERE organization_id = v_org_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.request_organization_payout(
  p_amount numeric,
  p_payment_method text,
  p_currency text,
  p_pin text,
  p_confirm_pin text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
SET row_security = off
AS $$
DECLARE
  v_org_id uuid;
  v_settings record;
  v_pin_hash text;
BEGIN
  v_org_id := public.get_payout_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payout amount';
  END IF;

  IF p_payment_method NOT IN ('bank', 'usdt') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  IF NOT public.is_valid_payout_pin(p_pin) THEN
    RAISE EXCEPTION 'Payout PIN must be exactly 6 digits';
  END IF;

  SELECT *
  INTO v_settings
  FROM public.organization_settings
  WHERE organization_id = v_org_id;

  IF v_settings IS NULL THEN
    RAISE EXCEPTION 'Organization payout settings not found';
  END IF;

  SELECT pin_hash
  INTO v_pin_hash
  FROM public.organization_payout_pins
  WHERE organization_id = v_org_id;

  IF v_pin_hash IS NULL THEN
    IF p_confirm_pin IS NULL OR p_confirm_pin = '' THEN
      RAISE EXCEPTION 'Please confirm your 6-digit payout PIN';
    END IF;

    IF NOT public.is_valid_payout_pin(p_confirm_pin) THEN
      RAISE EXCEPTION 'Payout PIN confirmation must be exactly 6 digits';
    END IF;

    IF p_pin <> p_confirm_pin THEN
      RAISE EXCEPTION 'PIN confirmation does not match';
    END IF;

    INSERT INTO public.organization_payout_pins (organization_id, pin_hash)
    VALUES (v_org_id, extensions.crypt(p_pin, extensions.gen_salt('bf', 10)))
    ON CONFLICT (organization_id) DO NOTHING;

    SELECT pin_hash
    INTO v_pin_hash
    FROM public.organization_payout_pins
    WHERE organization_id = v_org_id;

    IF v_pin_hash IS NULL THEN
      RAISE EXCEPTION 'Failed to set payout PIN';
    END IF;
  ELSE
    IF extensions.crypt(p_pin, v_pin_hash) <> v_pin_hash THEN
      RAISE EXCEPTION 'Incorrect payout PIN';
    END IF;
  END IF;

  IF p_payment_method = 'bank' AND (
    v_settings.bank_name IS NULL OR v_settings.bank_name = ''
    OR v_settings.account_number IS NULL OR v_settings.account_number = ''
  ) THEN
    RAISE EXCEPTION 'Bank details not configured';
  END IF;

  IF p_payment_method = 'usdt' AND (
    v_settings.usdt_address IS NULL OR v_settings.usdt_address = ''
  ) THEN
    RAISE EXCEPTION 'USDT address not configured';
  END IF;

  INSERT INTO public.payouts (
    organization_id,
    amount,
    payment_method,
    currency,
    bank_name,
    account_number,
    account_name,
    usdt_address
  ) VALUES (
    v_org_id,
    p_amount,
    p_payment_method,
    COALESCE(NULLIF(trim(p_currency), ''), 'USD'),
    v_settings.bank_name,
    v_settings.account_number,
    v_settings.account_name,
    v_settings.usdt_address
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.org_has_payout_pin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_organization_payout(numeric, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.org_has_payout_pin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_organization_payout(numeric, text, text, text, text) TO authenticated;
