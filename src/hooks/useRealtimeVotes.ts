import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VoteEvent {
  contestantId: string;
  contestantName: string;
  newVoteCount: number;
  timestamp: number;
}

export const useRealtimeVotes = (contestId: string | undefined) => {
  const queryClient = useQueryClient();
  const [lastVoteEvent, setLastVoteEvent] = useState<VoteEvent | null>(null);
  const [recentlyUpdatedContestants, setRecentlyUpdatedContestants] = useState<Set<string>>(new Set());

  const clearVoteEvent = useCallback(() => {
    setLastVoteEvent(null);
  }, []);

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
          
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // Check if vote_count changed
          if (newData.vote_count !== oldData.vote_count) {
            setLastVoteEvent({
              contestantId: newData.id,
              contestantName: newData.name,
              newVoteCount: newData.vote_count,
              timestamp: Date.now(),
            });

            // Add to recently updated set
            setRecentlyUpdatedContestants(prev => new Set(prev).add(newData.id));
            
            // Remove from recently updated after animation
            setTimeout(() => {
              setRecentlyUpdatedContestants(prev => {
                const next = new Set(prev);
                next.delete(newData.id);
                return next;
              });
            }, 2000);
          }
          
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

  return {
    lastVoteEvent,
    clearVoteEvent,
    recentlyUpdatedContestants,
    isContestantUpdated: (id: string) => recentlyUpdatedContestants.has(id),
  };
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
