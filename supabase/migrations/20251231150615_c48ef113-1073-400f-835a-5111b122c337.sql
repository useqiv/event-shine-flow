-- Add 'influencer' to the app_role enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'influencer' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'influencer';
  END IF;
END$$;

-- Create influencer_profiles table to store additional influencer info
CREATE TABLE IF NOT EXISTS public.influencer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  payment_method TEXT DEFAULT 'bank_transfer',
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  usdt_address TEXT,
  total_earnings NUMERIC(12,2) DEFAULT 0,
  pending_earnings NUMERIC(12,2) DEFAULT 0,
  paid_earnings NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on influencer_profiles
ALTER TABLE public.influencer_profiles ENABLE ROW LEVEL SECURITY;

-- Influencers can view and update their own profile
CREATE POLICY "Influencers can view own profile" ON public.influencer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Influencers can update own profile" ON public.influencer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Influencers can insert own profile" ON public.influencer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all influencer profiles
CREATE POLICY "Admins can view all influencer profiles" ON public.influencer_profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Add influencer_user_id to influencer_links to associate links with influencer accounts
ALTER TABLE public.influencer_links ADD COLUMN IF NOT EXISTS influencer_user_id UUID REFERENCES auth.users(id);

-- Influencers can view their own links
CREATE POLICY "Influencers can view own links" ON public.influencer_links
  FOR SELECT USING (influencer_user_id = auth.uid());

-- Create influencer payout requests table
CREATE TABLE IF NOT EXISTS public.influencer_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  payment_method TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  usdt_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on influencer_payouts
ALTER TABLE public.influencer_payouts ENABLE ROW LEVEL SECURITY;

-- Influencers can view their own payouts
CREATE POLICY "Influencers can view own payouts" ON public.influencer_payouts
  FOR SELECT USING (influencer_user_id = auth.uid());

-- Influencers can create payout requests
CREATE POLICY "Influencers can request payouts" ON public.influencer_payouts
  FOR INSERT WITH CHECK (influencer_user_id = auth.uid());

-- Admins and organizations can view and manage payouts
CREATE POLICY "Admins can manage payouts" ON public.influencer_payouts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Update timestamp trigger for influencer_profiles
CREATE TRIGGER update_influencer_profiles_updated_at
  BEFORE UPDATE ON public.influencer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamp trigger for influencer_payouts
CREATE TRIGGER update_influencer_payouts_updated_at
  BEFORE UPDATE ON public.influencer_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_influencer_links_user ON public.influencer_links(influencer_user_id);
CREATE INDEX IF NOT EXISTS idx_influencer_payouts_user ON public.influencer_payouts(influencer_user_id);