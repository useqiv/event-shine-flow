CREATE TABLE IF NOT EXISTS public.contest_vote_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  vote_quantity integer NOT NULL CHECK (vote_quantity > 0),
  price numeric(12,2) NOT NULL CHECK (price > 0),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contest_vote_options_contest_id
  ON public.contest_vote_options(contest_id);

CREATE INDEX IF NOT EXISTS idx_contest_vote_options_sort_order
  ON public.contest_vote_options(contest_id, sort_order);

ALTER TABLE public.contest_vote_options ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contest_vote_options'
      AND policyname = 'Public can view active contest vote options'
  ) THEN
    CREATE POLICY "Public can view active contest vote options"
      ON public.contest_vote_options
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contest_vote_options'
      AND policyname = 'Organizations can manage own contest vote options'
  ) THEN
    CREATE POLICY "Organizations can manage own contest vote options"
      ON public.contest_vote_options
      FOR ALL
      USING (
        EXISTS (
          SELECT 1
          FROM public.contests c
          WHERE c.id = contest_vote_options.contest_id
            AND c.organization_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.contests c
          WHERE c.id = contest_vote_options.contest_id
            AND c.organization_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_contest_vote_options_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contest_vote_options_updated_at ON public.contest_vote_options;
CREATE TRIGGER trg_contest_vote_options_updated_at
  BEFORE UPDATE ON public.contest_vote_options
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contest_vote_options_updated_at();
