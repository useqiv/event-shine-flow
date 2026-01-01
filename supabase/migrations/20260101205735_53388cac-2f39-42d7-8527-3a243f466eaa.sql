-- Add status column to form_responses for tracking reviewed/pending/archived
ALTER TABLE public.form_responses 
ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Add allow_multiple_submissions column to forms (false = single submission per email)
ALTER TABLE public.forms 
ADD COLUMN allow_multiple_submissions boolean NOT NULL DEFAULT true;

-- Create storage bucket for form file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('form-uploads', 'form-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Anyone can upload to form-uploads bucket
CREATE POLICY "Anyone can upload form files"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'form-uploads');

-- Storage policy: Anyone can view form files
CREATE POLICY "Anyone can view form files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'form-uploads');

-- Add unique constraint to prevent duplicate email submissions when configured
-- We'll handle this logic in the application layer since it's conditional

-- Update RLS policy for form_responses to allow status updates by form owners
DROP POLICY IF EXISTS "Form owners can update responses" ON public.form_responses;

CREATE POLICY "Form owners can update responses"
ON public.form_responses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = form_responses.form_id
    AND forms.user_id = auth.uid()
  )
);

-- Allow form owners to delete responses
DROP POLICY IF EXISTS "Form owners can delete responses" ON public.form_responses;

CREATE POLICY "Form owners can delete responses"
ON public.form_responses
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = form_responses.form_id
    AND forms.user_id = auth.uid()
  )
);