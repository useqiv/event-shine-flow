-- Backfill legacy financial records to fee-free base amounts.
-- Goal: ensure org revenue analytics never include convenience fee for historical rows.

-- 1) Canonical fix: when transaction is linked to wallet_transactions,
--    use wallet_transactions.amount as the source of truth.
UPDATE public.votes v
SET amount_paid = wt.amount
FROM public.wallet_transactions wt
WHERE v.transaction_id = wt.id
  AND COALESCE(v.amount_paid, 0) <> COALESCE(wt.amount, 0);

UPDATE public.tickets t
SET amount_paid = wt.amount
FROM public.wallet_transactions wt
WHERE t.transaction_id = wt.id
  AND COALESCE(t.amount_paid, 0) <> COALESCE(wt.amount, 0);

UPDATE public.donations d
SET amount = wt.amount
FROM public.wallet_transactions wt
WHERE d.transaction_id = wt.id
  AND COALESCE(d.amount, 0) <> COALESCE(wt.amount, 0);

-- 2) Recovery fix for unlinked/missing-wallet vote records:
--    derive base from configured contest vote option package price.
UPDATE public.votes v
SET amount_paid = cvo.price
FROM public.contest_vote_options cvo
WHERE v.contest_id = cvo.contest_id
  AND v.quantity = cvo.vote_quantity
  AND (
    v.transaction_id IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM public.wallet_transactions wt
      WHERE wt.id = v.transaction_id
    )
  )
  AND COALESCE(v.amount_paid, 0) <> COALESCE(cvo.price, 0);

-- 3) Recovery fix for unlinked/missing-wallet ticket records:
--    derive base from ticket unit price * quantity purchased.
UPDATE public.tickets t
SET amount_paid = ROUND((COALESCE(tt.price, 0) * COALESCE(t.quantity, 0))::numeric, 2)
FROM public.ticket_types tt
WHERE t.ticket_type_id = tt.id
  AND (
    t.transaction_id IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM public.wallet_transactions wt
      WHERE wt.id = t.transaction_id
    )
  )
  AND COALESCE(t.amount_paid, 0) <> ROUND((COALESCE(tt.price, 0) * COALESCE(t.quantity, 0))::numeric, 2);
