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
    }) => {
      const { error } = await supabase
        .from('team_members')
        .insert({
          organization_id: user!.id,
          email: memberData.email,
          name: memberData.name,
          role: memberData.role,
          permissions: memberData.permissions,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Team member invited successfully');
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
