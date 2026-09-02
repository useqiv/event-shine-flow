-- Allow free votes (payment_method = 'free') on the votes table
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_payment_method_check;
ALTER TABLE public.votes ADD CONSTRAINT votes_payment_method_check
  CHECK (payment_method = ANY (ARRAY[
    'wallet'::text,
    'card'::text,
    'bank_transfer'::text,
    'usdt'::text,
    'free'::text,
    'crypto'::text
  ]));
