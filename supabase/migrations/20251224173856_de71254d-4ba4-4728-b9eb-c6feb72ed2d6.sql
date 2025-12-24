-- Add policy to allow users to insert their own roles
CREATE POLICY "Users can insert their own roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add policy to allow users to delete their own roles
CREATE POLICY "Users can delete their own roles"
ON public.user_roles
FOR DELETE
USING (auth.uid() = user_id);

-- Add policy to allow users to update their own roles
CREATE POLICY "Users can update their own roles"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id);