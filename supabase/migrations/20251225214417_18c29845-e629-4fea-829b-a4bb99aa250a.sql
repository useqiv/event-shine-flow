-- Create trigger for automatic vote count updates
-- The function update_vote_count() already exists, we just need to create the trigger

CREATE TRIGGER on_vote_insert
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vote_count();