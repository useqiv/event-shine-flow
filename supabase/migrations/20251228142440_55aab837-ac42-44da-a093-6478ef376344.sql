-- Add currency column to wallet_transactions table
ALTER TABLE public.wallet_transactions 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'NGN';

-- Also add currency column to wallets table for balance display
ALTER TABLE public.wallets 
ADD COLUMN balance_currency TEXT NOT NULL DEFAULT 'NGN';