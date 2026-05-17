/**
 * Platform commission math — keep in sync with supabase/functions/flutterwave-webhook calculateCommission.
 */

export type PlatformCommissionResult = {
  quantity: number;
  gross: number;
  percentFee: number;
  flatFee: number;
  totalFee: number;
  net: number;
  feePerUnit: number;
};

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Percentage commission on a single transaction amount (matches webhook). */
export function calculatePercentCommission(
  amount: number,
  ratePercent: number
): { commission: number; netAmount: number } {
  const commission = roundMoney((amount * ratePercent) / 100);
  const netAmount = roundMoney(amount - commission);
  return { commission, netAmount };
}

/**
 * Estimate organizer payout for a sale.
 * - Percent is applied to total gross (price × quantity), same as one checkout transaction.
 * - Flat fee is per transaction, not multiplied by quantity.
 */
export function calculatePricingFee(params: {
  unitPrice: number;
  quantity: number;
  ratePercent: number;
  flatFeePerTransaction?: number;
}): PlatformCommissionResult {
  const unitPrice = Math.max(0, params.unitPrice);
  const quantity = Math.max(0, Math.floor(params.quantity));
  const gross = roundMoney(unitPrice * quantity);
  const flatFee = params.flatFeePerTransaction ? roundMoney(params.flatFeePerTransaction) : 0;

  const { commission: percentFee } = calculatePercentCommission(gross, params.ratePercent);
  const totalFee = roundMoney(percentFee + flatFee);
  const net = roundMoney(Math.max(0, gross - totalFee));
  const feePerUnit = quantity > 0 ? roundMoney(totalFee / quantity) : roundMoney(percentFee + flatFee);

  return { quantity, gross, percentFee, flatFee, totalFee, net, feePerUnit };
}

export function formatFeeFormula(params: {
  ratePercent: number;
  flatFee: number;
  currencySymbol: string;
  includeFlatFee: boolean;
}): string {
  const { ratePercent, flatFee, currencySymbol, includeFlatFee } = params;
  if (includeFlatFee && flatFee > 0) {
    return `${ratePercent}% + ${currencySymbol}${flatFee}`;
  }
  return `${ratePercent}%`;
}
