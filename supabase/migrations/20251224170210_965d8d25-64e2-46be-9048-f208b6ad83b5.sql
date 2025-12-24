-- Allow organizations to update tickets for their events (mark as used)
CREATE POLICY "Organizations can update tickets for their events"
ON public.tickets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = tickets.event_id 
    AND events.organization_id = auth.uid()
  )
);