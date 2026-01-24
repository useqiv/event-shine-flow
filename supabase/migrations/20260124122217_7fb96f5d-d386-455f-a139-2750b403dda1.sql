-- Drop and recreate with explicit numeric cast
DROP POLICY IF EXISTS "Anon users can claim free tickets" ON public.tickets;

CREATE POLICY "Anon users can claim free tickets" 
ON public.tickets 
FOR INSERT 
TO anon
WITH CHECK (
  user_id IS NULL 
  AND guest_email IS NOT NULL 
  AND amount_paid = 0::numeric
);