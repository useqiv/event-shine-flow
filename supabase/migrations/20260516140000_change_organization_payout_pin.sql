-- Allow organizations to change their payout PIN (requires current PIN).

CREATE OR REPLACE FUNCTION public.change_organization_payout_pin(
  p_current_pin text,
  p_new_pin text,
  p_confirm_new_pin text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
SET row_security = off
AS $$
DECLARE
  v_org_id uuid;
  v_pin_hash text;
BEGIN
  v_org_id := public.get_payout_organization_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT public.is_valid_payout_pin(p_current_pin) THEN
    RAISE EXCEPTION 'Current PIN must be exactly 6 digits';
  END IF;

  IF NOT public.is_valid_payout_pin(p_new_pin) THEN
    RAISE EXCEPTION 'New PIN must be exactly 6 digits';
  END IF;

  IF NOT public.is_valid_payout_pin(p_confirm_new_pin) THEN
    RAISE EXCEPTION 'PIN confirmation must be exactly 6 digits';
  END IF;

  IF p_new_pin <> p_confirm_new_pin THEN
    RAISE EXCEPTION 'New PIN confirmation does not match';
  END IF;

  IF p_current_pin = p_new_pin THEN
    RAISE EXCEPTION 'New PIN must be different from your current PIN';
  END IF;

  SELECT pin_hash
  INTO v_pin_hash
  FROM public.organization_payout_pins
  WHERE organization_id = v_org_id;

  IF v_pin_hash IS NULL THEN
    RAISE EXCEPTION 'No payout PIN is set for this organization';
  END IF;

  IF extensions.crypt(p_current_pin, v_pin_hash) <> v_pin_hash THEN
    RAISE EXCEPTION 'Incorrect current payout PIN';
  END IF;

  UPDATE public.organization_payout_pins
  SET
    pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf', 10)),
    updated_at = now()
  WHERE organization_id = v_org_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.change_organization_payout_pin(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_organization_payout_pin(text, text, text) TO authenticated;
