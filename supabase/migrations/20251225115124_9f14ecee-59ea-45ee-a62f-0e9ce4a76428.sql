-- Create a function to get referral leaderboard data
-- This uses SECURITY DEFINER to bypass RLS and return aggregated public data
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  referral_count bigint,
  total_earnings numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.user_id,
    COALESCE(p.full_name, 'Anonymous') as display_name,
    p.avatar_url,
    COUNT(r.id)::bigint as referral_count,
    COALESCE(w.referral_earnings, 0) as total_earnings
  FROM wallets w
  LEFT JOIN profiles p ON p.id = w.user_id
  LEFT JOIN wallets r ON r.referred_by = w.user_id
  WHERE w.referral_earnings > 0
  GROUP BY w.user_id, w.referral_earnings, p.full_name, p.avatar_url
  ORDER BY w.referral_earnings DESC
  LIMIT limit_count;
END;
$$;