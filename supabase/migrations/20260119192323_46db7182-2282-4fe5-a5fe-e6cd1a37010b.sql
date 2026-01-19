-- Add commission tracking columns to votes table
ALTER TABLE public.votes 
ADD COLUMN IF NOT EXISTS platform_commission NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC DEFAULT 0;

-- Add commission tracking columns to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS platform_commission NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC DEFAULT 0;

-- Add commission tracking columns to donations table
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS platform_commission NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC DEFAULT 0;