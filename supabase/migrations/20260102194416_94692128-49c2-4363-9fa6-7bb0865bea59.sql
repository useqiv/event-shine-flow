-- Add live stream columns to contests table
ALTER TABLE public.contests
ADD COLUMN IF NOT EXISTS stream_url text,
ADD COLUMN IF NOT EXISTS stream_platform text DEFAULT 'youtube';

-- Add live stream columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS stream_url text,
ADD COLUMN IF NOT EXISTS stream_platform text DEFAULT 'youtube';