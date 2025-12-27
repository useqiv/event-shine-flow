import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useOrgRealtimeStats = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to votes changes for organization's contests
    const votesChannel = supabase
      .channel('org-votes-realtime')
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
        }
      )
      .subscribe();

    // Subscribe to tickets changes for organization's events
    const ticketsChannel = supabase
      .channel('org-tickets-realtime')
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
        }
      )
      .subscribe();

    // Subscribe to payouts changes
    const payoutsChannel = supabase
      .channel('org-payouts-realtime')
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
      .subscribe();

    // Subscribe to contests changes
    const contestsChannel = supabase
      .channel('org-contests-realtime')
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
      .subscribe();

    // Subscribe to events changes
    const eventsChannel = supabase
      .channel('org-events-realtime')
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
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(payoutsChannel);
      supabase.removeChannel(contestsChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [user, queryClient]);
};
