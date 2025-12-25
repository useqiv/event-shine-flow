import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Admin Statistics Hook
export const useAdminStatistics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-statistics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_statistics');
      if (error) throw error;
      return data as {
        total_users: number;
        total_organizations: number;
        active_contests: number;
        active_events: number;
        total_revenue: number;
        pending_payouts: number;
        total_tickets_sold: number;
        total_votes: number;
        pending_fraud_alerts: number;
        pending_content_reviews: number;
        pending_org_approvals: number;
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// All Users Hook
export const useAllUsers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Combine data
      return profiles.map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.id)?.role || 'user'
      }));
    },
    enabled: !!user,
  });
};

// All Organizations Hook
export const useAllOrganizations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-all-organizations'],
    queryFn: async () => {
      // Get all users with organization role
      const { data: orgRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'organization');

      if (rolesError) throw rolesError;

      const orgIds = orgRoles?.map(r => r.user_id) || [];

      if (orgIds.length === 0) return [];

      // Get profiles for organizations
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', orgIds);

      if (profilesError) throw profilesError;

      // Get organization approvals
      const { data: approvals } = await supabase
        .from('organization_approvals')
        .select('*')
        .in('organization_id', orgIds);

      // Get organization settings
      const { data: settings } = await supabase
        .from('organization_settings')
        .select('*')
        .in('organization_id', orgIds);

      // Combine data
      return profiles?.map(profile => ({
        ...profile,
        approval: approvals?.find(a => a.organization_id === profile.id),
        settings: settings?.find(s => s.organization_id === profile.id)
      })) || [];
    },
    enabled: !!user,
  });
};

// All Contests Hook (Admin view)
export const useAdminContests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-all-contests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select(`
          *,
          contestants:contestants(count),
          votes:votes(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// All Events Hook (Admin view)
export const useAdminEvents = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-all-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          ticket_types:ticket_types(count),
          tickets:tickets(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// All Payouts Hook (Admin view)
export const useAdminPayouts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-all-payouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get organization profiles for names
      const orgIds = [...new Set(data?.map(p => p.organization_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', orgIds);

      return data?.map(payout => ({
        ...payout,
        organization: profiles?.find(p => p.id === payout.organization_id)
      })) || [];
    },
    enabled: !!user,
  });
};

// Fraud Alerts Hook
export const useFraudAlerts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-fraud-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Content Moderation Hook
export const useContentModeration = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-content-moderation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_moderation')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get submitter profiles
      const submitterIds = [...new Set(data?.map(c => c.submitted_by) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', submitterIds);

      return data?.map(item => ({
        ...item,
        submitter: profiles?.find(p => p.id === item.submitted_by)
      })) || [];
    },
    enabled: !!user,
  });
};

// Platform Settings Hook
export const usePlatformSettings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('category');

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Mutations
export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_reason: reason
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      toast.success('User suspended successfully');
    },
    onError: () => {
      toast.error('Failed to suspend user');
    }
  });
};

export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspended_at: null,
          suspended_reason: null
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      toast.success('User activated successfully');
    },
    onError: () => {
      toast.error('Failed to activate user');
    }
  });
};

export const useApproveOrganization = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ orgId, specialRate }: { orgId: string; specialRate?: number }) => {
      const { error } = await supabase
        .from('organization_approvals')
        .upsert({
          organization_id: orgId,
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          special_commission_rate: specialRate
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-organizations'] });
      toast.success('Organization approved');
    },
    onError: () => {
      toast.error('Failed to approve organization');
    }
  });
};

export const useRejectOrganization = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ orgId, reason }: { orgId: string; reason: string }) => {
      const { error } = await supabase
        .from('organization_approvals')
        .upsert({
          organization_id: orgId,
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-organizations'] });
      toast.success('Organization rejected');
    },
    onError: () => {
      toast.error('Failed to reject organization');
    }
  });
};

export const useApprovePayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payoutId, referenceId }: { payoutId: string; referenceId?: string }) => {
      const { error } = await supabase
        .from('payouts')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          reference_id: referenceId
        })
        .eq('id', payoutId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success('Payout approved');
    },
    onError: () => {
      toast.error('Failed to approve payout');
    }
  });
};

export const useRejectPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payoutId: string) => {
      const { error } = await supabase
        .from('payouts')
        .update({ status: 'rejected' })
        .eq('id', payoutId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success('Payout rejected');
    },
    onError: () => {
      toast.error('Failed to reject payout');
    }
  });
};

export const useUpdatePlatformSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Setting updated');
    },
    onError: () => {
      toast.error('Failed to update setting');
    }
  });
};

export const useResolveFraudAlert = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ alertId, status, notes }: { alertId: string; status: 'resolved' | 'dismissed'; notes?: string }) => {
      const { error } = await supabase
        .from('fraud_alerts')
        .update({
          status,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fraud-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success('Fraud alert updated');
    },
    onError: () => {
      toast.error('Failed to update fraud alert');
    }
  });
};

export const useModerateContent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ contentId, status, reason }: { contentId: string; status: 'approved' | 'rejected'; reason?: string }) => {
      const { error } = await supabase
        .from('content_moderation')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: status === 'rejected' ? reason : null
        })
        .eq('id', contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-moderation'] });
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success('Content reviewed');
    },
    onError: () => {
      toast.error('Failed to review content');
    }
  });
};