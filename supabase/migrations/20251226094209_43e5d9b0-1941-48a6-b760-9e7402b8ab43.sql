-- Create ticket_transfers table to track transfer history
CREATE TABLE public.ticket_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  to_user_email TEXT NOT NULL,
  transfer_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '48 hours')
);

-- Enable RLS
ALTER TABLE public.ticket_transfers ENABLE ROW LEVEL SECURITY;

-- Policy for users to view transfers they initiated or received
CREATE POLICY "Users can view their own transfers"
ON public.ticket_transfers
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Policy for users to create transfers for their own tickets
CREATE POLICY "Users can create transfers for their tickets"
ON public.ticket_transfers
FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id AND
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE tickets.id = ticket_id 
    AND tickets.user_id = auth.uid()
    AND tickets.status = 'active'
  )
);

-- Policy for users to update transfers they're involved in
CREATE POLICY "Users can update their transfers"
ON public.ticket_transfers
FOR UPDATE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Policy to allow users to claim transfers by code (for accepting transfers)
CREATE POLICY "Users can view pending transfers by code"
ON public.ticket_transfers
FOR SELECT
USING (status = 'pending' AND expires_at > now());

-- Create index for faster lookups
CREATE INDEX idx_ticket_transfers_ticket_id ON public.ticket_transfers(ticket_id);
CREATE INDEX idx_ticket_transfers_transfer_code ON public.ticket_transfers(transfer_code);
CREATE INDEX idx_ticket_transfers_to_user_email ON public.ticket_transfers(to_user_email);