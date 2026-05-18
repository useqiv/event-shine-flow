import { supabase } from '@/integrations/supabase/client';

export type ConvenienceFeeType = 'none' | 'percentage' | 'fixed';

export interface ConvenienceFeeSettings {
  type: ConvenienceFeeType;
  value: number;
  cap: number | null;
}

/**
 * For vote/ticket transactions, Flutterwave may charge "base amount + fees".
 * Org dashboards should report revenue based on the base amount (i.e. excluding fees).
 *
 * We store the fee-free base in `wallet_transactions.amount` and link records via `transaction_id`.
 */
export type WalletTransactionSnapshot = {
  amount: number;
  currency: string;
};

export async function getWalletTransactionsByTransactionId(
  transactionIds: Array<string | null | undefined>,
) {
  const ids = Array.from(
    new Set(transactionIds.filter((id): id is string => typeof id === 'string' && id.length > 0)),
  );

  if (ids.length === 0) return new Map<string, WalletTransactionSnapshot>();

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('id, amount, currency')
    .in('id', ids);

  if (error) throw error;

  return new Map(
    (data || []).map((t) => [
      t.id,
      {
        amount: Number(t.amount) || 0,
        currency: (t.currency || 'NGN').toUpperCase(),
      },
    ]),
  );
}

export async function getBaseAmountsByTransactionId(transactionIds: Array<string | null | undefined>) {
  const walletTxMap = await getWalletTransactionsByTransactionId(transactionIds);
  return new Map(Array.from(walletTxMap.entries()).map(([id, tx]) => [id, tx.amount]));
}

export async function getConvenienceFeeSettings(): Promise<ConvenienceFeeSettings> {
  const { data: paymentSettingsRows, error } = await supabase
    .from('platform_settings')
    .select('setting_key, setting_value')
    .eq('category', 'payment')
    .in('setting_key', ['convenience_fee_type', 'convenience_fee_value', 'convenience_fee_cap']);

  if (error) throw error;

  const capRaw = paymentSettingsRows?.find((s) => s.setting_key === 'convenience_fee_cap')?.setting_value;
  let cap: number | null = null;
  if (capRaw != null && capRaw !== '') {
    const parsed = Number(capRaw);
    cap = Number.isFinite(parsed) ? parsed : null;
  }

  return {
    type: (paymentSettingsRows?.find((s) => s.setting_key === 'convenience_fee_type')?.setting_value ||
      'none') as ConvenienceFeeType,
    value: Number(paymentSettingsRows?.find((s) => s.setting_key === 'convenience_fee_value')?.setting_value) || 0,
    cap,
  };
}

/** Reverse convenience fee from a gross total charged to the voter. */
export function stripConvenienceFeeFromGross(grossAmount: number, settings: ConvenienceFeeSettings): number {
  const gross = Number(grossAmount) || 0;
  if (gross <= 0) return 0;

  const feeValue = Number(settings.value) || 0;
  const cap = settings.cap != null ? Number(settings.cap) : null;

  if (settings.type === 'fixed') {
    return Math.max(0, gross - feeValue);
  }

  if (settings.type === 'percentage' && feeValue > 0) {
    const rate = feeValue / 100;

    if (cap && cap > 0) {
      const baseAtCap = cap / rate;
      const grossAtCap = baseAtCap + cap;
      if (gross > grossAtCap) {
        return Math.max(0, gross - cap);
      }
    }

    return Math.max(0, gross / (1 + rate));
  }

  return gross;
}

export function resolveVoteBaseAmount(params: {
  transactionId?: string | null;
  walletBaseAmount?: number | null;
  amountPaid?: number | null;
  netAmount?: number | null;
  platformCommission?: number | null;
  quantity?: number;
  voteOptionPrice?: number | null;
  contestVotePrice?: number | null;
  convenienceFeeSettings: ConvenienceFeeSettings;
  /** Currency the customer paid in (votes.currency). */
  paidCurrency?: string | null;
  /** Contest listing currency (contests.vote_currency). */
  listingCurrency?: string | null;
}): number {
  const quantity = params.quantity || 1;
  const paid = (params.paidCurrency || params.listingCurrency || 'NGN').toUpperCase();
  const listing = (params.listingCurrency || params.paidCurrency || 'NGN').toUpperCase();
  const crossCurrency = paid !== listing;

  const netAmount = Number(params.netAmount);
  const platformCommission = Number(params.platformCommission);
  const settledBaseAmount =
    Number.isFinite(netAmount) && Number.isFinite(platformCommission)
      ? netAmount + platformCommission
      : 0;

  const normalizedSettledAmount = stripConvenienceFeeFromGross(
    settledBaseAmount,
    params.convenienceFeeSettings,
  );
  const normalizedRecordedAmount = stripConvenienceFeeFromGross(
    Number(params.amountPaid) || 0,
    params.convenienceFeeSettings,
  );

  const contestVotePrice = params.contestVotePrice || 0;
  const contestVotePriceAmount =
    contestVotePrice > 0 ? contestVotePrice * quantity : undefined;
  const catalogBase = params.voteOptionPrice ?? contestVotePriceAmount ?? null;

  let walletBase =
    params.walletBaseAmount != null && params.transactionId
      ? Number(params.walletBaseAmount)
      : null;

  // Only compare wallet to catalog when both are in the same currency
  if (
    !crossCurrency &&
    catalogBase != null &&
    walletBase != null &&
    walletBase > catalogBase + 0.01
  ) {
    walletBase = catalogBase;
  }

  // Cross-currency: prefer vote record amounts (actual charge), not wallet/catalog
  if (crossCurrency) {
    return (
      normalizedRecordedAmount ??
      normalizedSettledAmount ??
      (walletBase != null ? walletBase : null) ??
      Number(params.amountPaid) ||
      0
    );
  }

  return (
    walletBase ??
    normalizedSettledAmount ??
    normalizedRecordedAmount ??
    params.voteOptionPrice ??
    contestVotePriceAmount ??
    0
  );
}

