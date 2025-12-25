-- Add display_order column to contestants table for manual ordering
ALTER TABLE public.contestants 
ADD COLUMN display_order integer DEFAULT 0;

-- Create index for better ordering performance
CREATE INDEX idx_contestants_display_order ON public.contestants(contest_id, display_order);

-- Initialize display_order based on current creation order
UPDATE public.contestants 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY contest_id ORDER BY created_at) as row_num
  FROM public.contestants
) AS subquery
WHERE public.contestants.id = subquery.id;