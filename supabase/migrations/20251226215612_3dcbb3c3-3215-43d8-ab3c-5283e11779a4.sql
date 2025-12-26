-- Add currency column to ticket_types with USD as default
ALTER TABLE public.ticket_types 
ADD COLUMN currency text NOT NULL DEFAULT 'USD';

-- Update contests default vote_currency to USD
ALTER TABLE public.contests 
ALTER COLUMN vote_currency SET DEFAULT 'USD';

-- Update any existing platform setting for default currency to USD
UPDATE public.platform_settings 
SET setting_value = 'USD' 
WHERE setting_key = 'flutterwave_default_currency';

-- Insert default currency setting if it doesn't exist
INSERT INTO public.platform_settings (setting_key, setting_value, category, description)
VALUES ('default_currency', 'USD', 'currency', 'Default currency for the platform')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'USD';