/** Revenue amount in the currency the voter paid — safe for multi-currency contests. */
export function resolveVotePaidRevenue(params: {
  paidCurrency: string;
  listingCurrency: string;
  transactionId?: string | null;
  walletAmount?: number | null;
  walletCurrency?: string | null;
  amountPaid?: number | null;
  netAmount?: number | null;
  platformCommission?: number | null;
  quantity?: number;
  voteOptionPrice?: number | null;
  contestVotePrice?: number | null;
  convenienceFeeSettings: ConvenienceFeeSettings;
}): number {
  const paid = (params.paidCurrency || 'NGN').toUpperCase();
  const listing = (params.listingCurrency || 'NGN').toUpperCase();

  // Paid in a different currency than the contest listing: use amount_paid only
  if (paid !== listing) {
    const netAmount = Number(params.netAmount);
    const platformCommission = Number(params.platformCommission);
    const settledBaseAmount =
      Number.isFinite(netAmount) && Number.isFinite(platformCommission)
        ? netAmount + platformCommission
        : 0;
    const normalizedSettledAmount = stripConvenienceFeeFromGross(
      settledBaseAmount,
      params.convenienceFeeSettings,
    );
    const normalizedRecordedAmount = stripConvenienceFeeFromGross(
      Number(params.amountPaid) || 0,
      params.convenienceFeeSettings,
    );

    return (
      normalizedRecordedAmount ??
      normalizedSettledAmount ??
      Number(params.amountPaid) ||
      0
    );
  }

  const walletCurrency = params.walletCurrency?.toUpperCase();
  const walletAmount =
    params.transactionId &&
    params.walletAmount != null &&
    (!walletCurrency || walletCurrency === paid)
      ? Number(params.walletAmount)
      : null;

  return resolveVoteBaseAmount({
    transactionId: params.transactionId,
    walletBaseAmount: walletAmount,
    amountPaid: params.amountPaid,
    netAmount: params.netAmount,
    platformCommission: params.platformCommission,
    quantity: params.quantity,
    voteOptionPrice: params.voteOptionPrice,
    contestVotePrice: params.contestVotePrice,
    convenienceFeeSettings: params.convenienceFeeSettings,
    paidCurrency: paid,
    listingCurrency: listing,
  });
}

export function resolveTicketBaseAmount(params: {
  transactionId?: string | null;
  walletBaseAmount?: number | null;
  amountPaid?: number | null;
  netAmount?: number | null;
  platformCommission?: number | null;
  quantity?: number;
  ticketPrice?: number | null;
  convenienceFeeSettings: ConvenienceFeeSettings;
}): number {
  const quantity = params.quantity || 1;
  const netAmount = Number(params.netAmount);
  const platformCommission = Number(params.platformCommission);
  const settledBaseAmount =
    Number.isFinite(netAmount) && Number.isFinite(platformCommission)
      ? netAmount + platformCommission
      : 0;

  const normalizedSettledAmount = stripConvenienceFeeFromGross(
    settledBaseAmount,
    params.convenienceFeeSettings
  );
  const normalizedRecordedAmount = stripConvenienceFeeFromGross(
    Number(params.amountPaid) || 0,
    params.convenienceFeeSettings
  );

  const ticketPriceAmount =
    params.ticketPrice != null && params.ticketPrice > 0
      ? params.ticketPrice * quantity
      : undefined;

  let walletBase =
    params.walletBaseAmount != null && params.transactionId
      ? Number(params.walletBaseAmount)
      : null;

  if (ticketPriceAmount != null && walletBase != null && walletBase > ticketPriceAmount + 0.01) {
    walletBase = ticketPriceAmount;
  }

  return (
    walletBase ??
    ticketPriceAmount ??
    normalizedSettledAmount ??
    normalizedRecordedAmount ??
    0
  );
}
