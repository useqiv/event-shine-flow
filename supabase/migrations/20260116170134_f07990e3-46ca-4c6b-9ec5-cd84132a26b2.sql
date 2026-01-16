-- Add currency column to votes table to properly track payment currency
ALTER TABLE public.votes 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';

-- Update existing votes to use the contest's vote_currency where possible
UPDATE public.votes v
SET currency = c.vote_currency
FROM public.contests c
WHERE v.contest_id = c.id AND v.currency = 'NGN';