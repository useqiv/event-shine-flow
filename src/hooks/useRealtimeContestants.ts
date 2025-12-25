import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeContestants = (contestId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!contestId) return;

    const channel = supabase
      .channel(`contestants-${contestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contestants',
          filter: `contest_id=eq.${contestId}`
        },
        (payload) => {
          console.log('Contestant update received:', payload);
          // Invalidate queries to trigger refetch with new data
          queryClient.invalidateQueries({ queryKey: ['contestants', contestId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contestants',
          filter: `contest_id=eq.${contestId}`
        },
        (payload) => {
          console.log('New contestant added:', payload);
          queryClient.invalidateQueries({ queryKey: ['contestants', contestId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contestId, queryClient]);
};

export const useRealtimeContest = (contestId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!contestId) return;

    const channel = supabase
      .channel(`contest-${contestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contests',
          filter: `id=eq.${contestId}`
        },
        (payload) => {
          console.log('Contest update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contestId, queryClient]);
};
