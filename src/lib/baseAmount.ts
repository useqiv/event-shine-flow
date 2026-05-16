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
export async function getBaseAmountsByTransactionId(transactionIds: Array<string | null | undefined>) {
  const ids = Array.from(
    new Set(transactionIds.filter((id): id is string => typeof id === 'string' && id.length > 0))
  );

  if (ids.length === 0) return new Map<string, number>();

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('id, amount')
    .in('id', ids);

  if (error) throw error;

  return new Map((data || []).map((t) => [t.id, Number(t.amount) || 0]));
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

  const contestVotePrice = params.contestVotePrice || 0;
  const contestVotePriceAmount =
    contestVotePrice > 0 ? contestVotePrice * quantity : undefined;
  const catalogBase = params.voteOptionPrice ?? contestVotePriceAmount ?? null;

  let walletBase =
    params.walletBaseAmount != null && params.transactionId
      ? Number(params.walletBaseAmount)
      : null;

  // wallet_transactions.amount should be fee-free; if it exceeds catalog price it may include fees
  if (catalogBase != null && walletBase != null && walletBase > catalogBase + 0.01) {
    walletBase = catalogBase;
  }

  return (
    walletBase ??
    params.voteOptionPrice ??
    contestVotePriceAmount ??
    normalizedSettledAmount ??
    normalizedRecordedAmount ??
    0
  );
}
