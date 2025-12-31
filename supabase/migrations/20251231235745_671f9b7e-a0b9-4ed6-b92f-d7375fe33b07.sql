-- Add is_live_voting column to contests table
ALTER TABLE public.contests 
ADD COLUMN is_live_voting boolean NOT NULL DEFAULT false;