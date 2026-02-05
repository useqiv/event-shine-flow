-- Add notification toggles for organizations (admin-controlled)
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS notify_on_vote BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_on_ticket BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_on_donation BOOLEAN NOT NULL DEFAULT false;