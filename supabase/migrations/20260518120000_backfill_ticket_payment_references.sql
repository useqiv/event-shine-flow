-- Backfill ticket payment_reference_id from linked wallet transactions (Flutterwave tx_ref)
UPDATE public.tickets t
SET payment_reference_id = wt.reference_id
FROM public.wallet_transactions wt
WHERE t.transaction_id = wt.id
  AND t.payment_reference_id IS NULL
  AND wt.reference_id IS NOT NULL;
