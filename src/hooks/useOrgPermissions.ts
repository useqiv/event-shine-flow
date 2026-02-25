import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TeamMemberPermissions } from './useTeamMembers';

export interface OrgPermissions extends TeamMemberPermissions {
  isOwner: boolean;
  organizationId: string | null;
}

const defaultOwnerPermissions: OrgPermissions = {
  isOwner: true,
  organizationId: null,
  can_view_contests: true,
  can_edit_contests: true,
  can_view_events: true,
  can_edit_events: true,
  can_view_campaigns: true,
  can_edit_campaigns: true,
  can_scan_tickets: true,
  scan_tickets_event_ids: [], // Empty means all events
  can_view_analytics: true,
  can_manage_payouts: true,
};

const defaultNoPermissions: OrgPermissions = {
  isOwner: false,
  organizationId: null,
  can_view_contests: false,
  can_edit_contests: false,
  can_view_events: false,
  can_edit_events: false,
  can_view_campaigns: false,
  can_edit_campaigns: false,
  can_scan_tickets: false,
  scan_tickets_event_ids: [],
  can_view_analytics: false,
  can_manage_payouts: false,
};

/**
 * Hook to get the current user's organization permissions.
 * Returns full permissions if the user is an organization owner,
 * or team member permissions if they're a team member.
 */
export const useOrgPermissions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['org-permissions', user?.id],
    queryFn: async (): Promise<OrgPermissions> => {
      if (!user?.id) return defaultNoPermissions;

      // First, check if user is an organization owner
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'organization')
        .maybeSingle();

      if (roleData) {
        // User is an organization owner - full permissions
        return { ...defaultOwnerPermissions, organizationId: user.id };
      }

      // Check if user is a team member of any organization
      const { data: teamMember, error } = await supabase
        .from('team_members')
        .select('organization_id, permissions, status')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle();

      if (error || !teamMember) {
        return defaultNoPermissions;
      }

      // User is a team member - return their specific permissions
      const permissions = teamMember.permissions as unknown as TeamMemberPermissions;
      return {
        isOwner: false,
        organizationId: teamMember.organization_id,
        can_view_contests: permissions.can_view_contests ?? false,
        can_edit_contests: permissions.can_edit_contests ?? false,
        can_view_events: permissions.can_view_events ?? false,
        can_edit_events: permissions.can_edit_events ?? false,
        can_view_campaigns: permissions.can_view_campaigns ?? false,
        can_edit_campaigns: permissions.can_edit_campaigns ?? false,
        can_scan_tickets: permissions.can_scan_tickets ?? false,
        scan_tickets_event_ids: permissions.scan_tickets_event_ids ?? [],
        can_view_analytics: permissions.can_view_analytics ?? false,
        can_manage_payouts: permissions.can_manage_payouts ?? false,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

/**
 * Check if user can scan tickets for a specific event
 */
export const useCanScanEvent = (eventId: string) => {
  const { data: permissions, isLoading } = useOrgPermissions();

  if (isLoading || !permissions) return { canScan: false, isLoading: isLoading || !permissions };
  if (!permissions.can_scan_tickets) return { canScan: false, isLoading: false };
  
  // Empty array means all events
  if (!permissions.scan_tickets_event_ids || permissions.scan_tickets_event_ids.length === 0) {
    return { canScan: true, isLoading: false };
  }

  return { canScan: permissions.scan_tickets_event_ids.includes(eventId), isLoading: false };
};

/**
 * Get list of event IDs user can scan, or null if they can scan all
 */
export const useAllowedScanEventIds = () => {
  const { data: permissions } = useOrgPermissions();

  if (!permissions?.can_scan_tickets) return [];
  
  // Empty array means all events - return null to indicate "all"
  if (!permissions.scan_tickets_event_ids || permissions.scan_tickets_event_ids.length === 0) {
    return null;
  }

  return permissions.scan_tickets_event_ids;
};
