CREATE OR REPLACE FUNCTION public.admin_unblacklist_organization(
  p_organization_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.organization_approvals%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied');
  END IF;

  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization is required');
  END IF;

  SELECT * INTO v_existing
  FROM public.organization_approvals
  WHERE organization_id = p_organization_id
  FOR UPDATE;

  IF v_existing.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization approval record not found');
  END IF;

  IF NOT COALESCE(v_existing.is_blacklisted, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization is not blacklisted');
  END IF;

  UPDATE public.organization_approvals
  SET is_blacklisted = false,
      blacklisted_at = NULL,
      blacklist_reason = NULL,
      reviewed_by = auth.uid(),
      reviewed_at = v_now,
      updated_at = v_now
  WHERE organization_id = p_organization_id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', p_organization_id,
    'action', 'unblacklisted'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_unblacklist_organization(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_unblacklist_organization(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_unblacklist_organization(uuid) TO authenticated;
