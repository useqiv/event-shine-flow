-- Guest Flutterwave checkouts store pending rows without wallet/user FKs (tracked via reference_id + payment_metadata).
ALTER TABLE public.wallet_transactions
  ALTER COLUMN wallet_id DROP NOT NULL,
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;

ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_type_check
  CHECK (
    type = ANY (
      ARRAY[
        'deposit'::text,
        'withdrawal'::text,
        'vote'::text,
        'ticket'::text,
        'referral'::text,
        'voucher'::text,
        'donation'::text,
        'form'::text
      ]
    )
  );
