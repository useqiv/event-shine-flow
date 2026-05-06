ALTER TABLE public.contests
ADD COLUMN IF NOT EXISTS vote_amount integer NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'contests_vote_amount_positive_check'
  ) THEN
    ALTER TABLE public.contests
    ADD CONSTRAINT contests_vote_amount_positive_check CHECK (vote_amount > 0);
  END IF;
END $$;
