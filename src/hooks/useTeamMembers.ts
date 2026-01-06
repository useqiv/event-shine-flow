import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeamMemberPermissions {
  can_view_contests: boolean;
  can_edit_contests: boolean;
  can_view_events: boolean;
  can_edit_events: boolean;
  can_view_campaigns: boolean;
  can_edit_campaigns: boolean;
  can_scan_tickets: boolean;
  scan_tickets_event_ids?: string[]; // Optional: specific events they can scan for (empty = all events)
  can_view_analytics: boolean;
  can_manage_payouts: boolean;
}

export interface TeamMember {
  id: string;
  organization_id: string;
  email: string;
  name: string | null;
  role: string;
  permissions: TeamMemberPermissions;
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
      // Transform the data to match our interface
      return (data || []).map(member => ({
        ...member,
        permissions: member.permissions as unknown as TeamMemberPermissions,
      })) as TeamMember[];
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
      // Create the team member record (status will be 'pending' by default)
      const { data: teamMember, error } = await supabase
        .from('team_members')
        .insert([{
          organization_id: user!.id,
          email: memberData.email,
          name: memberData.name || null,
          role: memberData.role,
          permissions: JSON.parse(JSON.stringify(memberData.permissions)),
          status: 'pending',
        }])
        .select('id')
        .single();
      
      if (error) throw error;

      // Send email invitation
      const { error: emailError } = await supabase.functions.invoke('send-team-invite', {
        body: {
          email: memberData.email,
          name: memberData.name,
          role: memberData.role,
          organizationName: memberData.organizationName || 'an organization',
          inviterName: memberData.inviterName || 'Someone',
        },
      });

      if (emailError) {
        console.error('Failed to send invite email:', emailError);
        // Don't throw - team member was created, just email failed
      }

      // Also send in-app notification if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberData.email)
        .single();

      if (existingUser) {
        await supabase.rpc('send_notification', {
          p_user_id: existingUser.id,
          p_title: 'Team Invitation',
          p_message: `${memberData.inviterName || 'Someone'} has invited you to join ${memberData.organizationName || 'their organization'} as a ${memberData.role}. Click to accept or decline.`,
          p_type: 'team_invite',
          p_reference_id: teamMember.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Invitation sent! They will receive a notification to accept or decline.');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
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
      // Cast permissions to JSON format for Supabase
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.permissions) {
        updateData.permissions = JSON.parse(JSON.stringify(updates.permissions));
      }
      // Remove id from updates
      delete updateData.id;
      
      const { error } = await supabase
        .from('team_members')
        .update(updateData)
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
