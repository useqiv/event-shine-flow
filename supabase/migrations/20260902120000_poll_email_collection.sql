-- Allow anonymous poll voters to check for duplicate email submissions
CREATE OR REPLACE FUNCTION public.check_form_email_submitted(
  p_form_id uuid,
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := lower(trim(p_email));
  IF v_email = '' OR v_email IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.forms
    WHERE id = p_form_id
    AND is_active = true
    AND is_accepting_responses = true
    AND (
      form_type != 'poll'
      OR approval_status = 'approved'
    )
  ) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.form_responses
    WHERE form_id = p_form_id
    AND lower(trim(respondent_email)) = v_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_form_email_submitted(uuid, text) TO anon, authenticated;

-- Polls are one vote per email
UPDATE public.forms
SET allow_multiple_submissions = false
WHERE form_type = 'poll';
