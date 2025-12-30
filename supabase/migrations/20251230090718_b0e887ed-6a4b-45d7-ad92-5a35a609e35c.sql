-- Create nominations table (the main nomination campaign)
CREATE TABLE public.nominations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nomination categories table
CREATE TABLE public.nomination_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nomination_id UUID NOT NULL REFERENCES public.nominations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nomination submissions table (public submissions)
CREATE TABLE public.nomination_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.nomination_categories(id) ON DELETE CASCADE,
  nominee_name TEXT NOT NULL,
  submitter_email TEXT,
  submitter_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nomination_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nomination_submissions ENABLE ROW LEVEL SECURITY;

-- Nominations policies
CREATE POLICY "Organizations can manage their own nominations" 
ON public.nominations FOR ALL 
USING (auth.uid() = organization_id);

CREATE POLICY "Anyone can view active nominations" 
ON public.nominations FOR SELECT 
USING (is_active = true AND start_date <= now() AND end_date >= now());

CREATE POLICY "Admins can manage all nominations" 
ON public.nominations FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Categories policies
CREATE POLICY "Organizations can manage categories for their nominations" 
ON public.nomination_categories FOR ALL 
USING (EXISTS (
  SELECT 1 FROM nominations 
  WHERE nominations.id = nomination_categories.nomination_id 
  AND nominations.organization_id = auth.uid()
));

CREATE POLICY "Anyone can view categories of active nominations" 
ON public.nomination_categories FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM nominations 
  WHERE nominations.id = nomination_categories.nomination_id 
  AND nominations.is_active = true
));

CREATE POLICY "Admins can manage all categories" 
ON public.nomination_categories FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Submissions policies (public insert)
CREATE POLICY "Anyone can submit nominations" 
ON public.nomination_submissions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Organizations can view submissions for their nominations" 
ON public.nomination_submissions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM nomination_categories nc
  JOIN nominations n ON n.id = nc.nomination_id
  WHERE nc.id = nomination_submissions.category_id 
  AND n.organization_id = auth.uid()
));

CREATE POLICY "Admins can manage all submissions" 
ON public.nomination_submissions FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_nominations_updated_at
BEFORE UPDATE ON public.nominations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nomination_categories_updated_at
BEFORE UPDATE ON public.nomination_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();