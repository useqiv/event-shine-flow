-- Add custom_slug columns to events, campaigns, and nominations tables
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS custom_slug TEXT UNIQUE;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS custom_slug TEXT UNIQUE;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS custom_slug TEXT UNIQUE;

-- Add unique constraint to contests custom_slug if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contests_custom_slug_key'
  ) THEN
    ALTER TABLE public.contests ADD CONSTRAINT contests_custom_slug_key UNIQUE (custom_slug);
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_custom_slug ON public.events(custom_slug) WHERE custom_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_custom_slug ON public.campaigns(custom_slug) WHERE custom_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nominations_custom_slug ON public.nominations(custom_slug) WHERE custom_slug IS NOT NULL;