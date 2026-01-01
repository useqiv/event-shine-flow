
-- Reset all wallet balances to zero
UPDATE public.wallets SET balance = 0, updated_at = now();

-- Reset all currency-specific balances to zero
UPDATE public.wallet_currency_balances SET balance = 0, updated_at = now();
