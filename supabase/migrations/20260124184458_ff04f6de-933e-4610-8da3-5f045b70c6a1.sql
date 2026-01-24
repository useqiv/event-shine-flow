-- Enable pgsodium extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create encryption key for banking details
SELECT pgsodium.create_key(
  name := 'banking_encryption_key',
  key_type := 'aead-det'
);

-- Add encrypted columns to organization_settings
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS account_number_encrypted bytea,
ADD COLUMN IF NOT EXISTS usdt_address_encrypted bytea;

-- Add encrypted columns to payouts
ALTER TABLE public.payouts
ADD COLUMN IF NOT EXISTS bank_account_encrypted bytea,
ADD COLUMN IF NOT EXISTS crypto_address_encrypted bytea;

-- Create function to encrypt banking data
CREATE OR REPLACE FUNCTION public.encrypt_banking_data(plain_text text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pgsodium'
AS $$
DECLARE
  key_id uuid;
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;
  
  SELECT id INTO key_id FROM pgsodium.valid_key WHERE name = 'banking_encryption_key' LIMIT 1;
  
  IF key_id IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found';
  END IF;
  
  RETURN pgsodium.crypto_aead_det_encrypt(
    plain_text::bytea,
    ''::bytea,
    key_id
  );
END;
$$;

-- Create function to decrypt banking data
CREATE OR REPLACE FUNCTION public.decrypt_banking_data(encrypted_data bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pgsodium'
AS $$
DECLARE
  key_id uuid;
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT id INTO key_id FROM pgsodium.valid_key WHERE name = 'banking_encryption_key' LIMIT 1;
  
  IF key_id IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found';
  END IF;
  
  RETURN convert_from(
    pgsodium.crypto_aead_det_decrypt(
      encrypted_data,
      ''::bytea,
      key_id
    ),
    'utf8'
  );
END;
$$;

-- Create trigger to auto-encrypt organization_settings on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_org_settings_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Encrypt account_number if provided and changed
  IF NEW.account_number IS NOT NULL AND NEW.account_number != '' THEN
    IF OLD IS NULL OR NEW.account_number != OLD.account_number THEN
      NEW.account_number_encrypted := public.encrypt_banking_data(NEW.account_number);
      -- Mask the plain text column (keep last 4 chars)
      NEW.account_number := '****' || RIGHT(NEW.account_number, 4);
    END IF;
  END IF;
  
  -- Encrypt usdt_address if provided and changed
  IF NEW.usdt_address IS NOT NULL AND NEW.usdt_address != '' THEN
    IF OLD IS NULL OR NEW.usdt_address != OLD.usdt_address THEN
      NEW.usdt_address_encrypted := public.encrypt_banking_data(NEW.usdt_address);
      -- Mask the plain text column (keep last 6 chars for wallet addresses)
      NEW.usdt_address := '****' || RIGHT(NEW.usdt_address, 6);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_org_settings_before_upsert
BEFORE INSERT OR UPDATE ON public.organization_settings
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_org_settings_trigger();

-- Create trigger to auto-encrypt payouts on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_payout_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Encrypt bank_account if provided
  IF NEW.bank_account IS NOT NULL AND NEW.bank_account != '' THEN
    IF OLD IS NULL OR NEW.bank_account IS DISTINCT FROM OLD.bank_account THEN
      NEW.bank_account_encrypted := public.encrypt_banking_data(NEW.bank_account);
      NEW.bank_account := '****' || RIGHT(NEW.bank_account, 4);
    END IF;
  END IF;
  
  -- Encrypt crypto_address if provided
  IF NEW.crypto_address IS NOT NULL AND NEW.crypto_address != '' THEN
    IF OLD IS NULL OR NEW.crypto_address IS DISTINCT FROM OLD.crypto_address THEN
      NEW.crypto_address_encrypted := public.encrypt_banking_data(NEW.crypto_address);
      NEW.crypto_address := '****' || RIGHT(NEW.crypto_address, 6);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_payout_before_upsert
BEFORE INSERT OR UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_payout_trigger();

-- Create secure view for admins to see decrypted banking details
CREATE OR REPLACE VIEW public.organization_settings_admin AS
SELECT 
  os.*,
  public.decrypt_banking_data(os.account_number_encrypted) as account_number_decrypted,
  public.decrypt_banking_data(os.usdt_address_encrypted) as usdt_address_decrypted
FROM public.organization_settings os;

-- Grant access only to service role (for admin edge functions)
REVOKE ALL ON public.organization_settings_admin FROM anon, authenticated;

-- Create secure view for payout processing
CREATE OR REPLACE VIEW public.payouts_admin AS
SELECT 
  p.*,
  public.decrypt_banking_data(p.bank_account_encrypted) as bank_account_decrypted,
  public.decrypt_banking_data(p.crypto_address_encrypted) as crypto_address_decrypted
FROM public.payouts p;

REVOKE ALL ON public.payouts_admin FROM anon, authenticated;

-- =====================================================
-- ATOMIC VOUCHER REDEMPTION WITH SKIP LOCKED
-- =====================================================

-- Drop existing function and recreate with SKIP LOCKED
DROP FUNCTION IF EXISTS public.redeem_voucher_safely(uuid, uuid);

CREATE OR REPLACE FUNCTION public.redeem_voucher_safely(p_voucher_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_voucher RECORD;
  v_wallet_id uuid;
BEGIN
  -- Try to lock the voucher row, skip if already locked by another transaction
  SELECT * INTO v_voucher 
  FROM public.vouchers 
  WHERE id = p_voucher_id 
  FOR UPDATE SKIP LOCKED;
  
  -- If no row returned, either doesn't exist or is locked
  IF NOT FOUND THEN
    -- Check if voucher exists but is locked
    IF EXISTS (SELECT 1 FROM public.vouchers WHERE id = p_voucher_id) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Voucher is being processed, please try again'
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Voucher not found'
      );
    END IF;
  END IF;
  
  -- Check if already redeemed
  IF v_voucher.is_redeemed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voucher has already been redeemed'
    );
  END IF;
  
  -- Check expiration
  IF v_voucher.expires_at IS NOT NULL AND v_voucher.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voucher has expired'
    );
  END IF;
  
  -- Mark voucher as redeemed atomically
  UPDATE public.vouchers 
  SET 
    is_redeemed = true, 
    redeemed_at = NOW(),
    redeemed_by = p_user_id
  WHERE id = p_voucher_id
    AND is_redeemed = false; -- Double-check condition
  
  -- If no rows affected, race condition occurred
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voucher redemption failed, please try again'
    );
  END IF;
  
  -- Get user's wallet
  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    -- Rollback the voucher redemption
    UPDATE public.vouchers 
    SET is_redeemed = false, redeemed_at = NULL, redeemed_by = NULL
    WHERE id = p_voucher_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User wallet not found'
    );
  END IF;
  
  -- Credit the wallet
  UPDATE public.wallets
  SET balance = balance + v_voucher.amount
  WHERE id = v_wallet_id;
  
  -- Create transaction record
  INSERT INTO public.wallet_transactions (
    wallet_id,
    type,
    amount,
    currency,
    status,
    reference,
    description
  ) VALUES (
    v_wallet_id,
    'voucher',
    v_voucher.amount,
    COALESCE(v_voucher.currency, 'NGN'),
    'completed',
    'VOUCHER-' || p_voucher_id::text,
    'Voucher redeemed: ' || v_voucher.code
  );
  
  -- Create notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'Voucher Redeemed!',
    'You have successfully redeemed voucher ' || v_voucher.code || ' for ' || v_voucher.amount,
    'voucher'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'amount', v_voucher.amount,
    'currency', COALESCE(v_voucher.currency, 'NGN'),
    'code', v_voucher.code
  );
END;
$$;