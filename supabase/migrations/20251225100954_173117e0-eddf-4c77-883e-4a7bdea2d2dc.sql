-- Add currency column to contests table
ALTER TABLE public.contests 
ADD COLUMN IF NOT EXISTS vote_currency text NOT NULL DEFAULT 'NGN';

-- Add comment for clarity
COMMENT ON COLUMN public.contests.vote_currency IS 'Currency code for vote pricing (e.g., NGN, USD, EUR, GBP)';