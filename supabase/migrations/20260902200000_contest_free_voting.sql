-- Allow organizations to create free-voting contests
ALTER TABLE public.contests
  ADD COLUMN IF NOT EXISTS is_free_voting boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.contests.is_free_voting IS 'When true, voters can cast votes without payment.';
