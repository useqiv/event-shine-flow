-- Create table for organization social media accounts
CREATE TABLE public.organization_social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, platform)
);

-- Enable RLS
ALTER TABLE public.organization_social_accounts ENABLE ROW LEVEL SECURITY;

-- Organizations can manage their own social accounts
CREATE POLICY "Organizations can manage their own social accounts"
ON public.organization_social_accounts
FOR ALL
USING (auth.uid() = organization_id);

-- Admins can view all social accounts
CREATE POLICY "Admins can view all social accounts"
ON public.organization_social_accounts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_organization_social_accounts_updated_at
BEFORE UPDATE ON public.organization_social_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();