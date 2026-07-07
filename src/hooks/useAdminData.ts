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
        pending_poll_approvals: number;
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

      // Get wallet balances
      const { data: wallets } = await supabase
        .from('wallets')
        .select('user_id, balance');

      const { data: currencyBalances } = await supabase
        .from('wallet_currency_balances')
        .select('wallet_id, currency, balance');

      // Map wallet_id to user_id for currency balances
      const walletUserMap = new Map<string, string>();
      wallets?.forEach(w => {
        walletUserMap.set(w.user_id, w.user_id);
      });

      // Group currency balances by wallet user
      const userCurrencyBalances = new Map<string, Array<{ currency: string; balance: number }>>();
      if (wallets && currencyBalances) {
        // Get wallet ids mapped to user ids
        const { data: walletIds } = await supabase
          .from('wallets')
          .select('id, user_id');
        
        const walletIdToUser = new Map<string, string>();
        walletIds?.forEach(w => walletIdToUser.set(w.id, w.user_id));
        
        currencyBalances.forEach(cb => {
          const userId = walletIdToUser.get(cb.wallet_id);
          if (userId) {
            const existing = userCurrencyBalances.get(userId) || [];
            existing.push({ currency: cb.currency, balance: Number(cb.balance) });
            userCurrencyBalances.set(userId, existing);
          }
        });
      }

      // Combine data
      return profiles.map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.id)?.role || 'user',
        wallet_balance: wallets?.find(w => w.user_id === profile.id)?.balance || 0,
        currency_balances: userCurrencyBalances.get(profile.id) || [],
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

      // Get organization settings (admin-safe view decrypts banking details for admins)
      const { data: settings } = await supabase
        .from('organization_settings_safe')
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
        .from('payouts_safe')
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

export const useUpdateOrganizationCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orgId, 
      voteCommissionRate, 
      ticketCommissionRate,
      specialCommissionRate 
    }: { 
      orgId: string; 
      voteCommissionRate?: number | null;
      ticketCommissionRate?: number | null;
      specialCommissionRate?: number | null;
    }) => {
      // Check if approval record exists
      const { data: existing } = await supabase
        .from('organization_approvals')
        .select('id')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('organization_approvals')
          .update({
            vote_commission_rate: voteCommissionRate,
            ticket_commission_rate: ticketCommissionRate,
            special_commission_rate: specialCommissionRate,
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', orgId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organization_approvals')
          .insert({
            organization_id: orgId,
            status: 'approved',
            vote_commission_rate: voteCommissionRate,
            ticket_commission_rate: ticketCommissionRate,
            special_commission_rate: specialCommissionRate
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-organizations'] });
      toast.success('Commission rates updated');
    },
    onError: () => {
      toast.error('Failed to update commission rates');
    }
  });
};

export const useRejectOrganization = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const logAttempt = async (
    orgId: string,
    reason: string,
    outcome: 'success' | 'failure',
    actionType: 'reject' | 'blacklist' | 'reject_or_blacklist',
    errorMessage?: string,
  ) => {
    if (!user) return;
    try {
      let ipAddress: string | null = null;
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
          const j = await res.json();
          ipAddress = j?.ip ?? null;
        }
      } catch {
        // Best-effort: ignore IP lookup failures
      }
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

      await supabase.from('admin_activity_logs').insert({
        admin_id: user.id,
        action_type: `organization_${actionType}_${outcome}`,
        entity_type: 'organization',
        entity_id: orgId,
        description: `Admin ${actionType} attempt for organization ${orgId} — ${outcome}${errorMessage ? `: ${errorMessage}` : ''}`,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          organization_id: orgId,
          reason,
          outcome,
          action: actionType,
          error: errorMessage ?? null,
          attempted_at: new Date().toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      } as any);
    } catch (e) {
      console.error('Failed to write admin activity log', e);
    }
  };

  return useMutation({
    mutationFn: async ({ orgId, reason }: { orgId: string; reason: string }) => {
      // Determine if this is a reject or blacklist based on existing approval status
      const { data: existing } = await supabase
        .from('organization_approvals')
        .select('status')
        .eq('organization_id', orgId)
        .maybeSingle();
      const action: 'reject' | 'blacklist' =
        existing?.status === 'approved' ? 'blacklist' : 'reject';

      const { data, error } = await (supabase as any).rpc('admin_reject_or_blacklist_organization', {
        p_organization_id: orgId,
        p_reason: reason,
      });

      if (error) {
        await logAttempt(orgId, reason, 'failure', action, error.message);
        throw error;
      }

      if (data && data.success === false) {
        const msg = data.error || 'Failed to reject organization';
        await logAttempt(orgId, reason, 'failure', action, msg);
        throw new Error(msg);
      }

      await logAttempt(orgId, reason, 'success', action);
      return { action };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] });
      toast.success('Organization updated');
    },
    onError: (err: any) => {
      console.error('Reject/blacklist organization failed:', err);
      toast.error(err?.message || 'Failed to reject organization');
    }
  });
};

