-- Allow anonymous/authenticated users to read whether crypto checkout is enabled.
-- Without this, useCryptoSettings() returns no rows (RLS blocks category 'payment')
-- and the Pay with Crypto tab never appears on the public payment UI.
UPDATE public.platform_settings
SET category = 'public'
WHERE setting_key = 'crypto_payment_enabled';
