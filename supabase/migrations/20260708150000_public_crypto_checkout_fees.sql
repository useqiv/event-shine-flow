-- Allow checkout UI to read crypto/convenience fee settings (RLS only exposes public/currency categories)
UPDATE public.platform_settings
SET category = 'public'
WHERE setting_key IN (
  'crypto_fee_percentage',
  'crypto_network_surcharge',
  'crypto_fee_pass_to_customer',
  'convenience_fee_type',
  'convenience_fee_value',
  'convenience_fee_cap'
);