export const useUnblacklistOrganization = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const logAttempt = async (
    orgId: string,
    outcome: 'success' | 'failure',
    errorMessage?: string,
  ) => {
    if (!user) return;
    try {
      await supabase.from('admin_activity_logs').insert({
        admin_id: user.id,
        action_type: `organization_unblacklist_${outcome}`,
        entity_type: 'organization',
        entity_id: orgId,
        description: `Admin unblacklist attempt for organization ${orgId} — ${outcome}${errorMessage ? `: ${errorMessage}` : ''}`,
        metadata: {
          organization_id: orgId,
          outcome,
          error: errorMessage ?? null,
          attempted_at: new Date().toISOString(),
        },
      } as any);
    } catch (e) {
      console.error('Failed to write admin activity log', e);
    }
  };

  return useMutation({
    mutationFn: async (orgId: string) => {
      const { data, error } = await (supabase as any).rpc('admin_unblacklist_organization', {
        p_organization_id: orgId,
      });

      if (error) {
        await logAttempt(orgId, 'failure', error.message);
        throw error;
      }

      if (data && data.success === false) {
        const msg = data.error || 'Failed to remove organization from blacklist';
        await logAttempt(orgId, 'failure', msg);
        throw new Error(msg);
      }

      await logAttempt(orgId, 'success');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] });
      toast.success('Organization removed from blacklist');
    },
    onError: (err: any) => {
      console.error('Unblacklist organization failed:', err);
      toast.error(err?.message || 'Failed to remove organization from blacklist');
    },
  });
};

export const useApprovePayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payoutId, referenceId }: { payoutId: string; referenceId?: string }) => {
      // First get payout details
      const { data: payout, error: fetchError } = await supabase
        .from('payouts')
        .select('*')
        .eq('id', payoutId)
        .single();

      if (fetchError) throw fetchError;

      // Get organization email from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', payout.organization_id)
        .single();

      // Get organization's default currency
      const { data: orgSettings } = await supabase
        .from('organization_settings')
        .select('default_currency')
        .eq('organization_id', payout.organization_id)
        .single();

      const orgCurrency = orgSettings?.default_currency || 'USD';

      const { error } = await supabase
        .from('payouts')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          reference_id: referenceId
        })
        .eq('id', payoutId);

      if (error) throw error;

      // Send email notification
      if (profile?.email) {
        console.log('Sending payout notification to:', profile.email);
        const { error: fnError } = await supabase.functions.invoke('send-payout-notification', {
          body: {
            payout_id: payoutId,
            status: 'completed',
            amount: payout.amount,
            currency: orgCurrency,
            organization_email: profile.email,
            organization_name: profile.full_name || 'Organization',
            payment_method: payout.payment_method
          }
        });
        if (fnError) console.error('Failed to send payout notification:', fnError);
      } else {
        console.warn('No email found for organization:', payout.organization_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['organization-stats'] });
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      toast.success('Payout approved and notification sent');
    },
    onError: () => {
      toast.error('Failed to approve payout');
    }
  });
};

