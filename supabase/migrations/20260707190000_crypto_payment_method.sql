-- Add 'crypto' as a valid payment_method for votes, tickets, and donations
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_payment_method_check;
ALTER TABLE public.votes ADD CONSTRAINT votes_payment_method_check
  CHECK (payment_method = ANY (ARRAY['wallet'::text, 'card'::text, 'bank_transfer'::text, 'usdt'::text, 'crypto'::text]));

ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_payment_method_check;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_payment_method_check
  CHECK (payment_method = ANY (ARRAY['wallet'::text, 'card'::text, 'bank_transfer'::text, 'usdt'::text, 'free'::text, 'crypto'::text]));
