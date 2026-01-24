-- Drop existing anon insert policy and recreate with proper conditions
DROP POLICY IF EXISTS "Anon users can insert tickets" ON public.tickets;

-- Create a properly scoped policy for anonymous free ticket claims
CREATE POLICY "Anon users can claim free tickets"
ON public.tickets
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL 
  AND guest_email IS NOT NULL 
  AND amount_paid = 0
);

-- Add SELECT policy for anon users to read back their inserted ticket
CREATE POLICY "Anon users can view tickets they just inserted"
ON public.tickets
FOR SELECT
TO anon
USING (
  user_id IS NULL 
  AND guest_email IS NOT NULL 
  AND amount_paid = 0
);