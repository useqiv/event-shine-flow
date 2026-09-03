-- Allow anonymous users to cast and read back free guest votes.
-- INSERT was already allowed for anon (user_id IS NULL) but POST ...?select=*
-- fails without a matching SELECT policy (PostgREST returns 401).

DROP POLICY IF EXISTS "Guest votes allowed" ON public.votes;

CREATE POLICY "Anon users can cast free guest votes"
ON public.votes
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND amount_paid = 0
  AND payment_method = 'free'
);

CREATE POLICY "Anon users can view free guest votes"
ON public.votes
FOR SELECT
TO anon
USING (
  user_id IS NULL
  AND amount_paid = 0
  AND payment_method = 'free'
);
