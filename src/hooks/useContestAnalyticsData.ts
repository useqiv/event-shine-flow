/**
 * Hook for fetching and calculating contest analytics
 * Revenue uses fee-free base amounts (aligned with EntityTransactionHistory)
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getBaseAmountsByTransactionId,
  getConvenienceFeeSettings,
  resolveVoteBaseAmount,
} from '@/lib/baseAmount';
import {
  calculateFullAnalytics,
  type VoteRecord,
  type ContestantRecord,
  type AnalyticsResult,
} from '@/lib/analyticsUtils';

export interface ContestDetails {
  id: string;
  title: string;
  total_votes: number;
  vote_price: number;
  vote_currency: string;
  start_date: string;
  end_date: string;
  organization_id?: string;
}

export interface ContestAnalyticsResult extends AnalyticsResult {
  /** Sum of contestant vote_count (leaderboard totals) */
  leaderboardVoteTotal: number;
  /** Whether vote rows and contest.total_votes disagree */
  votesMismatch: boolean;
}

interface UseContestAnalyticsReturn {
  contest: ContestDetails | null;
  analytics: ContestAnalyticsResult;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const INITIAL_ANALYTICS: ContestAnalyticsResult = {
  totalRevenue: 0,
  totalVotes: 0,
  uniqueVoters: 0,
  averageVotesPerVoter: 0,
  peakVotingHours: [],
  dailyVotes: [],
  topContestants: [],
  voterPaymentMethods: [],
  leaderboardVoteTotal: 0,
  votesMismatch: false,
};

export const useContestAnalyticsData = (contestId: string | undefined): UseContestAnalyticsReturn => {
  const [contest, setContest] = useState<ContestDetails | null>(null);
  const [analytics, setAnalytics] = useState<ContestAnalyticsResult>(INITIAL_ANALYTICS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => setRefetchTrigger((prev) => prev + 1);

  useEffect(() => {
    if (!contestId) {
      setIsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [
          contestRes,
          votesRes,
          contestantsRes,
          voteOptionsRes,
        ] = await Promise.all([
          supabase
            .from('contests')
            .select('id, title, total_votes, vote_price, vote_currency, start_date, end_date, organization_id')
            .eq('id', contestId)
            .single(),
          supabase
            .from('votes_public')
            .select(
              'id, user_id, guest_email, quantity, amount_paid, payment_method, created_at, transaction_id, net_amount, platform_commission'
            )
            .eq('contest_id', contestId),
          supabase
            .from('contestants')
            .select('id, name, vote_count')
            .eq('contest_id', contestId)
            .order('vote_count', { ascending: false }),
          supabase
            .from('contest_vote_options')
            .select('vote_quantity, price')
            .eq('contest_id', contestId),
        ]);

        if (contestRes.error) throw contestRes.error;
        if (votesRes.error) throw votesRes.error;
        if (contestantsRes.error) throw contestantsRes.error;
        if (voteOptionsRes.error) throw voteOptionsRes.error;

        const contestData = contestRes.data;
        if (contestData) setContest(contestData);

        const votes = votesRes.data || [];
        const contestants = contestantsRes.data || [];
        const contestVotePrice = Number(contestData?.vote_price) || 0;

        const [convenienceFeeSettings, baseAmountMap] = await Promise.all([
          getConvenienceFeeSettings(),
          getBaseAmountsByTransactionId(votes.map((v) => v.transaction_id)),
        ]);

        const voteOptionPriceMap = new Map(
          (voteOptionsRes.data || []).map((option) => [
            option.vote_quantity,
            Number(option.price) || 0,
          ])
        );

        const voteRecords: VoteRecord[] = votes.map((v) => {
          const transactionId = v.transaction_id;
          const walletBaseAmount = transactionId ? baseAmountMap.get(transactionId) : undefined;
          const base_amount = resolveVoteBaseAmount({
            transactionId,
            walletBaseAmount,
            amountPaid: v.amount_paid,
            netAmount: v.net_amount,
            platformCommission: v.platform_commission,
            quantity: v.quantity,
            voteOptionPrice: voteOptionPriceMap.get(v.quantity) ?? null,
            contestVotePrice,
            convenienceFeeSettings,
          });

          return {
            id: v.id,
            user_id: v.user_id,
            guest_email: v.guest_email,
            quantity: v.quantity,
            amount_paid: Number(v.amount_paid) || 0,
            base_amount,
            payment_method: v.payment_method,
            created_at: v.created_at,
          };
        });

        const contestantRecords: ContestantRecord[] = contestants.map((c) => ({
          id: c.id,
          name: c.name,
          vote_count: c.vote_count,
        }));

        const baseAnalytics = calculateFullAnalytics(voteRecords, contestantRecords, 14);
        const leaderboardVoteTotal = contestants.reduce((sum, c) => sum + c.vote_count, 0);
        const recordedTotalVotes = contestData?.total_votes ?? 0;
        const votesMismatch =
          Math.abs(baseAnalytics.totalVotes - recordedTotalVotes) > 0 ||
          Math.abs(leaderboardVoteTotal - baseAnalytics.totalVotes) > 0;

        setAnalytics({
          ...baseAnalytics,
          leaderboardVoteTotal,
          votesMismatch,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [contestId, refetchTrigger]);

  return { contest, analytics, isLoading, error, refetch };
};

/**
 * Memoized computed values for chart rendering
 */
export const useChartMaxValues = (analytics: ContestAnalyticsResult) => {
  return useMemo(
    () => ({
      maxHourlyCount: Math.max(...analytics.peakVotingHours.map((h) => h.count), 1),
      maxDailyVotes: Math.max(...analytics.dailyVotes.map((d) => d.votes), 1),
      maxDailyRevenue: Math.max(...analytics.dailyVotes.map((d) => d.revenue), 1),
    }),
    [analytics.peakVotingHours, analytics.dailyVotes]
  );
};
