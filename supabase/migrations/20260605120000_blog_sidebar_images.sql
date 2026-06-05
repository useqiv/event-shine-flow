-- Sidebar images for blog post detail page (right column)
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS sidebar_images JSONB NOT NULL DEFAULT '[]'::jsonb;
