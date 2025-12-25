import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type VoteUpdateCallback = (contestantId: string, newVoteCount: number, previousVoteCount: number) => void;

export const useRealtimeContestants = (contestId: string, onVoteUpdate?: VoteUpdateCallback) => {
  const queryClient = useQueryClient();
  const previousVotesRef = useRef<Record<string, number>>({});

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
          const newData = payload.new as any;
          const previousVoteCount = previousVotesRef.current[newData.id] || 0;
          
          // Call the callback if vote count changed
          if (onVoteUpdate && newData.vote_count !== previousVoteCount) {
            onVoteUpdate(newData.id, newData.vote_count, previousVoteCount);
          }
          
          // Update the reference
          previousVotesRef.current[newData.id] = newData.vote_count;
          
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
  }, [contestId, queryClient, onVoteUpdate]);

  // Initialize vote counts from current data
  const initializeVoteCounts = useCallback((contestants: any[]) => {
    contestants.forEach((c: any) => {
      if (previousVotesRef.current[c.id] === undefined) {
        previousVotesRef.current[c.id] = c.vote_count;
      }
    });
  }, []);

  return { initializeVoteCounts };
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
