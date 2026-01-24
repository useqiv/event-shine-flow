-- Drop dependent views first
DROP VIEW IF EXISTS public.organization_settings_admin CASCADE;
DROP VIEW IF EXISTS public.payouts_admin CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS public.encrypt_banking_data(text) CASCADE;
DROP FUNCTION IF EXISTS public.decrypt_banking_data(bytea) CASCADE;
DROP FUNCTION IF EXISTS public.get_encryption_key() CASCADE;

-- Use pgcrypto for encryption (already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption function using pgcrypto
CREATE OR REPLACE FUNCTION public.encrypt_banking_data(plain_text text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use PGP symmetric encryption with a derived key
  RETURN pgp_sym_encrypt(
    plain_text,
    encode(digest('supabase_banking_key_v1_' || current_database(), 'sha256'), 'hex')
  );
END;
$$;

-- Create decryption function
CREATE OR REPLACE FUNCTION public.decrypt_banking_data(encrypted_data bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(
    encrypted_data,
    encode(digest('supabase_banking_key_v1_' || current_database(), 'sha256'), 'hex')
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Update the org settings trigger
DROP TRIGGER IF EXISTS encrypt_org_settings_before_upsert ON public.organization_settings;

CREATE OR REPLACE FUNCTION public.encrypt_org_settings_trigger()
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

CREATE TRIGGER encrypt_org_settings_before_upsert
BEFORE INSERT OR UPDATE ON public.organization_settings
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_org_settings_trigger();

-- Update the payout trigger
DROP TRIGGER IF EXISTS encrypt_payout_before_upsert ON public.payouts;

CREATE OR REPLACE FUNCTION public.encrypt_payout_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Encrypt bank_account if provided and not already masked
  IF NEW.bank_account IS NOT NULL AND NEW.bank_account != '' AND NEW.bank_account NOT LIKE '****%' THEN
    NEW.bank_account_encrypted := public.encrypt_banking_data(NEW.bank_account);
    NEW.bank_account := '****' || RIGHT(NEW.bank_account, 4);
  END IF;
  
  -- Encrypt crypto_address if provided and not already masked
  IF NEW.crypto_address IS NOT NULL AND NEW.crypto_address != '' AND NEW.crypto_address NOT LIKE '****%' THEN
    NEW.crypto_address_encrypted := public.encrypt_banking_data(NEW.crypto_address);
    NEW.crypto_address := '****' || RIGHT(NEW.crypto_address, 6);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_payout_before_upsert
BEFORE INSERT OR UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_payout_trigger();

-- Create admin views with decryption
CREATE VIEW public.organization_settings_admin AS
SELECT 
  os.*,
  public.decrypt_banking_data(os.account_number_encrypted) as account_number_decrypted,
  public.decrypt_banking_data(os.usdt_address_encrypted) as usdt_address_decrypted
FROM public.organization_settings os;

CREATE VIEW public.payouts_admin AS
SELECT 
  p.*,
  public.decrypt_banking_data(p.bank_account_encrypted) as bank_account_decrypted,
  public.decrypt_banking_data(p.crypto_address_encrypted) as crypto_address_decrypted
FROM public.payouts p;

-- Revoke access from public roles (only service_role can access)
REVOKE ALL ON public.organization_settings_admin FROM anon, authenticated;
REVOKE ALL ON public.payouts_admin FROM anon, authenticated;