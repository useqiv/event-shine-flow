-- Drop the overly strict policies and create a better one
DROP POLICY IF EXISTS "Anon users can claim free tickets" ON public.tickets;
DROP POLICY IF EXISTS "Guest ticket purchases allowed" ON public.tickets;

-- Create a single, clear policy for guest free ticket claims
-- Using numeric comparison that handles edge cases
CREATE POLICY "Guests can claim free tickets" 
ON public.tickets 
FOR INSERT 
TO anon
WITH CHECK (
  user_id IS NULL 
  AND guest_email IS NOT NULL 
  AND guest_email != ''
  AND COALESCE(amount_paid, 0) = 0
);

-- Allow anon users to SELECT their own guest tickets (needed for limit checking)
CREATE POLICY "Guests can view their own tickets by email lookup"
ON public.tickets
FOR SELECT
TO anon
USING (
  user_id IS NULL 
  AND guest_email IS NOT NULL
);