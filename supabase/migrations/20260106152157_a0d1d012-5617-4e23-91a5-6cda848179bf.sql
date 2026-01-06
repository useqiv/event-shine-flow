-- Drop existing constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated constraint with all notification types
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'vote'::text,
  'ticket'::text,
  'wallet'::text,
  'system'::text,
  'promotion'::text,
  'team_invite'::text,
  'ticket_milestone'::text,
  'influencer'::text,
  'contest'::text,
  'payment'::text,
  'fraud_alert'::text,
  'streak'::text,
  'campaign_update'::text,
  'referral'::text,
  'event_reminder'::text,
  'payout'::text
]));