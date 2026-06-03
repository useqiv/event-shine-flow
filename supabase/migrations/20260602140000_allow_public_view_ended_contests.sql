-- Ended contests are auto-deactivated (is_active = false) but should remain publicly viewable
DROP POLICY IF EXISTS "Anyone can view active contests" ON public.contests;

CREATE POLICY "Anyone can view active contests" ON public.contests
  FOR SELECT USING (
    is_active = true
    OR end_date < now()
  );

COMMENT ON POLICY "Anyone can view active contests" ON public.contests IS
  'Public can view active contests and ended contests (even after auto-deactivation).';
