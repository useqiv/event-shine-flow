-- The "Admins can manage all submissions" policy is currently RESTRICTIVE and blocks non-admin inserts.
-- Recreate it as PERMISSIVE so it doesn't interfere with the public INSERT policy.

DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.nomination_submissions;

CREATE POLICY "Admins can manage all submissions"
ON public.nomination_submissions
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));