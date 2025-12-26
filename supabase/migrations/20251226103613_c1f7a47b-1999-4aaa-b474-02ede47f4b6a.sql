-- Add separate commission rate columns for votes and tickets
ALTER TABLE public.organization_approvals 
ADD COLUMN IF NOT EXISTS vote_commission_rate NUMERIC,
ADD COLUMN IF NOT EXISTS ticket_commission_rate NUMERIC;

-- Add comment to clarify the columns
COMMENT ON COLUMN public.organization_approvals.special_commission_rate IS 'Legacy/fallback commission rate for all transactions';
COMMENT ON COLUMN public.organization_approvals.vote_commission_rate IS 'Custom commission rate for votes (overrides platform default)';
COMMENT ON COLUMN public.organization_approvals.ticket_commission_rate IS 'Custom commission rate for tickets (overrides platform default)';