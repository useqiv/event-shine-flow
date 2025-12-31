-- Create a trigger to automatically increment total_clicks when a new click is recorded
CREATE OR REPLACE FUNCTION public.update_influencer_link_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.influencer_links
  SET total_clicks = total_clicks + 1
  WHERE id = NEW.link_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on influencer_clicks table
DROP TRIGGER IF EXISTS trigger_update_influencer_clicks ON public.influencer_clicks;
CREATE TRIGGER trigger_update_influencer_clicks
AFTER INSERT ON public.influencer_clicks
FOR EACH ROW
EXECUTE FUNCTION public.update_influencer_link_clicks();