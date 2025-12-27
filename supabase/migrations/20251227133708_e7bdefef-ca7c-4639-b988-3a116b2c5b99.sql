-- Drop the existing check constraint and add team_invite as an allowed type
ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY['vote'::text, 'ticket'::text, 'wallet'::text, 'system'::text, 'promotion'::text, 'team_invite'::text]));