-- Wallet security: lock down client-side credits, add atomic credit RPCs, fix multi-currency sync.

-- ---------------------------------------------------------------------------
-- 1) Sync legacy wallets.balance to primary currency bucket only (NGN default)
-- ---------------------------------------------------------------------------
INSERT INTO public.wallet_currency_balances (wallet_id, currency, balance)
SELECT w.id, COALESCE(w.balance_currency, 'NGN'), w.balance
FROM public.wallets w
WHERE w.balance > 0
ON CONFLICT (wallet_id, currency) DO NOTHING;

UPDATE public.wallets w
SET balance = COALESCE(
  (
    SELECT wcb.balance
    FROM public.wallet_currency_balances wcb
    WHERE wcb.wallet_id = w.id
      AND UPPER(wcb.currency) = UPPER(COALESCE(w.balance_currency, 'NGN'))
  ),
  0
),
updated_at = now();

-- ---------------------------------------------------------------------------
-- 2) Internal credit helper (not exposed to clients)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._apply_wallet_credit(
  p_wallet_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_currency text,
  p_type text,
  p_description text,
  p_reference_id text,
  p_update_referral_earnings boolean DEFAULT false,
  p_wallet_transaction_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet RECORD;
  v_currency text := COALESCE(NULLIF(TRIM(p_currency), ''), 'NGN');
  v_balance_currency text;
  v_mc RECORD;
  v_new_balance numeric;
  v_tx_status text;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  IF p_type NOT IN ('deposit', 'voucher', 'referral', 'refund') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid transaction type');
  END IF;

  IF p_wallet_transaction_id IS NOT NULL THEN
    SELECT status INTO v_tx_status
    FROM public.wallet_transactions
    WHERE id = p_wallet_transaction_id
      AND wallet_id = p_wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Wallet transaction not found');
    END IF;

    IF v_tx_status = 'completed' THEN
      RETURN jsonb_build_object('success', true, 'already_credited', true);
    END IF;
  END IF;

  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE id = p_wallet_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  v_balance_currency := UPPER(COALESCE(v_wallet.balance_currency, 'NGN'));

  IF UPPER(v_currency) = v_balance_currency THEN
    UPDATE public.wallets
    SET balance = COALESCE(balance, 0) + p_amount,
        referral_earnings = CASE
          WHEN p_update_referral_earnings THEN COALESCE(referral_earnings, 0) + p_amount
          ELSE referral_earnings
        END,
        updated_at = now()
    WHERE id = v_wallet.id;

    SELECT * INTO v_mc
    FROM public.wallet_currency_balances
    WHERE wallet_id = v_wallet.id
      AND UPPER(currency) = v_balance_currency
    FOR UPDATE;

    IF v_mc IS NULL THEN
      INSERT INTO public.wallet_currency_balances (wallet_id, currency, balance)
      VALUES (v_wallet.id, COALESCE(v_wallet.balance_currency, 'NGN'), p_amount);
      v_new_balance := p_amount;
    ELSE
      UPDATE public.wallet_currency_balances
      SET balance = COALESCE(balance, 0) + p_amount,
          updated_at = now()
      WHERE id = v_mc.id;
      v_new_balance := COALESCE(v_mc.balance, 0) + p_amount;
    END IF;
  ELSE
    SELECT * INTO v_mc
    FROM public.wallet_currency_balances
    WHERE wallet_id = v_wallet.id
      AND UPPER(currency) = UPPER(v_currency)
    FOR UPDATE;

    IF v_mc IS NULL THEN
      INSERT INTO public.wallet_currency_balances (wallet_id, currency, balance)
      VALUES (v_wallet.id, v_currency, p_amount);
      v_new_balance := p_amount;
    ELSE
      UPDATE public.wallet_currency_balances
      SET balance = COALESCE(balance, 0) + p_amount,
          updated_at = now()
      WHERE id = v_mc.id;
      v_new_balance := COALESCE(v_mc.balance, 0) + p_amount;
    END IF;
  END IF;

  IF p_wallet_transaction_id IS NOT NULL THEN
    UPDATE public.wallet_transactions
    SET status = 'completed',
        amount = p_amount,
        currency = v_currency,
        description = COALESCE(p_description, p_type || ' credit')
    WHERE id = p_wallet_transaction_id;
  ELSE
    INSERT INTO public.wallet_transactions (
      wallet_id,
      user_id,
      type,
      amount,
      currency,
      description,
      reference_id,
      status
    ) VALUES (
      v_wallet.id,
      p_user_id,
      p_type,
      p_amount,
      v_currency,
      COALESCE(p_description, p_type || ' credit'),
      p_reference_id,
      'completed'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'wallet_id', v_wallet.id,
    'currency', v_currency,
    'credited', p_amount,
    'new_balance', v_new_balance
  );
END;
$$;

REVOKE ALL ON FUNCTION public._apply_wallet_credit(uuid, uuid, numeric, text, text, text, text, boolean, uuid) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 3) credit_wallet_safely — service role (webhooks) and admins only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_wallet_safely(
  p_user_id uuid,
  p_amount numeric,
  p_currency text,
  p_type text,
  p_description text DEFAULT NULL,
  p_reference_id text DEFAULT NULL,
  p_update_referral_earnings boolean DEFAULT false,
  p_wallet_transaction_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT id INTO v_wallet_id
  FROM public.wallets
  WHERE user_id = p_user_id;

  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  RETURN public._apply_wallet_credit(
    v_wallet_id,
    p_user_id,
    p_amount,
    p_currency,
    p_type,
    p_description,
    p_reference_id,
    p_update_referral_earnings,
    p_wallet_transaction_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.credit_wallet_safely(uuid, numeric, text, text, text, text, boolean, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_wallet_safely(uuid, numeric, text, text, text, text, boolean, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_wallet_safely(uuid, numeric, text, text, text, text, boolean, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) update_wallet_low_balance_threshold — users may only change alert settings
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_wallet_low_balance_threshold(
  p_user_id uuid,
  p_threshold numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_threshold IS NOT NULL AND p_threshold <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid threshold');
  END IF;

  UPDATE public.wallets
  SET low_balance_threshold = p_threshold,
      updated_at = now()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'threshold', p_threshold);
END;
$$;

REVOKE ALL ON FUNCTION public.update_wallet_low_balance_threshold(uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_wallet_low_balance_threshold(uuid, numeric) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) redeem_voucher_safely — multi-currency credit + auth check
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_voucher_safely(p_voucher_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_voucher RECORD;
  v_wallet_id uuid;
  v_currency text;
  v_credit jsonb;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_voucher
  FROM public.vouchers
  WHERE id = p_voucher_id
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM public.vouchers WHERE id = p_voucher_id) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Voucher is being processed, please try again'
      );
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Voucher not found');
  END IF;

  IF v_voucher.is_redeemed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voucher has already been redeemed');
  END IF;

  IF v_voucher.expires_at IS NOT NULL AND v_voucher.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voucher has expired');
  END IF;

  UPDATE public.vouchers
  SET is_redeemed = true,
      redeemed_at = NOW(),
      redeemed_by = p_user_id
  WHERE id = p_voucher_id
    AND is_redeemed = false;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voucher redemption failed, please try again'
    );
  END IF;

  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = p_user_id;

  IF v_wallet_id IS NULL THEN
    UPDATE public.vouchers
    SET is_redeemed = false, redeemed_at = NULL, redeemed_by = NULL
    WHERE id = p_voucher_id;

    RETURN jsonb_build_object('success', false, 'error', 'User wallet not found');
  END IF;

  v_currency := COALESCE(v_voucher.currency, 'NGN');

  v_credit := public._apply_wallet_credit(
    v_wallet_id,
    p_user_id,
    v_voucher.amount,
    v_currency,
    'voucher',
    'Voucher redeemed: ' || v_voucher.code,
    'VOUCHER-' || p_voucher_id::text,
    false
  );

  IF NOT COALESCE((v_credit->>'success')::boolean, false) THEN
    UPDATE public.vouchers
    SET is_redeemed = false, redeemed_at = NULL, redeemed_by = NULL
    WHERE id = p_voucher_id;

    RETURN v_credit;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'Voucher Redeemed!',
    'You have successfully redeemed voucher ' || v_voucher.code || ' for ' || v_voucher.amount || ' ' || v_currency,
    'voucher'
  );

  RETURN jsonb_build_object(
    'success', true,
    'amount', v_voucher.amount,
    'currency', v_currency,
    'code', v_voucher.code,
    'new_balance', v_credit->'new_balance'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_voucher_safely(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_voucher_safely(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6) Allow refund transaction type
-- ---------------------------------------------------------------------------
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
        'form'::text,
        'refund'::text
      ]
    )
  );

-- ---------------------------------------------------------------------------
-- 7) RLS — prevent client-side balance / transaction manipulation
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can insert their own currency balances" ON public.wallet_currency_balances;
DROP POLICY IF EXISTS "Users can update their own currency balances" ON public.wallet_currency_balances;

DROP POLICY IF EXISTS "Admins can manage all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can manage all wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can manage all currency balances" ON public.wallet_currency_balances;

CREATE POLICY "Admins can manage all wallets"
ON public.wallets
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all wallet transactions"
ON public.wallet_transactions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all currency balances"
ON public.wallet_currency_balances
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
