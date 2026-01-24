-- Drop the existing constraint
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_payment_method_check;

-- Add the new constraint with 'free' included
ALTER TABLE public.tickets ADD CONSTRAINT tickets_payment_method_check 
  CHECK (payment_method = ANY (ARRAY['wallet'::text, 'card'::text, 'bank_transfer'::text, 'usdt'::text, 'free'::text]));