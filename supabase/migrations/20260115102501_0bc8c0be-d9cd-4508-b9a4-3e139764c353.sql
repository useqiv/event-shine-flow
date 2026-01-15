-- Create a security definer function to update user role during account setup
-- This is safe because it only allows changing from the default 'user' role during initial setup
CREATE OR REPLACE FUNCTION public.set_account_type(
  p_user_id uuid,
  p_role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_role app_role;
  v_account_type_selected boolean;
BEGIN
  -- Verify the user is setting their own role
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'You can only set your own account type';
  END IF;
  
  -- Check if account type has already been selected
  SELECT account_type_selected INTO v_account_type_selected
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF v_account_type_selected = true THEN
    RAISE EXCEPTION 'Account type has already been selected';
  END IF;
  
  -- Get current role
  SELECT role INTO v_current_role
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  -- Only allow changing from default 'user' role during initial setup
  IF v_current_role IS NOT NULL AND v_current_role != 'user' THEN
    RAISE EXCEPTION 'Role has already been set';
  END IF;
  
  -- Delete existing role and insert new one
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, p_role);
  
  -- Mark account type as selected
  UPDATE public.profiles 
  SET account_type_selected = true 
  WHERE id = p_user_id;
END;
$$;