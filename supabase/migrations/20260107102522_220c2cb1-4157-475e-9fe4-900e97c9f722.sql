-- Add state and country columns to contestants table for filtering
ALTER TABLE public.contestants 
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Nigeria';

-- Create index for faster searching
CREATE INDEX IF NOT EXISTS idx_contestants_state ON public.contestants(state);
CREATE INDEX IF NOT EXISTS idx_contestants_country ON public.contestants(country);