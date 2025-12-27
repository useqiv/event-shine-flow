import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export const useAdminRealtime = () => {
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || role !== 'admin') return;

    // Listen for new payouts
    const payoutsChannel = supabase
      .channel('admin-payouts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payouts'
        },
        async (payload) => {
          // Get organization details
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.organization_id)
            .single();

          toast.info(
            `New Payout Request`,
            {
              description: `${profile?.full_name || 'Organization'} requested ₦${payload.new.amount.toLocaleString()}`,
              duration: 8000,
            }
          );
          queryClient.invalidateQueries({ queryKey: ['admin-all-payouts'] });
          queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
        }
      )
      .subscribe();

    // Listen for new fraud alerts
    const fraudChannel = supabase
      .channel('admin-fraud-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fraud_alerts'
        },
        (payload) => {
          const severity = payload.new.severity;
          const toastFn = severity === 'high' || severity === 'critical' ? toast.error : toast.warning;
          
          toastFn(
            `New Fraud Alert: ${payload.new.alert_type}`,
            {
              description: payload.new.description,
              duration: 10000,
            }
          );
          queryClient.invalidateQueries({ queryKey: ['admin-fraud-alerts'] });
          queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
        }
      )
      .subscribe();

    // Listen for new organization approvals
    const orgApprovalsChannel = supabase
      .channel('admin-org-approvals-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'organization_approvals',
          filter: 'status=eq.pending'
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.organization_id)
            .single();

          toast.info(
            `New Organization Pending Approval`,
            {
              description: `${profile?.full_name || 'Organization'} is awaiting approval`,
              duration: 8000,
            }
          );
          queryClient.invalidateQueries({ queryKey: ['admin-all-organizations'] });
          queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
        }
      )
      .subscribe();

    // Listen for new refund requests
    const refundsChannel = supabase
      .channel('admin-refunds-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'refunds'
        },
        (payload) => {
          toast.info(
            `New Refund Request`,
            {
              description: `₦${payload.new.amount.toLocaleString()} refund requested`,
              duration: 8000,
            }
          );
          queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(payoutsChannel);
      supabase.removeChannel(fraudChannel);
      supabase.removeChannel(orgApprovalsChannel);
      supabase.removeChannel(refundsChannel);
    };
  }, [user, role, queryClient]);
};
