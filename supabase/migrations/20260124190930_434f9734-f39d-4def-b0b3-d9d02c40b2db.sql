-- Fix the encryption function with proper schema prefix for pgcrypto functions
CREATE OR REPLACE FUNCTION public.encrypt_banking_data(plain_text text)
RETURNS bytea
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  SELECT CASE 
    WHEN plain_text IS NULL OR plain_text = '' THEN NULL
    ELSE pgp_sym_encrypt(
      plain_text,
      'supabase_banking_encryption_key_v1'
    )
  END;
$$;

-- Fix the decryption function
CREATE OR REPLACE FUNCTION public.decrypt_banking_data(encrypted_data bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(
    encrypted_data,
    'supabase_banking_encryption_key_v1'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;