-- Create contest_categories table for optional category support
CREATE TABLE public.contest_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category_id to contestants (nullable - categories are optional)
ALTER TABLE public.contestants 
ADD COLUMN category_id UUID REFERENCES public.contest_categories(id) ON DELETE SET NULL;

-- Enable RLS on contest_categories
ALTER TABLE public.contest_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for contest_categories
CREATE POLICY "Anyone can view contest categories"
ON public.contest_categories
FOR SELECT
USING (true);

CREATE POLICY "Organizations can manage categories for their contests"
ON public.contest_categories
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.contests
  WHERE contests.id = contest_categories.contest_id
  AND contests.organization_id = auth.uid()
));

CREATE POLICY "Admins can manage all categories"
ON public.contest_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for faster lookups
CREATE INDEX idx_contest_categories_contest_id ON public.contest_categories(contest_id);
CREATE INDEX idx_contestants_category_id ON public.contestants(category_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_contest_categories_updated_at
BEFORE UPDATE ON public.contest_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();