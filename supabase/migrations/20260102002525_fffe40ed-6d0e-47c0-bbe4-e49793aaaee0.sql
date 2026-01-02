-- Store payment tx_ref on tickets so the success page can reliably fetch the ticket
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS payment_reference_id text;

CREATE INDEX IF NOT EXISTS idx_tickets_payment_reference_id
ON public.tickets (payment_reference_id);