export const useRejectPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payoutId, reason }: { payoutId: string; reason?: string }) => {
      // First get payout details
      const { data: payout, error: fetchError } = await supabase
        .from('payouts')
        .select('*')
        .eq('id', payoutId)
        .single();

      if (fetchError) throw fetchError;

      // Get organization email from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', payout.organization_id)
        .single();

      // Get organization's default currency
      const { data: orgSettings } = await supabase
        .from('organization_settings')
        .select('default_currency')
        .eq('organization_id', payout.organization_id)
        .single();

      const orgCurrency = orgSettings?.default_currency || 'USD';

      const { error } = await supabase
        .from('payouts')
        .update({ status: 'rejected' })
        .eq('id', payoutId);

      if (error) throw error;

      // Send email notification
      if (profile?.email) {
        console.log('Sending payout rejection notification to:', profile.email);
        const { error: fnError } = await supabase.functions.invoke('send-payout-notification', {
          body: {
            payout_id: payoutId,
            status: 'rejected',
            amount: payout.amount,
            currency: orgCurrency,
            organization_email: profile.email,
            organization_name: profile.full_name || 'Organization',
            rejection_reason: reason,
            payment_method: payout.payment_method
          }
        });
        if (fnError) console.error('Failed to send payout notification:', fnError);
      } else {
        console.warn('No email found for organization:', payout.organization_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['organization-stats'] });
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      toast.success('Payout rejected and notification sent');
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
      // First try to update existing setting
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('setting_key', key)
        .maybeSingle();

      if (existing) {
        // Update existing setting
        const { error } = await supabase
          .from('platform_settings')
          .update({ setting_value: value, updated_at: new Date().toISOString() })
          .eq('setting_key', key);
        if (error) throw error;
      } else {
        // Insert new setting
        const { error } = await supabase
          .from('platform_settings')
          .insert({ 
            setting_key: key, 
            setting_value: value,
            category: key.startsWith('flutterwave') ? 'payment' : 
                      key.startsWith('crypto') ? 'crypto' : 
                      key.includes('commission') ? 'commission' : 'general',
            setting_type: 'string'
          });
        if (error) throw error;
      }
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

export const useAdminPolls = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-polls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('form_type', 'poll')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ownerIds = [...new Set(data?.map((form) => form.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', ownerIds);

      return (data || []).map((form) => ({
        ...form,
        owner: profiles?.find((profile) => profile.id === form.user_id),
      }));
    },
    enabled: !!user,
  });
};

export const useModeratePoll = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      formId,
      status,
      reason,
    }: {
      formId: string;
      status: 'approved' | 'rejected';
      reason?: string;
    }) => {
      const { error } = await supabase
        .from('forms')
        .update({
          approval_status: status,
          rejection_reason: status === 'rejected' ? reason || 'Poll did not meet guidelines' : null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          is_active: status === 'approved',
          is_accepting_responses: status === 'approved',
        })
        .eq('id', formId)
        .eq('form_type', 'poll');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-polls'] });
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['user-forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Poll reviewed');
    },
    onError: () => {
      toast.error('Failed to review poll');
    },
  });
};

export const useSendOrgBroadcastEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subject,
      message,
      recipientFilter = 'all',
    }: {
      subject: string;
      message: string;
      recipientFilter?: 'all' | 'approved' | 'pending';
    }) => {
      const { data, error } = await supabase.functions.invoke('send-org-broadcast-email', {
        body: { subject, message, recipientFilter },
      });

      const response = data as {
        error?: string;
        success?: boolean;
        emailsSent?: number;
        recipientCount?: number;
        failedCount?: number;
        errors?: string[];
      } | null;

      if (response?.error) throw new Error(response.error);
      if (error) throw error;

      return response as {
        success: boolean;
        emailsSent: number;
        recipientCount: number;
        failedCount?: number;
        errors?: string[];
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] });
      const failed = data.failedCount ?? 0;
      const sent = data.emailsSent ?? 0;
      const total = data.recipientCount ?? 0;
      if (sent === 0 && total > 0) {
        toast.error('No emails were delivered. Check ZeptoMail configuration or recipient addresses.');
      } else if (failed > 0) {
        toast.warning(`Sent ${sent} of ${total} emails (${failed} failed)`);
      } else {
        toast.success(`Email sent to ${sent} organization${sent === 1 ? '' : 's'}`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to send broadcast email');
    },
  });
};