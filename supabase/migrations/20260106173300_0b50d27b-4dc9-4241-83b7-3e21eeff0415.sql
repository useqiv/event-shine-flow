-- Add discount fields to influencer_links table
ALTER TABLE public.influencer_links 
ADD COLUMN discount_type VARCHAR(20) DEFAULT NULL,
ADD COLUMN discount_value NUMERIC DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.influencer_links.discount_type IS 'Type of discount: percentage or fixed';
COMMENT ON COLUMN public.influencer_links.discount_value IS 'Discount value (percentage or fixed amount in currency)';