-- Allow anonymous read of commission percentages for public pricing calculator
UPDATE public.platform_settings
SET category = 'public'
WHERE setting_key IN (
  'platform_commission_percentage',
  'vote_commission_percentage',
  'ticket_commission_percentage',
  'campaign_commission_percentage',
  'donation_commission_percentage'
);
