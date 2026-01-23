-- Allow guest users to claim free tickets (insert with null user_id and guest_email provided)
CREATE POLICY "Guests can claim free tickets" ON public.tickets
  FOR INSERT WITH CHECK (
    user_id IS NULL AND guest_email IS NOT NULL
  );

-- Also allow guests to view their own tickets by email
CREATE POLICY "Guests can view their own tickets by email" ON public.tickets
  FOR SELECT USING (
    guest_email IS NOT NULL AND guest_email = current_setting('request.headers', true)::json->>'x-guest-email'
  );