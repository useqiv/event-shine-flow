import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  endOfMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';
import {
  getBaseAmountsByTransactionId,
  getConvenienceFeeSettings,
  getWalletTransactionsByTransactionId,
  resolveTicketBaseAmount,
  resolveVoteBaseAmount,
  stripConvenienceFeeFromGross,
} from '@/lib/baseAmount';
import { getPaidTransactionCurrency } from '@/components/ui/currency-selector';
import type { OrganizationSettings } from '@/hooks/useOrganization';

export interface MonthlyGoalMetrics {
  revenue: number;
  votes: number;
  tickets: number;
  donations: number;
}

export interface MonthlyGoalTargets extends MonthlyGoalMetrics {
  source: 'custom' | 'growth' | 'starter';
}

const STARTER_TARGETS: Record<string, MonthlyGoalMetrics> = {
  NGN: { revenue: 100_000, votes: 500, tickets: 50, donations: 25 },
  USD: { revenue: 1_000, votes: 500, tickets: 50, donations: 25 },
  DEFAULT: { revenue: 1_000, votes: 500, tickets: 50, donations: 25 },
};

function roundRevenueTarget(value: number): number {
  if (value <= 0) return value;
  if (value < 100) return Math.ceil(value / 10) * 10;
  if (value < 1_000) return Math.ceil(value / 50) * 50;
  if (value < 10_000) return Math.ceil(value / 100) * 100;
  if (value < 100_000) return Math.ceil(value / 1_000) * 1_000;
  return Math.ceil(value / 10_000) * 10_000;
}

function growthTarget(lastValue: number, starter: number): number {
  if (lastValue > 0) {
    return Math.max(Math.ceil(lastValue * 1.1), lastValue + 1);
  }
  return starter;
}

function resolveTargets(
  lastMonth: MonthlyGoalMetrics,
  currency: string,
  orgSettings: OrganizationSettings | null | undefined,
): MonthlyGoalTargets {
  const starter = STARTER_TARGETS[currency] ?? STARTER_TARGETS.DEFAULT;
  const hasCustom =
    orgSettings?.monthly_revenue_goal != null ||
    orgSettings?.monthly_votes_goal != null ||
    orgSettings?.monthly_tickets_goal != null ||
    orgSettings?.monthly_donations_goal != null;

  if (hasCustom) {
    return {
      revenue: Number(orgSettings?.monthly_revenue_goal) || starter.revenue,
      votes: orgSettings?.monthly_votes_goal ?? starter.votes,
      tickets: orgSettings?.monthly_tickets_goal ?? starter.tickets,
      donations: orgSettings?.monthly_donations_goal ?? starter.donations,
      source: 'custom',
    };
  }

  const hasHistory =
    lastMonth.revenue > 0 ||
    lastMonth.votes > 0 ||
    lastMonth.tickets > 0 ||
    lastMonth.donations > 0;

  if (hasHistory) {
    return {
      revenue: roundRevenueTarget(growthTarget(lastMonth.revenue, starter.revenue)),
      votes: growthTarget(lastMonth.votes, starter.votes),
      tickets: growthTarget(lastMonth.tickets, starter.tickets),
      donations: growthTarget(lastMonth.donations, starter.donations),
      source: 'growth',
    };
  }

  return { ...starter, source: 'starter' };
}

