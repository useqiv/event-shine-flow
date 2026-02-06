-- Allow admins to manage all organization settings
CREATE POLICY "Admins can manage all organization settings"
ON public.organization_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));