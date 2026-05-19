import { supabase } from '@/integrations/supabase/client';
import { getPaidTransactionCurrency } from '@/components/ui/currency-selector';
import {
  getConvenienceFeeSettings,
  getWalletTransactionsByTransactionId,
  resolveTicketBaseAmount,
  resolveVotePaidRevenue,
} from '@/lib/baseAmount';
import { normalizeRevenueByCurrency } from '@/lib/revenueByCurrency';

const SUCCESS_TICKET_STATUSES = ['active', 'confirmed', 'used', 'completed'];

export type AdminFinanceSourceTotals = {
  votes: number;
  tickets: number;
  donations: number;
  forms: number;
  total: number;
  voteCount: number;
  ticketCount: number;
  donationCount: number;
  formCount: number;
};

export type AdminFinanceOverview = {
  byCurrency: Record<string, AdminFinanceSourceTotals>;
  activeCurrencies: string[];
};

function emptySourceTotals(): AdminFinanceSourceTotals {
  return {
    votes: 0,
    tickets: 0,
    donations: 0,
    forms: 0,
    total: 0,
    voteCount: 0,
    ticketCount: 0,
    donationCount: 0,
    formCount: 0,
  };
}

function addToBucket(
  byCurrency: Record<string, AdminFinanceSourceTotals>,
  currency: string,
  source: 'votes' | 'tickets' | 'donations' | 'forms',
  amount: number,
) {
  const code = currency.trim().toUpperCase();
  if (!code || amount <= 0) return;
  if (!byCurrency[code]) byCurrency[code] = emptySourceTotals();
  byCurrency[code][source] += amount;
  byCurrency[code].total += amount;
  if (source === 'votes') byCurrency[code].voteCount += 1;
  if (source === 'tickets') byCurrency[code].ticketCount += 1;
  if (source === 'donations') byCurrency[code].donationCount += 1;
  if (source === 'forms') byCurrency[code].formCount += 1;
}

