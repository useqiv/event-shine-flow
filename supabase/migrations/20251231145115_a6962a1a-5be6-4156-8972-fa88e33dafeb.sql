-- Make user_id nullable to support guest purchases
ALTER TABLE public.tickets ALTER COLUMN user_id DROP NOT NULL;

-- Add guest_email column for guest purchases
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Update RLS policy to allow inserting tickets with null user_id (for webhook)
-- The webhook uses service role, so RLS doesn't apply, but we should still update the policy for consistency

-- Add index for guest email lookups
CREATE INDEX IF NOT EXISTS idx_tickets_guest_email ON public.tickets(guest_email) WHERE guest_email IS NOT NULL;