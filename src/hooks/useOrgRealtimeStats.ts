import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

/**
 * Optimized organization realtime stats hook
 * Only subscribes when on organization dashboard pages to reduce egress
 */
export const useOrgRealtimeStats = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const location = useLocation();

  // Only enable realtime on org dashboard pages
  const isOrgDashboard = location.pathname.startsWith('/org');

  useEffect(() => {
    if (!user || !isOrgDashboard) return;

    // Single consolidated channel for organization stats
    const orgChannel = supabase
      .channel('org-stats-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['organization-stats', user.id] });
          queryClient.invalidateQueries({ queryKey: ['revenue-trends'] });
          queryClient.invalidateQueries({ queryKey: ['org-monthly-goal-metrics'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['organization-stats', user.id] });
          queryClient.invalidateQueries({ queryKey: ['revenue-trends'] });
          queryClient.invalidateQueries({ queryKey: ['org-monthly-goal-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['top-performers', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tickets',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['organization-stats', user.id] });
          queryClient.invalidateQueries({ queryKey: ['revenue-trends'] });
          queryClient.invalidateQueries({ queryKey: ['org-monthly-goal-metrics'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payouts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['payouts', user.id] });
          queryClient.invalidateQueries({ queryKey: ['organization-stats', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contests',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['organization-contests', user.id] });
          queryClient.invalidateQueries({ queryKey: ['organization-stats', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['organization-events', user.id] });
          queryClient.invalidateQueries({ queryKey: ['organization-stats', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orgChannel);
    };
  }, [user, queryClient, isOrgDashboard]);
};
