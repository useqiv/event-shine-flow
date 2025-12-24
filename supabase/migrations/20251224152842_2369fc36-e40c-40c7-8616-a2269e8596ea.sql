-- Add account_type_selected column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type_selected boolean NOT NULL DEFAULT false;