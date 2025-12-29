-- Add currency column to payouts table
ALTER TABLE public.payouts 
ADD COLUMN currency text NOT NULL DEFAULT 'USD';