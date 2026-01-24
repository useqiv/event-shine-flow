-- Drop the existing restrictive guest policy  
DROP POLICY IF EXISTS "Guests can claim free tickets" ON public.tickets;

-- Create a more permissive guest ticket policy that works for anon AND authenticated users
-- without a user_id (both can claim free tickets as guests)
CREATE POLICY "Anyone can claim free tickets as guest" ON public.tickets
  FOR INSERT 
  WITH CHECK (
    user_id IS NULL 
    AND guest_email IS NOT NULL
    AND amount_paid = 0
  );