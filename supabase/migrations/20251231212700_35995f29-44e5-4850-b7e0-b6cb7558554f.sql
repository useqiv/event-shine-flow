-- Add influencer_email column to influencer_links for email verification
ALTER TABLE public.influencer_links 
ADD COLUMN influencer_email TEXT;

-- Add index for faster lookup when claiming codes
CREATE INDEX idx_influencer_links_email ON public.influencer_links(influencer_email);

-- Add comment for documentation
COMMENT ON COLUMN public.influencer_links.influencer_email IS 'Email address of the intended influencer. Only users with this email can claim the code.';