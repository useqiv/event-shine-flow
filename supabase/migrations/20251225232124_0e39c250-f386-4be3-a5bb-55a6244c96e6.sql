-- Fix double vote counting: votes has two AFTER INSERT triggers both calling update_vote_count()
-- Keep a single trigger and drop the duplicate.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_vote_insert'
      AND tgrelid = 'public.votes'::regclass
      AND NOT tgisinternal
  ) THEN
    EXECUTE 'DROP TRIGGER on_vote_insert ON public.votes';
  END IF;
END $$;

-- Ensure the remaining trigger exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_vote_created'
      AND tgrelid = 'public.votes'::regclass
      AND NOT tgisinternal
  ) THEN
    EXECUTE 'CREATE TRIGGER on_vote_created AFTER INSERT ON public.votes FOR EACH ROW EXECUTE FUNCTION public.update_vote_count()';
  END IF;
END $$;