CREATE OR REPLACE FUNCTION public.admin_reject_or_blacklist_organization(
  p_organization_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.organization_approvals%ROWTYPE;
  v_now timestamptz := now();
  v_is_blacklisting boolean := false;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied');
  END IF;

  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization is required');
  END IF;

  IF NULLIF(trim(COALESCE(p_reason, '')), '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reason is required');
  END IF;

  SELECT * INTO v_existing
  FROM public.organization_approvals
  WHERE organization_id = p_organization_id
  FOR UPDATE;

  v_is_blacklisting := COALESCE(v_existing.status = 'approved', false);

  IF v_existing.id IS NULL THEN
    INSERT INTO public.organization_approvals (
      organization_id,
      status,
      reviewed_by,
      reviewed_at,
      rejection_reason
    ) VALUES (
      p_organization_id,
      'rejected',
      auth.uid(),
      v_now,
      trim(p_reason)
    );
  ELSIF v_is_blacklisting THEN
    UPDATE public.organization_approvals
    SET is_blacklisted = true,
        blacklisted_at = v_now,
        blacklist_reason = trim(p_reason),
        reviewed_by = auth.uid(),
        reviewed_at = v_now,
        updated_at = v_now
    WHERE organization_id = p_organization_id;
  ELSE
    UPDATE public.organization_approvals
    SET status = 'rejected',
        rejection_reason = trim(p_reason),
        reviewed_by = auth.uid(),
        reviewed_at = v_now,
        is_blacklisted = false,
        blacklisted_at = NULL,
        blacklist_reason = NULL,
        updated_at = v_now
    WHERE organization_id = p_organization_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', p_organization_id,
    'action', CASE WHEN v_is_blacklisting THEN 'blacklisted' ELSE 'rejected' END
  );
END;
$$;