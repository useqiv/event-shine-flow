import type { OrgPermissions } from '@/hooks/useOrgPermissions';

export function isOrgCampaignAnalyticsPath(pathname: string): boolean {
  return /^\/org\/campaigns\/[^/]+\/analytics$/.test(pathname);
}

/**
 * Whether a non-organization-role user may access this /org/* path via team permissions.
 */
export function canTeamMemberAccessOrgPath(
  pathname: string,
  permissions: OrgPermissions | undefined,
): boolean {
  if (!permissions?.organizationId) return false;

  if (pathname === '/org/campaigns') {
    return permissions.can_view_campaigns;
  }

  if (isOrgCampaignAnalyticsPath(pathname)) {
    return permissions.can_view_campaigns;
  }

  return false;
}

export function canCreateOrgCampaign(permissions: OrgPermissions | undefined, isOrganization: boolean): boolean {
  if (isOrganization) return true;
  return Boolean(permissions?.can_edit_campaigns && permissions.organizationId);
}

export function canEditOrgCampaigns(permissions: OrgPermissions | undefined, isOrganization: boolean): boolean {
  if (isOrganization) return true;
  return Boolean(permissions?.can_edit_campaigns && permissions.organizationId);
}

export function canViewOrgCampaigns(permissions: OrgPermissions | undefined, isOrganization: boolean): boolean {
  if (isOrganization) return true;
  return Boolean(permissions?.can_view_campaigns && permissions.organizationId);
}
