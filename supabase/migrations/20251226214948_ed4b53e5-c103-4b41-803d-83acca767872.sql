-- Add low balance threshold column to wallets
ALTER TABLE public.wallets 
ADD COLUMN low_balance_threshold numeric DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.wallets.low_balance_threshold IS 'User-configurable threshold for low balance alerts';