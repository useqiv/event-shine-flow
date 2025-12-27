import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeamMember {
  id: string;
  organization_id: string;
  email: string;
  name: string | null;
  role: string;
  permissions: {
    can_view_contests: boolean;
    can_edit_contests: boolean;
    can_view_events: boolean;
    can_edit_events: boolean;
    can_scan_tickets: boolean;
    can_view_analytics: boolean;
    can_manage_payouts: boolean;
  };
  status: string;
  invited_at: string;
  accepted_at: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useTeamMembers = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['team-members', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('organization_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!user,
  });
};

export const useInviteTeamMember = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (memberData: { 
      email: string; 
      name?: string; 
      role: string;
      permissions: TeamMember['permissions'];
      organizationName?: string;
      inviterName?: string;
    }) => {
      // First check if user with this email exists - they must sign up first
      const { data: existingUser, error: lookupError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', memberData.email)
        .single();

      if (lookupError || !existingUser) {
        throw new Error('USER_NOT_FOUND');
      }

      // Get the team member record to get its ID for the notification
      const { data: teamMember, error } = await supabase
        .from('team_members')
        .insert({
          organization_id: user!.id,
          email: memberData.email,
          name: memberData.name || existingUser.full_name,
          role: memberData.role,
          permissions: memberData.permissions,
        })
        .select('id')
        .single();
      
      if (error) throw error;

      // Send in-app notification to accept/decline
      await supabase.from('notifications').insert({
        user_id: existingUser.id,
        title: 'Team Invitation',
        message: `${memberData.inviterName || 'Someone'} has invited you to join ${memberData.organizationName || 'their organization'} as a ${memberData.role}. Click to accept or decline.`,
        type: 'team_invite',
        reference_id: teamMember.id, // Store team_member ID for accept/decline
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Invitation sent! They will receive a notification to accept or decline.');
    },
    onError: (error: any) => {
      if (error.message === 'USER_NOT_FOUND') {
        toast.error('This user must sign up first before they can be invited');
      } else if (error.code === '23505') {
        toast.error('This email has already been invited');
      } else {
        toast.error('Failed to invite team member');
      }
      console.error(error);
    },
  });
};

export const useUpdateTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamMember> & { id: string }) => {
      const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Team member updated');
    },
    onError: (error) => {
      toast.error('Failed to update team member');
      console.error(error);
    },
  });
};

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Team member removed');
    },
    onError: (error) => {
      toast.error('Failed to remove team member');
      console.error(error);
    },
  });
};

export const useRespondToInvite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ teamMemberId, accept }: { teamMemberId: string; accept: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (accept) {
        // Accept the invitation - update status and link user_id
        const { error } = await supabase
          .from('team_members')
          .update({ 
            status: 'accepted',
            user_id: user.id,
            accepted_at: new Date().toISOString(),
          })
          .eq('id', teamMemberId);
        
        if (error) throw error;
      } else {
        // Decline - delete the team member record
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('id', teamMemberId);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(accept ? 'Invitation accepted!' : 'Invitation declined');
    },
    onError: (error) => {
      toast.error('Failed to respond to invitation');
      console.error(error);
    },
  });
};
