-- Fix existing influencer links to have correct total_clicks based on actual click data
UPDATE public.influencer_links 
SET total_clicks = (
  SELECT COUNT(*) 
  FROM public.influencer_clicks 
  WHERE influencer_clicks.link_id = influencer_links.id
);