-- First drop the dependent view with CASCADE
DROP VIEW IF EXISTS public.payouts_admin CASCADE;

-- Now drop and recreate the encrypted columns with correct names
ALTER TABLE public.payouts DROP COLUMN IF EXISTS bank_account_encrypted;
ALTER TABLE public.payouts DROP COLUMN IF EXISTS crypto_address_encrypted;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS account_number_encrypted bytea;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS usdt_address_encrypted bytea;

-- Update the payout trigger to use correct column names
CREATE OR REPLACE FUNCTION public.encrypt_payout_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Encrypt account_number if provided and not already masked
  IF NEW.account_number IS NOT NULL AND NEW.account_number != '' AND NEW.account_number NOT LIKE '****%' THEN
    NEW.account_number_encrypted := public.encrypt_banking_data(NEW.account_number);
    NEW.account_number := '****' || RIGHT(NEW.account_number, 4);
  END IF;
  
  -- Encrypt usdt_address if provided and not already masked
  IF NEW.usdt_address IS NOT NULL AND NEW.usdt_address != '' AND NEW.usdt_address NOT LIKE '****%' THEN
    NEW.usdt_address_encrypted := public.encrypt_banking_data(NEW.usdt_address);
    NEW.usdt_address := '****' || RIGHT(NEW.usdt_address, 6);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate admin view with correct column names
CREATE VIEW public.payouts_admin AS
SELECT 
  p.*,
  public.decrypt_banking_data(p.account_number_encrypted) as account_number_decrypted,
  public.decrypt_banking_data(p.usdt_address_encrypted) as usdt_address_decrypted
FROM public.payouts p;

-- Revoke access from public roles
REVOKE ALL ON public.payouts_admin FROM anon, authenticated;

-- Now run the migration for existing data
CREATE OR REPLACE FUNCTION public.migrate_existing_banking_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_account_count INTEGER := 0;
  v_org_usdt_count INTEGER := 0;
  v_payout_account_count INTEGER := 0;
  v_payout_usdt_count INTEGER := 0;
  v_row RECORD;
BEGIN
  -- Migrate organization_settings account_number
  FOR v_row IN 
    SELECT id, account_number 
    FROM public.organization_settings 
    WHERE account_number IS NOT NULL 
      AND account_number != ''
      AND account_number NOT LIKE '****%'
  LOOP
    UPDATE public.organization_settings
    SET 
      account_number_encrypted = public.encrypt_banking_data(v_row.account_number),
      account_number = '****' || RIGHT(v_row.account_number, 4)
    WHERE id = v_row.id;
    v_org_account_count := v_org_account_count + 1;
  END LOOP;
  
  -- Migrate organization_settings usdt_address
  FOR v_row IN 
    SELECT id, usdt_address 
    FROM public.organization_settings 
    WHERE usdt_address IS NOT NULL 
      AND usdt_address != ''
      AND usdt_address NOT LIKE '****%'
  LOOP
    UPDATE public.organization_settings
    SET 
      usdt_address_encrypted = public.encrypt_banking_data(v_row.usdt_address),
      usdt_address = '****' || RIGHT(v_row.usdt_address, 6)
    WHERE id = v_row.id;
    v_org_usdt_count := v_org_usdt_count + 1;
  END LOOP;
  
  -- Migrate payouts account_number
  FOR v_row IN 
    SELECT id, account_number 
    FROM public.payouts 
    WHERE account_number IS NOT NULL 
      AND account_number != ''
      AND account_number NOT LIKE '****%'
  LOOP
    UPDATE public.payouts
    SET 
      account_number_encrypted = public.encrypt_banking_data(v_row.account_number),
      account_number = '****' || RIGHT(v_row.account_number, 4)
    WHERE id = v_row.id;
    v_payout_account_count := v_payout_account_count + 1;
  END LOOP;
  
  -- Migrate payouts usdt_address
  FOR v_row IN 
    SELECT id, usdt_address 
    FROM public.payouts 
    WHERE usdt_address IS NOT NULL 
      AND usdt_address != ''
      AND usdt_address NOT LIKE '****%'
  LOOP
    UPDATE public.payouts
    SET 
      usdt_address_encrypted = public.encrypt_banking_data(v_row.usdt_address),
      usdt_address = '****' || RIGHT(v_row.usdt_address, 6)
    WHERE id = v_row.id;
    v_payout_usdt_count := v_payout_usdt_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'org_accounts_migrated', v_org_account_count,
    'org_usdt_migrated', v_org_usdt_count,
    'payout_accounts_migrated', v_payout_account_count,
    'payout_usdt_migrated', v_payout_usdt_count
  );
END;
$$;

-- Run the migration
SELECT public.migrate_existing_banking_data();

-- Clean up
DROP FUNCTION IF EXISTS public.migrate_existing_banking_data();