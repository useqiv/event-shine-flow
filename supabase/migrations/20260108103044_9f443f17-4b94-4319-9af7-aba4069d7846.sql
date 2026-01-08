-- Create login attempts table for server-side rate limiting
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_hash TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Create index for fast lookups
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts(email, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts(ip_hash, attempted_at DESC) WHERE ip_hash IS NOT NULL;

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- No direct access - only via edge function with service role
-- Public can insert (for tracking) but not read/update/delete
CREATE POLICY "Allow insert for rate limiting" ON public.login_attempts
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Function to check if login is rate limited
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  p_email TEXT,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_attempts INTEGER := 5;
  v_lockout_minutes INTEGER := 15;
  v_email_attempts INTEGER;
  v_ip_attempts INTEGER;
  v_is_locked BOOLEAN := false;
  v_lockout_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Count failed attempts in the last lockout period for this email
  SELECT COUNT(*) INTO v_email_attempts
  FROM public.login_attempts
  WHERE email = LOWER(p_email)
    AND success = false
    AND attempted_at > NOW() - (v_lockout_minutes || ' minutes')::INTERVAL;
  
  -- Check IP-based attempts if provided
  IF p_ip_hash IS NOT NULL THEN
    SELECT COUNT(*) INTO v_ip_attempts
    FROM public.login_attempts
    WHERE ip_hash = p_ip_hash
      AND success = false
      AND attempted_at > NOW() - (v_lockout_minutes || ' minutes')::INTERVAL;
  ELSE
    v_ip_attempts := 0;
  END IF;
  
  -- Check if locked
  IF v_email_attempts >= v_max_attempts OR v_ip_attempts >= v_max_attempts THEN
    v_is_locked := true;
    
    -- Get lockout end time
    SELECT attempted_at + (v_lockout_minutes || ' minutes')::INTERVAL INTO v_lockout_until
    FROM public.login_attempts
    WHERE (email = LOWER(p_email) OR ip_hash = p_ip_hash)
      AND success = false
    ORDER BY attempted_at DESC
    LIMIT 1;
  END IF;
  
  RETURN jsonb_build_object(
    'is_locked', v_is_locked,
    'attempts', GREATEST(v_email_attempts, v_ip_attempts),
    'max_attempts', v_max_attempts,
    'remaining_attempts', GREATEST(0, v_max_attempts - GREATEST(v_email_attempts, v_ip_attempts)),
    'lockout_until', v_lockout_until
  );
END;
$$;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, ip_hash, success)
  VALUES (LOWER(p_email), p_ip_hash, p_success);
  
  -- Clean up old attempts (older than 24 hours)
  DELETE FROM public.login_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Function to clear attempts on successful login
CREATE OR REPLACE FUNCTION public.clear_login_attempts(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts
  WHERE email = LOWER(p_email);
END;
$$;