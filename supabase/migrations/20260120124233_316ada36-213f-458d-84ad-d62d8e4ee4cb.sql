-- Make votes.user_id nullable to support guest purchases
ALTER TABLE public.votes ALTER COLUMN user_id DROP NOT NULL;

-- Add guest_email and guest_name columns for guest vote purchases
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Make donations.donor_id nullable to support guest donations
ALTER TABLE public.donations ALTER COLUMN donor_id DROP NOT NULL;

-- Add guest columns for guest donations
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS guest_name TEXT;