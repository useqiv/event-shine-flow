-- Let's try a very simple policy first to debug
DROP POLICY IF EXISTS "Anon users can claim free tickets" ON public.tickets;

-- Temporarily create a permissive policy for anon INSERT to test
CREATE POLICY "Anon users can insert tickets" 
ON public.tickets 
FOR INSERT 
TO anon
WITH CHECK (true);