import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  getConvenienceFeeSettings,
  getWalletTransactionsByTransactionId,
  resolveVotePaidRevenue,
} from '@/lib/baseAmount';
import { getPaidTransactionCurrency } from '@/components/ui/currency-selector';
import { normalizeRevenueByCurrency } from '@/lib/revenueByCurrency';

type VoteRow = {
  amount_paid: number;
  net_amount: number | null;
  platform_commission: number | null;
  quantity: number;
  contest_id: string;
  transaction_id: string | null;
  currency: string | null;
};

async function aggregateVoteRevenueForContests(contestIds: string[]) {
  if (contestIds.length === 0) {
    return {} as Record<string, { grossByCurrency: Record<string, number>; totalVotes: number }>;
  }

  const { data: contests } = await supabase
    .from('contests')
    .select('id, vote_currency, vote_price')
    .in('id', contestIds);

  const contestCurrencyMap: Record<string, string> = {};
  const contestVotePriceMap: Record<string, number> = {};
  contests?.forEach((c) => {
    contestCurrencyMap[c.id] = c.vote_currency || 'NGN';
    contestVotePriceMap[c.id] = Number(c.vote_price) || 0;
  });

  const { data: votes, error } = await supabase
    .from('votes')
    .select(
      'amount_paid, net_amount, platform_commission, quantity, contest_id, transaction_id, currency',
    )
    .in('contest_id', contestIds);

  if (error) throw error;

  const voteRows = (votes || []) as VoteRow[];
  const [convenienceFeeSettings, walletTxMap, voteOptionsRes] = await Promise.all([
    getConvenienceFeeSettings(),
    getWalletTransactionsByTransactionId(voteRows.map((v) => v.transaction_id)),
    supabase
      .from('contest_vote_options')
      .select('contest_id, vote_quantity, price')
      .in('contest_id', contestIds),
  ]);

  const voteOptionPriceMap = new Map<string, number>();
  voteOptionsRes.data?.forEach((option) => {
    voteOptionPriceMap.set(
      `${option.contest_id}:${option.vote_quantity}`,
      Number(option.price) || 0,
    );
  });

  const result: Record<string, { grossByCurrency: Record<string, number>; totalVotes: number }> = {};
  contestIds.forEach((id) => {
    result[id] = { grossByCurrency: {}, totalVotes: 0 };
  });

  voteRows.forEach((v) => {
    const walletTx = v.transaction_id ? walletTxMap.get(v.transaction_id) : undefined;
    const paidCurrency = getPaidTransactionCurrency(
      v.currency,
      walletTx?.currency,
      contestCurrencyMap[v.contest_id],
    );

    const listingCurrency = contestCurrencyMap[v.contest_id] || 'NGN';
    const baseAmount = resolveVotePaidRevenue({
      paidCurrency,
      listingCurrency,
      transactionId: v.transaction_id,
      walletAmount: walletTx?.amount,
      walletCurrency: walletTx?.currency,
      amountPaid: v.amount_paid,
      netAmount: v.net_amount,
      platformCommission: v.platform_commission,
      quantity: v.quantity,
      voteOptionPrice: voteOptionPriceMap.get(`${v.contest_id}:${v.quantity}`) ?? null,
      contestVotePrice: contestVotePriceMap[v.contest_id] || 0,
      convenienceFeeSettings,
    });

    const bucket = result[v.contest_id];
    if (!bucket) return;

    bucket.grossByCurrency[paidCurrency] =
      (bucket.grossByCurrency[paidCurrency] || 0) + Number(baseAmount || 0);
    bucket.totalVotes += Number(v.quantity) || 0;
  });

  Object.values(result).forEach((entry) => {
    entry.grossByCurrency = normalizeRevenueByCurrency(entry.grossByCurrency);
  });

  return result;
}

export function useContestRevenueByCurrency(contestId: string | undefined) {
  const query = useQuery({
    queryKey: ['contest-revenue-by-currency', contestId],
    queryFn: async () => {
      if (!contestId) return { grossByCurrency: {} as Record<string, number>, totalVotes: 0 };
      const map = await aggregateVoteRevenueForContests([contestId]);
      return map[contestId] || { grossByCurrency: {}, totalVotes: 0 };
    },
    enabled: !!contestId,
  });

  return {
    grossByCurrency: query.data?.grossByCurrency || {},
    totalVotes: query.data?.totalVotes || 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useContestsRevenueByCurrency(contestIds: string[]) {
  return useQuery({
    queryKey: ['contests-revenue-by-currency', contestIds.sort().join(',')],
    queryFn: () => aggregateVoteRevenueForContests(contestIds),
    enabled: contestIds.length > 0,
  });
}
