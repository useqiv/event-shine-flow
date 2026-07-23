/**
 * Platform commission math — keep in sync with supabase/functions/flutterwave-webhook calculateCommission.
 */

import { supabase } from '@/integrations/supabase/client';

export type PlatformCommissionResult = {
  quantity: number;
  gross: number;
  percentFee: number;
  flatFee: number;
  totalFee: number;
  net: number;
  feePerUnit: number;
};

/** Keys readable under RLS (category=public). Do not filter by category='commission'. */
export const PLATFORM_COMMISSION_SETTING_KEYS = [
  'vote_commission_percentage',
  'ticket_commission_percentage',
  'campaign_commission_percentage',
  'platform_commission_percentage',
] as const;

export type OrgCommissionApproval = {
  vote_commission_rate?: number | null;
  ticket_commission_rate?: number | null;
  special_commission_rate?: number | null;
} | null | undefined;

export function parsePlatformCommissionSettings(
  rows: { setting_key: string; setting_value: string | null }[] | null | undefined,
): Record<string, number> {
  const settings: Record<string, number> = {};
  rows?.forEach((s) => {
    settings[s.setting_key] = Number(s.setting_value) || 0;
  });
  return settings;
}

export async function fetchPlatformCommissionSettings(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('setting_key, setting_value')
    .in('setting_key', [...PLATFORM_COMMISSION_SETTING_KEYS]);

  if (error) throw error;
  return parsePlatformCommissionSettings(data);
}

export function resolveOrgCommissionRates(
  platformSettings: Record<string, number>,
  orgApproval?: OrgCommissionApproval,
) {
  const platformVote =
    platformSettings.vote_commission_percentage ||
    platformSettings.platform_commission_percentage ||
    10;
  const platformTicket =
    platformSettings.ticket_commission_percentage ||
    platformSettings.platform_commission_percentage ||
    10;
  const platformCampaign =
    platformSettings.campaign_commission_percentage ||
    platformSettings.platform_commission_percentage ||
    10;

  return {
    voteCommissionRate:
      orgApproval?.vote_commission_rate ??
      orgApproval?.special_commission_rate ??
      platformVote,
    ticketCommissionRate:
      orgApproval?.ticket_commission_rate ??
      orgApproval?.special_commission_rate ??
      platformTicket,
    campaignCommissionRate:
      orgApproval?.special_commission_rate ?? platformCampaign,
  };
}

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