async function fetchMonthlyMetrics(
  organizationId: string,
  currency: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<MonthlyGoalMetrics> {
  const convenienceFeeSettings = await getConvenienceFeeSettings();
  const startIso = rangeStart.toISOString();
  const endIso = rangeEnd.toISOString();

  let revenue = 0;
  let votes = 0;
  let tickets = 0;
  let donations = 0;

  const { data: events } = await supabase
    .from('events')
    .select('id')
    .eq('organization_id', organizationId);

  const eventIds = events?.map((e) => e.id) || [];

  if (eventIds.length > 0) {
    const { data: ticketTypes } = await supabase
      .from('ticket_types')
      .select('id, currency, price')
      .in('event_id', eventIds)
      .eq('currency', currency);

    const ticketTypeIds = ticketTypes?.map((tt) => tt.id) || [];
    const ticketTypePriceMap = new Map(
      (ticketTypes || []).map((tt) => [tt.id, Number(tt.price) || 0]),
    );

    if (ticketTypeIds.length > 0) {
      const { data: ticketRows } = await supabase
        .from('tickets')
        .select(
          'amount_paid, net_amount, platform_commission, quantity, ticket_type_id, transaction_id, created_at',
        )
        .in('ticket_type_id', ticketTypeIds)
        .gte('created_at', startIso)
        .lte('created_at', endIso);

      const baseAmountMap = await getBaseAmountsByTransactionId(
        ticketRows?.map((t) => t.transaction_id) || [],
      );

      ticketRows?.forEach((t) => {
        const baseAmount = resolveTicketBaseAmount({
          transactionId: t.transaction_id,
          walletBaseAmount: t.transaction_id ? baseAmountMap.get(t.transaction_id) : undefined,
          amountPaid: t.amount_paid,
          netAmount: t.net_amount,
          platformCommission: t.platform_commission,
          quantity: t.quantity,
          ticketPrice: ticketTypePriceMap.get(t.ticket_type_id) ?? null,
          convenienceFeeSettings,
        });
        revenue += baseAmount;
        tickets += Number(t.quantity) || 0;
      });
    }
  }

  const { data: contests } = await supabase
    .from('contests')
    .select('id, vote_currency, vote_price')
    .eq('organization_id', organizationId)
    .eq('vote_currency', currency);

  const contestIds = contests?.map((c) => c.id) || [];
  const contestVotePriceMap: Record<string, number> = {};
  contests?.forEach((c) => {
    contestVotePriceMap[c.id] = Number(c.vote_price) || 0;
  });

  if (contestIds.length > 0) {
    const [{ data: voteRows }, { data: voteOptions }] = await Promise.all([
      supabase
        .from('votes')
        .select(
          'amount_paid, net_amount, platform_commission, quantity, contest_id, transaction_id, currency, created_at',
        )
        .in('contest_id', contestIds)
        .gte('created_at', startIso)
        .lte('created_at', endIso),
      supabase
        .from('contest_vote_options')
        .select('contest_id, vote_quantity, price')
        .in('contest_id', contestIds),
    ]);

    const voteOptionPriceMap = new Map<string, number>();
    voteOptions?.forEach((option) => {
      voteOptionPriceMap.set(
        `${option.contest_id}:${option.vote_quantity}`,
        Number(option.price) || 0,
      );
    });

    const walletTxMap = await getWalletTransactionsByTransactionId(
      voteRows?.map((v) => v.transaction_id) || [],
    );
    const baseAmountMap = await getBaseAmountsByTransactionId(
      voteRows?.map((v) => v.transaction_id) || [],
    );

    voteRows?.forEach((v) => {
      const listingCurrency = currency;
      const walletTx = v.transaction_id ? walletTxMap.get(v.transaction_id) : undefined;
      const paidCurrency = getPaidTransactionCurrency(
        v.currency,
        walletTx?.currency,
        listingCurrency,
      );
      if (paidCurrency !== currency) return;

      const baseAmount = resolveVoteBaseAmount({
        transactionId: v.transaction_id,
        walletBaseAmount: v.transaction_id ? baseAmountMap.get(v.transaction_id) : undefined,
        amountPaid: v.amount_paid,
        netAmount: v.net_amount,
        platformCommission: v.platform_commission,
        quantity: v.quantity,
        voteOptionPrice: voteOptionPriceMap.get(`${v.contest_id}:${v.quantity}`) ?? null,
        contestVotePrice: contestVotePriceMap[v.contest_id] ?? null,
        convenienceFeeSettings,
      });
      revenue += baseAmount;
      votes += Number(v.quantity) || 0;
    });
  }

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id')
    .eq('creator_id', organizationId);

  const campaignIds = campaigns?.map((c) => c.id) || [];

  if (campaignIds.length > 0) {
    const { data: donationRows } = await supabase
      .from('donations')
      .select('amount, net_amount, platform_commission, currency, transaction_id, created_at')
      .in('campaign_id', campaignIds)
      .eq('status', 'completed')
      .eq('currency', currency)
      .gte('created_at', startIso)
      .lte('created_at', endIso);

    const baseAmountMap = await getBaseAmountsByTransactionId(
      donationRows?.map((d) => d.transaction_id) || [],
    );

    donationRows?.forEach((d) => {
      const netAmount = Number(d.net_amount);
      const platformCommission = Number(d.platform_commission);
      const settledBaseAmount =
        Number.isFinite(netAmount) && Number.isFinite(platformCommission)
          ? netAmount + platformCommission
          : 0;
      const normalizedSettledAmount = stripConvenienceFeeFromGross(
        settledBaseAmount,
        convenienceFeeSettings,
      );
      const normalizedRecordedAmount = stripConvenienceFeeFromGross(
        Number(d.amount) || 0,
        convenienceFeeSettings,
      );
      const baseAmount =
        baseAmountMap.get(d.transaction_id) ??
        normalizedSettledAmount ??
        normalizedRecordedAmount ??
        0;
      revenue += Number(baseAmount) || 0;
      donations += 1;
    });
  }

  return { revenue, votes, tickets, donations };
}

export const useOrgMonthlyGoalMetrics = (
  currency: string,
  orgSettings: OrganizationSettings | null | undefined,
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['org-monthly-goal-metrics', user?.id, currency],
    queryFn: async () => {
      const now = new Date();
      const currentStart = startOfMonth(now);
      const currentEnd = endOfMonth(now);
      const lastStart = startOfMonth(subMonths(now, 1));
      const lastEnd = endOfMonth(subMonths(now, 1));

      const [currentMonth, lastMonth] = await Promise.all([
        fetchMonthlyMetrics(user!.id, currency, currentStart, currentEnd),
        fetchMonthlyMetrics(user!.id, currency, lastStart, lastEnd),
      ]);

      const targets = resolveTargets(lastMonth, currency, orgSettings);

      return { currentMonth, lastMonth, targets };
    },
    enabled: !!user && !!currency,
  });
};
