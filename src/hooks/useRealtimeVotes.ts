import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeVotes = (contestId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!contestId) return;

    // Subscribe to contestant updates (vote counts)
    const contestantsChannel = supabase
      .channel(`contestants-${contestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contestants',
          filter: `contest_id=eq.${contestId}`,
        },
        (payload) => {
          console.log('Contestant updated:', payload);
          // Invalidate contestants query to refetch
          queryClient.invalidateQueries({ queryKey: ['contestants', contestId] });
        }
      )
      .subscribe();

    // Subscribe to contest updates (total votes)
    const contestChannel = supabase
      .channel(`contest-${contestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contests',
          filter: `id=eq.${contestId}`,
        },
        (payload) => {
          console.log('Contest updated:', payload);
          // Invalidate contest query to refetch
          queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
          queryClient.invalidateQueries({ queryKey: ['organization-contests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contestantsChannel);
      supabase.removeChannel(contestChannel);
    };
  }, [contestId, queryClient]);
};

export const useRealtimeContestants = (contestId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!contestId) return;

    const channel = supabase
      .channel(`all-contestants-${contestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contestants',
          filter: `contest_id=eq.${contestId}`,
        },
        (payload) => {
          console.log('Contestants change:', payload);
          queryClient.invalidateQueries({ queryKey: ['contestants', contestId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contestId, queryClient]);
};
