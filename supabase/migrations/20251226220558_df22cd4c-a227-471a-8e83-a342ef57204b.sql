-- Add default_currency column to organization_settings
ALTER TABLE public.organization_settings 
ADD COLUMN IF NOT EXISTS default_currency text NOT NULL DEFAULT 'USD';

-- Update existing records to have USD as default
UPDATE public.organization_settings 
SET default_currency = 'USD' 
WHERE default_currency IS NULL;