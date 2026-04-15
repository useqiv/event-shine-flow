
-- Table to store temporary admin verification PINs
CREATE TABLE public.admin_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_verification_codes ENABLE ROW LEVEL SECURITY;

-- Only authenticated admins can read their own codes (for verification)
CREATE POLICY "Admins can read own verification codes"
ON public.admin_verification_codes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

-- Clean up expired codes automatically
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_codes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_verification_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_admin_codes_trigger
AFTER INSERT ON public.admin_verification_codes
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_admin_codes();

-- Index for fast lookups
CREATE INDEX idx_admin_verification_user_code ON public.admin_verification_codes (user_id, code, expires_at);
