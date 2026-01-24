-- Drop the existing guest insert policy
DROP POLICY IF EXISTS "Guests can claim free tickets" ON public.tickets;

-- Recreate as a PERMISSIVE policy (which is the default, but making it explicit)
-- The key fix: this policy needs to use PERMISSIVE (default) mode
-- and we need to adjust the logic to work with anonymous users

-- For guest ticket claims (anonymous users with guest_email)
CREATE POLICY "Guests can claim free tickets" ON public.tickets
  FOR INSERT 
  TO anon
  WITH CHECK (
    user_id IS NULL 
    AND guest_email IS NOT NULL
    AND amount_paid = 0
  );