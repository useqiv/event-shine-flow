-- Capture Flutterwave tx_ref on votes (parity with tickets.payment_reference_id)
ALTER TABLE public.votes
  ADD COLUMN IF NOT EXISTS payment_reference_id TEXT;

CREATE INDEX IF NOT EXISTS idx_votes_payment_reference_id
  ON public.votes (payment_reference_id)
  WHERE payment_reference_id IS NOT NULL;

-- Capture Flutterwave charge id and flw_ref on wallet_transactions
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_provider_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_gateway_transaction_id
  ON public.wallet_transactions (gateway_transaction_id)
  WHERE gateway_transaction_id IS NOT NULL;

COMMENT ON COLUMN public.votes.payment_reference_id IS
  'Flutterwave tx_ref (e.g. vote_1715950000000_abc123) for support and reconciliation';

COMMENT ON COLUMN public.wallet_transactions.gateway_transaction_id IS
  'Payment provider charge id (Flutterwave numeric transaction id)';

COMMENT ON COLUMN public.wallet_transactions.gateway_provider_reference IS
  'Payment provider reference (Flutterwave flw_ref)';

-- Backfill vote references from linked wallet transactions
UPDATE public.votes v
SET payment_reference_id = wt.reference_id
FROM public.wallet_transactions wt
WHERE v.transaction_id = wt.id
  AND v.payment_reference_id IS NULL
  AND wt.reference_id IS NOT NULL;

-- Recreate secure votes view (column order must not shift existing columns)
DROP VIEW IF EXISTS public.votes_public;

CREATE VIEW public.votes_public WITH (security_invoker = true) AS
SELECT 
  v.id,
  v.contest_id,
  v.contestant_id,
  v.user_id,
  v.quantity,
  v.amount_paid,
  v.payment_method,
  v.created_at,
  v.transaction_id,
  v.currency,
  v.platform_commission,
  v.net_amount,
  v.payment_reference_id,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.contests c 
      WHERE c.id = v.contest_id 
      AND c.organization_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin'::app_role)
    THEN v.guest_email
    ELSE NULL
  END as guest_email,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.contests c 
      WHERE c.id = v.contest_id 
      AND c.organization_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin'::app_role)
    THEN v.guest_name
    ELSE NULL
  END as guest_name
FROM public.votes v;

GRANT SELECT ON public.votes_public TO authenticated;
