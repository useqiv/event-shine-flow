-- Add logo_url column to events table for event branding
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS logo_url TEXT;