-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can submit nominations" ON public.nomination_submissions;

-- Create a permissive policy that allows anyone to insert
CREATE POLICY "Anyone can submit nominations"
ON public.nomination_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);