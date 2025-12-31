UPDATE influencer_links 
SET 
  total_clicks = total_clicks + 1,
  total_conversions = total_conversions + 1,
  total_revenue = total_revenue + 10.00,
  total_commission = total_commission + 500
WHERE code = 'MICH2025';