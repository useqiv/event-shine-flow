-- Per-contest setting: show numeric vote counts or relative progress bars on public pages
ALTER TABLE public.contests
ADD COLUMN IF NOT EXISTS vote_display_mode text NOT NULL DEFAULT 'count';

ALTER TABLE public.contests
DROP CONSTRAINT IF EXISTS contests_vote_display_mode_check;

ALTER TABLE public.contests
ADD CONSTRAINT contests_vote_display_mode_check
CHECK (vote_display_mode IN ('count', 'progress_bar'));

COMMENT ON COLUMN public.contests.vote_display_mode IS
  'Public voter UI: count = show vote totals; progress_bar = show relative progress bars without numeric totals';
