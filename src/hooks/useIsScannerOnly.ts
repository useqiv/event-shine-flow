import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Detects if the current user is a scanner-only team member.
 * A scanner-only member has can_scan_tickets=true and all other
 * administrative permissions disabled.
 */
export const useIsScannerOnly = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-scanner-only', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      // Check if user is already an org owner, admin, or influencer — they are never scanner-only
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roleList = roles?.map(r => r.role) || [];
      if (roleList.includes('admin') || roleList.includes('organization') || roleList.includes('influencer')) {
        return false;
      }

      // Check if user is an accepted team member with scanner-only permissions
      const { data: teamMember, error } = await supabase
        .from('team_members')
        .select('permissions')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle();

      if (error || !teamMember) return false;

      const perms = teamMember.permissions as any;
      if (!perms?.can_scan_tickets) return false;

      // Scanner-only = can_scan_tickets is true, but all other admin permissions are false
      const isAdminPerm =
        perms.can_view_contests ||
        perms.can_edit_contests ||
        perms.can_view_events ||
        perms.can_edit_events ||
        perms.can_view_campaigns ||
        perms.can_edit_campaigns ||
        perms.can_view_analytics ||
        perms.can_manage_payouts;

      return !isAdminPerm;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};
