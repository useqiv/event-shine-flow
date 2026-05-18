/**
 * Multi-currency revenue helpers.
 * Rule: never add amounts across different currencies — bucket by paid currency only.
 */

export function normalizeRevenueByCurrency(
  grossByCurrency: Record<string, number> | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!grossByCurrency) return out;

  Object.entries(grossByCurrency).forEach(([code, amount]) => {
    const currency = code.trim().toUpperCase();
    const value = Number(amount) || 0;
    if (!currency || value <= 0) return;
    out[currency] = (out[currency] || 0) + value;
  });

  return out;
}

/** Currencies that actually have paid revenue (never invent listing currency). */
export function getActiveRevenueCurrencies(
  grossByCurrency: Record<string, number> | undefined,
  listingCurrency: string,
): string[] {
  const normalized = normalizeRevenueByCurrency(grossByCurrency);
  const keys = Object.keys(normalized).sort(
    (a, b) => (normalized[b] || 0) - (normalized[a] || 0),
  );

  if (keys.length === 0) {
    return [(listingCurrency || 'NGN').toUpperCase()];
  }

  const listing = (listingCurrency || 'NGN').toUpperCase();
  if (normalized[listing] != null) {
    return [listing, ...keys.filter((k) => k !== listing)];
  }

  return keys;
}

export function applyCommissionToRevenueByCurrency(
  grossByCurrency: Record<string, number> | undefined,
  commissionRatePercent: number,
): Record<string, number> {
  const rate = Math.max(0, Math.min(100, Number(commissionRatePercent) || 0)) / 100;
  const normalized = normalizeRevenueByCurrency(grossByCurrency);
  const net: Record<string, number> = {};

  Object.entries(normalized).forEach(([currency, gross]) => {
    net[currency] = gross * (1 - rate);
  });

  return net;
}

export function hasMultipleRevenueCurrencies(grossByCurrency: Record<string, number> | undefined): boolean {
  return Object.keys(normalizeRevenueByCurrency(grossByCurrency)).length > 1;
}
