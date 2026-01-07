-- Add commission rate columns to contests table
ALTER TABLE public.contests
ADD COLUMN commission_rate NUMERIC DEFAULT NULL;

-- Add commission rate columns to events table
ALTER TABLE public.events
ADD COLUMN commission_rate NUMERIC DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.contests.commission_rate IS 'Override commission rate for this specific contest (percentage). NULL means use org/platform default.';
COMMENT ON COLUMN public.events.commission_rate IS 'Override commission rate for this specific event (percentage). NULL means use org/platform default.';