/** Platform finance totals bucketed by actual paid currency (never listing-only). */
export async function fetchAdminFinanceOverview(options?: {
  start?: string;
  end?: string;
}): Promise<AdminFinanceOverview> {
  let votesQuery = supabase
    .from('votes')
    .select(
      `
      transaction_id,
      quantity,
      currency,
      amount_paid,
      net_amount,
      platform_commission,
      contest_id,
      created_at,
      contests!inner(vote_currency, vote_price)
    `,
    );

  let ticketsQuery = supabase
    .from('tickets')
    .select(
      `
      transaction_id,
      quantity,
      amount_paid,
      net_amount,
      platform_commission,
      status,
      created_at,
      ticket_types!inner(currency, price)
    `,
    )
    .in('status', SUCCESS_TICKET_STATUSES);

  let donationsQuery = supabase
    .from('donations')
    .select('amount, currency, status, created_at')
    .eq('status', 'completed');

  let formsQuery = supabase
    .from('form_responses')
    .select('payment_amount, payment_status, submitted_at, forms!inner(payment_currency)')
    .eq('payment_status', 'completed')
    .not('payment_amount', 'is', null)
    .gt('payment_amount', 0);

  if (options?.start) {
    votesQuery = votesQuery.gte('created_at', options.start);
    ticketsQuery = ticketsQuery.gte('created_at', options.start);
    donationsQuery = donationsQuery.gte('created_at', options.start);
    formsQuery = formsQuery.gte('submitted_at', options.start);
  }
  if (options?.end) {
    votesQuery = votesQuery.lte('created_at', options.end);
    ticketsQuery = ticketsQuery.lte('created_at', options.end);
    donationsQuery = donationsQuery.lte('created_at', options.end);
    formsQuery = formsQuery.lte('submitted_at', options.end);
  }

  const [votesRes, ticketsRes, donationsRes, formsRes] = await Promise.all([
    votesQuery,
    ticketsQuery,
    donationsQuery,
    formsQuery,
  ]);

  if (votesRes.error) throw votesRes.error;
  if (ticketsRes.error) throw ticketsRes.error;
  if (donationsRes.error) throw donationsRes.error;
  if (formsRes.error) throw formsRes.error;

  const votes = votesRes.data || [];
  const tickets = ticketsRes.data || [];
  const donations = donationsRes.data || [];
  const forms = formsRes.data || [];

  const contestIds = [...new Set(votes.map((v: any) => v.contest_id).filter(Boolean))];
  const { data: voteOptions } = await supabase
    .from('contest_vote_options')
    .select('contest_id, vote_quantity, price')
    .in('contest_id', contestIds.length ? contestIds : ['00000000-0000-0000-0000-000000000000']);

  const voteOptionPriceMap = new Map<string, number>();
  voteOptions?.forEach((option) => {
    voteOptionPriceMap.set(
      `${option.contest_id}:${option.vote_quantity}`,
      Number(option.price) || 0,
    );
  });

  const transactionIds = [
    ...votes.map((v: any) => v.transaction_id),
    ...tickets.map((t: any) => t.transaction_id),
  ];

  const [convenienceFeeSettings, walletTxMap] = await Promise.all([
    getConvenienceFeeSettings(),
    getWalletTransactionsByTransactionId(transactionIds),
  ]);

  const byCurrency: Record<string, AdminFinanceSourceTotals> = {};

  votes.forEach((v: any) => {
    const walletTx = v.transaction_id ? walletTxMap.get(v.transaction_id) : undefined;
    const listingCurrency = (v.contests?.vote_currency || 'NGN').toUpperCase();
    const paidCurrency = getPaidTransactionCurrency(
      v.currency,
      walletTx?.currency,
      listingCurrency,
    );
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
      contestVotePrice: Number(v.contests?.vote_price) || 0,
      convenienceFeeSettings,
    });
    addToBucket(byCurrency, paidCurrency, 'votes', Number(baseAmount) || 0);
  });

  tickets.forEach((t: any) => {
    const currency = (t.ticket_types?.currency || 'NGN').toUpperCase();
    const walletTx = t.transaction_id ? walletTxMap.get(t.transaction_id) : undefined;
    const baseAmount = resolveTicketBaseAmount({
      transactionId: t.transaction_id,
      walletBaseAmount: walletTx?.amount,
      amountPaid: t.amount_paid,
      netAmount: t.net_amount,
      platformCommission: t.platform_commission,
      quantity: t.quantity,
      ticketPrice: Number(t.ticket_types?.price) || 0,
      convenienceFeeSettings,
    });
    addToBucket(byCurrency, currency, 'tickets', Number(baseAmount) || 0);
  });

  donations.forEach((d: any) => {
    const currency = (d.currency || 'USD').toUpperCase();
    addToBucket(byCurrency, currency, 'donations', Number(d.amount) || 0);
  });

  forms.forEach((f: any) => {
    const currency = (f.forms?.payment_currency || 'NGN').toUpperCase();
    addToBucket(byCurrency, currency, 'forms', Number(f.payment_amount) || 0);
  });

  const normalized = normalizeRevenueByCurrency(
    Object.fromEntries(Object.entries(byCurrency).map(([c, s]) => [c, s.total])),
  );

  const activeCurrencies = Object.keys(normalized).sort(
    (a, b) => (normalized[b] || 0) - (normalized[a] || 0),
  );

  return { byCurrency, activeCurrencies };
}

export function getFinanceStatsForCurrency(
  overview: AdminFinanceOverview | undefined,
  currency: string,
): AdminFinanceSourceTotals {
  const code = currency.trim().toUpperCase();
  return overview?.byCurrency[code] || emptySourceTotals();
}

export function buildRevenueBreakdownPie(stats: AdminFinanceSourceTotals) {
  const { votes, tickets, donations, forms, total } = stats;
  if (total <= 0) {
    return [
      { name: 'Votes', value: 0, color: 'hsl(var(--chart-1))' },
      { name: 'Tickets', value: 0, color: 'hsl(var(--chart-2))' },
      { name: 'Donations', value: 0, color: 'hsl(var(--chart-3))' },
      { name: 'Forms', value: 0, color: 'hsl(var(--chart-4))' },
    ];
  }
  const slices = [
    { name: 'Votes', amount: votes, color: 'hsl(var(--chart-1))' },
    { name: 'Tickets', amount: tickets, color: 'hsl(var(--chart-2))' },
    { name: 'Donations', amount: donations, color: 'hsl(var(--chart-3))' },
    { name: 'Forms', amount: forms, color: 'hsl(var(--chart-4))' },
  ].filter((s) => s.amount > 0);

  return slices.map((s) => ({
    name: s.name,
    value: Math.round((s.amount / total) * 100),
    color: s.color,
  }));
}
