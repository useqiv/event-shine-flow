-- Add contest_type column to contests table
ALTER TABLE public.contests 
ADD COLUMN contest_type text NOT NULL DEFAULT 'single';

-- Add comment for clarity
COMMENT ON COLUMN public.contests.contest_type IS 'Type of contest: single (direct contestants) or category (contestants within categories)';