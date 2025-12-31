-- Add currency column to events table
ALTER TABLE public.events 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'NGN';

-- Update existing ticket_types to inherit currency from events if not set
-- (This ensures consistency going forward)