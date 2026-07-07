-- Expose full decrypted banking details to admins via safe views.
-- Organization owners still see masked values; only admins get decrypted data.

CREATE OR REPLACE VIEW public.organization_settings_safe WITH (security_invoker = true) AS
SELECT
  id,
  organization_id,
  company_name,
  company_email,
  company_phone,
  company_address,
  default_currency,
  preferred_payout_method,
  created_at,
  updated_at,
  CASE
    WHEN has_role(auth.uid(), 'admin'::app_role)
      OR organization_id = auth.uid()
    THEN bank_name
    ELSE NULL
  END AS bank_name,
  CASE
    WHEN has_role(auth.uid(), 'admin'::app_role)
    THEN COALESCE(public.decrypt_banking_data(account_number_encrypted), account_number)
    WHEN organization_id = auth.uid()
    THEN account_number
    ELSE NULL
  END AS account_number,
  CASE
    WHEN has_role(auth.uid(), 'admin'::app_role)
      OR organization_id = auth.uid()
    THEN account_name
    ELSE NULL
  END AS account_name,
  CASE
    WHEN has_role(auth.uid(), 'admin'::app_role)
    THEN COALESCE(public.decrypt_banking_data(usdt_address_encrypted), usdt_address)
    WHEN organization_id = auth.uid()
    THEN usdt_address
    ELSE NULL
  END AS usdt_address
FROM public.organization_settings;

CREATE OR REPLACE VIEW public.payouts_safe WITH (security_invoker = true) AS
SELECT
  id,
  organization_id,
  amount,
  currency,
  status,
  payment_method,
  reference_id,
  created_at,
  updated_at,
  processed_at,
  CASE
    WHEN has_role(auth.uid(), 'admin'::app_role)
      OR organization_id = auth.uid()
    THEN bank_name
    ELSE '***HIDDEN***'
  END AS bank_name,
  CASE
    WHEN has_role(auth.uid(), 'admin'::app_role)
    THEN COALESCE(public.decrypt_banking_data(account_number_encrypted), account_number)
    WHEN organization_id = auth.uid()
    THEN account_number
    ELSE '***HIDDEN***'
  END AS account_number,
  CASE
    WHEN has_role(auth.uid(), 'admin'::app_role)
      OR organization_id = auth.uid()
    THEN account_name
    ELSE '***HIDDEN***'
  END AS account_name,
  CASE
    WHEN has_role(auth.uid(), 'admin'::app_role)
    THEN COALESCE(public.decrypt_banking_data(usdt_address_encrypted), usdt_address)
    WHEN organization_id = auth.uid()
    THEN usdt_address
    ELSE '***HIDDEN***'
  END AS usdt_address
FROM public.payouts;
