-- Optional monthly goal overrides for organization dashboard
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS monthly_revenue_goal numeric,
ADD COLUMN IF NOT EXISTS monthly_votes_goal integer,
ADD COLUMN IF NOT EXISTS monthly_tickets_goal integer,
ADD COLUMN IF NOT EXISTS monthly_donations_goal integer;
