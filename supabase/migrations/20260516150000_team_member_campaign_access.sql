-- Additive RLS: allow accepted team members to view/edit org campaigns (creator_id = organization owner).
-- Existing owner and admin policies are unchanged.

CREATE OR REPLACE FUNCTION public.team_member_campaign_permission(p_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_allowed boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  IF public.has_role(v_uid, 'organization'::app_role) THEN
    RETURN true;
  END IF;

  SELECT COALESCE(
    CASE p_permission
      WHEN 'view' THEN (tm.permissions->>'can_view_campaigns')::boolean
      WHEN 'edit' THEN (tm.permissions->>'can_edit_campaigns')::boolean
      ELSE false
    END,
    false
  )
  INTO v_allowed
  FROM public.team_members tm
  WHERE tm.user_id = v_uid
    AND tm.status = 'accepted'
  LIMIT 1;

  RETURN COALESCE(v_allowed, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_org_campaign_for_current_member(p_creator_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.user_id = auth.uid()
      AND tm.status = 'accepted'
      AND tm.organization_id = p_creator_id
  );
$$;

-- Team members can view org campaigns (any status) when permitted
CREATE POLICY "Team members can view organization campaigns"
ON public.campaigns
FOR SELECT
TO authenticated
USING (
  public.is_org_campaign_for_current_member(creator_id)
  AND public.team_member_campaign_permission('view')
);

-- Team members can update org campaigns when permitted
CREATE POLICY "Team members can update organization campaigns"
ON public.campaigns
FOR UPDATE
TO authenticated
USING (
  public.is_org_campaign_for_current_member(creator_id)
  AND public.team_member_campaign_permission('edit')
)
WITH CHECK (
  public.is_org_campaign_for_current_member(creator_id)
  AND public.team_member_campaign_permission('edit')
);

-- Team members can delete org campaigns when permitted
CREATE POLICY "Team members can delete organization campaigns"
ON public.campaigns
FOR DELETE
TO authenticated
USING (
  public.is_org_campaign_for_current_member(creator_id)
  AND public.team_member_campaign_permission('edit')
);

-- Team members can create campaigns on behalf of the organization
CREATE POLICY "Team members can create organization campaigns"
ON public.campaigns
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_org_campaign_for_current_member(creator_id)
  AND public.team_member_campaign_permission('edit')
);

REVOKE ALL ON FUNCTION public.team_member_campaign_permission(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_member_campaign_permission(text) TO authenticated;

REVOKE ALL ON FUNCTION public.is_org_campaign_for_current_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_campaign_for_current_member(uuid) TO authenticated;

-- Analytics & donations: team members with view access (org analytics page)
CREATE POLICY "Team members can view organization campaign analytics"
ON public.campaign_analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = campaign_analytics.campaign_id
      AND public.is_org_campaign_for_current_member(c.creator_id)
  )
  AND public.team_member_campaign_permission('view')
);

CREATE POLICY "Team members can view organization campaign donations"
ON public.donations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = donations.campaign_id
      AND public.is_org_campaign_for_current_member(c.creator_id)
  )
  AND public.team_member_campaign_permission('view')
);
