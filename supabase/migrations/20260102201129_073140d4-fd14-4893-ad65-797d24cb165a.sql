
-- Add admin policy for votes table
CREATE POLICY "Admins can view all votes"
ON public.votes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy for tickets table
CREATE POLICY "Admins can view all tickets"
ON public.tickets
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also add admin ALL policy for full management capability
CREATE POLICY "Admins can manage all votes"
ON public.votes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all tickets"
ON public.tickets
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
