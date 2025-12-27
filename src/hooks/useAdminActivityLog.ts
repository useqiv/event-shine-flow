import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
  admin?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

// Fetch admin activity logs
export const useAdminActivityLogs = (limit = 100) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-activity-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get admin profiles
      const adminIds = [...new Set(data?.map(log => log.admin_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', adminIds);

      return data?.map(log => ({
        ...log,
        admin: profiles?.find(p => p.id === log.admin_id)
      })) as AdminActivityLog[];
    },
    enabled: !!user,
  });
};

// Log admin activity
export const useLogAdminActivity = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      actionType,
      entityType,
      entityId,
      description,
      metadata
    }: {
      actionType: string;
      entityType?: string;
      entityId?: string;
      description: string;
      metadata?: Record<string, any>;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: user.id,
          action_type: actionType,
          entity_type: entityType || null,
          entity_id: entityId || null,
          description,
          metadata: metadata || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] });
    },
  });
};

// Bulk suspend users
export const useBulkSuspendUsers = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogAdminActivity();

  return useMutation({
    mutationFn: async ({ userIds, reason }: { userIds: string[]; reason: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_reason: reason
        })
        .in('id', userIds);

      if (error) throw error;

      // Log the activity
      await logActivity.mutateAsync({
        actionType: 'bulk_suspend_users',
        entityType: 'users',
        description: `Bulk suspended ${userIds.length} users`,
        metadata: { user_ids: userIds, reason }
      });

      return userIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      toast.success(`Successfully suspended ${count} users`);
    },
    onError: () => {
      toast.error('Failed to suspend users');
    }
  });
};

// Bulk activate users
export const useBulkActivateUsers = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogAdminActivity();

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspended_at: null,
          suspended_reason: null
        })
        .in('id', userIds);

      if (error) throw error;

      await logActivity.mutateAsync({
        actionType: 'bulk_activate_users',
        entityType: 'users',
        description: `Bulk activated ${userIds.length} users`,
        metadata: { user_ids: userIds }
      });

      return userIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      toast.success(`Successfully activated ${count} users`);
    },
    onError: () => {
      toast.error('Failed to activate users');
    }
  });
};

// Bulk approve payouts
export const useBulkApprovePayouts = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogAdminActivity();

  return useMutation({
    mutationFn: async (payoutIds: string[]) => {
      const { error } = await supabase
        .from('payouts')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .in('id', payoutIds);

      if (error) throw error;

      await logActivity.mutateAsync({
        actionType: 'bulk_approve_payouts',
        entityType: 'payouts',
        description: `Bulk approved ${payoutIds.length} payouts`,
        metadata: { payout_ids: payoutIds }
      });

      return payoutIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success(`Successfully approved ${count} payouts`);
    },
    onError: () => {
      toast.error('Failed to approve payouts');
    }
  });
};

// Bulk reject payouts
export const useBulkRejectPayouts = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogAdminActivity();

  return useMutation({
    mutationFn: async (payoutIds: string[]) => {
      const { error } = await supabase
        .from('payouts')
        .update({ status: 'rejected' })
        .in('id', payoutIds);

      if (error) throw error;

      await logActivity.mutateAsync({
        actionType: 'bulk_reject_payouts',
        entityType: 'payouts',
        description: `Bulk rejected ${payoutIds.length} payouts`,
        metadata: { payout_ids: payoutIds }
      });

      return payoutIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success(`Successfully rejected ${count} payouts`);
    },
    onError: () => {
      toast.error('Failed to reject payouts');
    }
  });
};
