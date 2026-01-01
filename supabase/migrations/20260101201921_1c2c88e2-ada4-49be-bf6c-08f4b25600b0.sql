-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can submit form responses" ON public.form_responses;

-- Create a permissive policy that allows truly anonymous submissions
CREATE POLICY "Anyone can submit form responses" 
ON public.form_responses 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = form_responses.form_id 
    AND forms.is_active = true 
    AND forms.is_accepting_responses = true
  )
);