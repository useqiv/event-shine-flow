-- Add custom branding columns to contests table
ALTER TABLE public.contests
ADD COLUMN IF NOT EXISTS custom_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '#7c3aed',
ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '#f97316',
ADD COLUMN IF NOT EXISTS brand_logo_url TEXT;

-- Create index for custom slug lookups
CREATE INDEX IF NOT EXISTS idx_contests_custom_slug ON public.contests(custom_slug) WHERE custom_slug IS NOT NULL;