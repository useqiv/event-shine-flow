-- Drop the conflicting policies
DROP POLICY IF EXISTS "Users can insert their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Anyone can claim free tickets as guest" ON public.tickets;

-- Recreate with proper role targeting
-- Policy for authenticated users inserting their own tickets
CREATE POLICY "Authenticated users can insert their own tickets" 
ON public.tickets 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for anonymous users claiming free tickets
CREATE POLICY "Anon users can claim free tickets" 
ON public.tickets 
FOR INSERT 
TO anon
WITH CHECK (
  user_id IS NULL 
  AND guest_email IS NOT NULL 
  AND amount_paid = 0
);