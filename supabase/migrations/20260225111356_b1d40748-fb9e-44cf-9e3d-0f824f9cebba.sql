
-- Secure server-side function to check and accept scanner-only invites
-- This runs as SECURITY DEFINER so it bypasses RLS, but validates everything internally
CREATE OR REPLACE FUNCTION public.check_and_accept_scanner_invite(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_invite record;
  v_permissions jsonb;
  v_is_scanner_only boolean;
BEGIN
  -- SECURITY: Ensure the caller is the same user (prevent impersonation)
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthorized');
  END IF;

  -- Get the user's email from auth.users (trusted source, not client-supplied)
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_email');
  END IF;

  -- Find a pending invite matching this email
  SELECT id, organization_id, permissions, role
  INTO v_invite
  FROM team_members
  WHERE email = v_user_email
    AND status = 'pending'
    AND user_id IS NULL
  LIMIT 1;

  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_invite');
  END IF;

  -- Validate this is a scanner-only invite (strict check)
  v_permissions := v_invite.permissions;
  v_is_scanner_only := (
    COALESCE((v_permissions->>'can_scan_tickets')::boolean, false) = true
    AND COALESCE((v_permissions->>'can_edit_contests')::boolean, false) = false
    AND COALESCE((v_permissions->>'can_edit_events')::boolean, false) = false
    AND COALESCE((v_permissions->>'can_edit_campaigns')::boolean, false) = false
    AND COALESCE((v_permissions->>'can_manage_payouts')::boolean, false) = false
    AND COALESCE((v_permissions->>'can_view_analytics')::boolean, false) = false
  );

  IF NOT v_is_scanner_only THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_scanner_only');
  END IF;

  -- All checks passed. Now perform the setup atomically:

  -- 1. Set the account type (reuse existing logic from set_account_type)
  -- Insert user role if not exists
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Mark profile as account_type_selected
  UPDATE profiles
  SET account_type_selected = true, updated_at = now()
  WHERE id = p_user_id;

  -- 2. Accept the team invite
  UPDATE team_members
  SET status = 'accepted',
      user_id = p_user_id,
      accepted_at = now(),
      updated_at = now()
  WHERE id = v_invite.id
    AND status = 'pending'; -- Double-check to prevent race conditions

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_invite.organization_id
  );
END;
$$;

-- Revoke direct access, only authenticated users can call
REVOKE ALL ON FUNCTION public.check_and_accept_scanner_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_accept_scanner_invite(uuid) TO authenticated;
