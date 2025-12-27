-- Create a function to send notifications to any user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_reference_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, reference_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_reference_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.send_notification TO authenticated;