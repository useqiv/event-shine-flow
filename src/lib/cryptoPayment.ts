export const CRYPTO_NETWORK = 'polygon' as const;
export const CRYPTO_NETWORK_LABEL = 'Polygon';
export const CRYPTO_CURRENCIES = ['USDT', 'USDC'] as const;
export const CRYPTO_MIN_AMOUNT = 5;

export type CryptoCurrency = (typeof CRYPTO_CURRENCIES)[number];

const GUEST_SESSION_KEY = 'crypto_guest_user_id';

export function getOrCreateGuestUserId(prefix = 'guest'): string {
  const key = `${GUEST_SESSION_KEY}_${prefix}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem(key, id);
  return id;
}

export function getCryptoMinimumMessage(cryptoCurrency: CryptoCurrency = 'USDT'): string | null {
  return `Minimum funding amount is ${CRYPTO_MIN_AMOUNT} ${cryptoCurrency} on Polygon.`;
}

export function isBelowCryptoMinimum(amountUsd: number): boolean {
  return amountUsd < CRYPTO_MIN_AMOUNT;
}

export function convertToUsd(
  amount: number,
  currency: string,
  rates: Record<string, number> | undefined,
): number {
  if (currency === 'USD') return amount;
  if (!rates) return amount;
  const usdRate = rates['USD'] || 1;
  const sourceRate = rates[currency] || 1;
  return Math.round(((amount * usdRate) / sourceRate) * 100) / 100;
}
