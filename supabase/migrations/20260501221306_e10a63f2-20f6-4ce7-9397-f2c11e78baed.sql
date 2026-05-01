
CREATE OR REPLACE FUNCTION public.debit_wallet_safely(
  p_user_id uuid,
  p_amount numeric,
  p_currency text,
  p_type text,
  p_description text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet RECORD;
  v_currency text := COALESCE(NULLIF(p_currency, ''), 'NGN');
  v_balance numeric := 0;
  v_use_multi boolean := false;
  v_mc RECORD;
BEGIN
  -- Caller must be the wallet owner
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  IF p_type NOT IN ('vote', 'ticket', 'donation', 'withdrawal') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid transaction type');
  END IF;

  -- Lock wallet row
  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Decide which balance bucket to debit
  IF UPPER(v_currency) = UPPER(COALESCE(v_wallet.balance_currency, 'NGN')) THEN
    v_balance := COALESCE(v_wallet.balance, 0);
    v_use_multi := false;
  ELSE
    SELECT * INTO v_mc
    FROM public.wallet_currency_balances
    WHERE wallet_id = v_wallet.id
      AND UPPER(currency) = UPPER(v_currency)
    FOR UPDATE;

    IF v_mc IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient ' || v_currency || ' balance');
    END IF;

    v_balance := COALESCE(v_mc.balance, 0);
    v_use_multi := true;
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient wallet balance',
      'available', v_balance,
      'required', p_amount,
      'currency', v_currency
    );
  END IF;

  -- Debit
  IF v_use_multi THEN
    UPDATE public.wallet_currency_balances
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE id = v_mc.id;
  ELSE
    UPDATE public.wallets
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE id = v_wallet.id;
  END IF;

  -- Record the transaction
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, currency, description, reference_id, status
  ) VALUES (
    v_wallet.id,
    p_user_id,
    p_type,
    -p_amount,
    v_currency,
    COALESCE(p_description, p_type || ' payment from wallet'),
    p_reference_id,
    'completed'
  );

  RETURN jsonb_build_object(
    'success', true,
    'wallet_id', v_wallet.id,
    'currency', v_currency,
    'debited', p_amount,
    'remaining', v_balance - p_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.debit_wallet_safely(uuid, numeric, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debit_wallet_safely(uuid, numeric, text, text, text, uuid) TO authenticated;
