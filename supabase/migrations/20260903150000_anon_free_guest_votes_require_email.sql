-- Require guest email for anonymous free votes.

DROP POLICY IF EXISTS "Anon users can cast free guest votes" ON public.votes;
DROP POLICY IF EXISTS "Anon users can view free guest votes" ON public.votes;

CREATE POLICY "Anon users can cast free guest votes"
ON public.votes
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND amount_paid = 0
  AND payment_method = 'free'
  AND guest_email IS NOT NULL
  AND guest_email != ''
);

CREATE POLICY "Anon users can view free guest votes"
ON public.votes
FOR SELECT
TO anon
USING (
  user_id IS NULL
  AND amount_paid = 0
  AND payment_method = 'free'
  AND guest_email IS NOT NULL
);
