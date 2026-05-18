-- Persist payment intent at init so webhook can fulfill votes even if Flutterwave meta is incomplete.
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS payment_metadata JSONB;

COMMENT ON COLUMN public.wallet_transactions.payment_metadata IS
  'Vote/ticket/donation fields captured at payment init (contest_id, contestant_id, vote_quantity, etc.)';
