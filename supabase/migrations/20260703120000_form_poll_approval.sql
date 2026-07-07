-- Poll / Quick Vote approval workflow for organization forms
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS form_type text NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

-- Existing forms remain standard and approved
UPDATE public.forms
SET form_type = 'standard', approval_status = 'approved'
WHERE form_type IS NULL OR approval_status IS NULL;

-- Tag the Poll / Quick Vote template
UPDATE public.form_templates
SET template_data = template_data || '{"form_type": "poll"}'::jsonb
WHERE name = 'Poll / Quick Vote';

-- Public visibility: active forms, with polls requiring admin approval
DROP POLICY IF EXISTS "Anyone can view active forms" ON public.forms;
CREATE POLICY "Anyone can view active forms" ON public.forms
  FOR SELECT USING (
    is_active = true
    AND (
      form_type != 'poll'
      OR approval_status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Anyone can view fields of active forms" ON public.form_fields;
CREATE POLICY "Anyone can view fields of active forms" ON public.form_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_fields.form_id
      AND forms.is_active = true
      AND (
        forms.form_type != 'poll'
        OR forms.approval_status = 'approved'
      )
    )
  );

DROP POLICY IF EXISTS "Anyone can submit form responses" ON public.form_responses;
CREATE POLICY "Anyone can submit form responses" ON public.form_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_responses.form_id
      AND forms.is_active = true
      AND forms.is_accepting_responses = true
      AND (
        forms.form_type != 'poll'
        OR forms.approval_status = 'approved'
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_forms_poll_approval ON public.forms (form_type, approval_status)
  WHERE form_type = 'poll';
