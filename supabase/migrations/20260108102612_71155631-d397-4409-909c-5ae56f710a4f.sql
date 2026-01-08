-- Drop the insecure policies that allow users to modify their own roles
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

-- Keep only the admin management policy and read policy
-- Users should only be able to VIEW their own roles, never modify them
-- Role changes should only happen via admin or secure backend functions