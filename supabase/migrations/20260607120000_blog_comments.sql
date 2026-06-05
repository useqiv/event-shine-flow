-- Public comments on published blog posts (no auth required)
CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255),
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT blog_comments_content_length CHECK (char_length(trim(content)) >= 2),
  CONSTRAINT blog_comments_author_name_length CHECK (char_length(trim(author_name)) >= 2)
);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_blog_comments_post_id ON public.blog_comments(post_id);
CREATE INDEX idx_blog_comments_created_at ON public.blog_comments(created_at DESC);

-- Anyone can read approved comments on published posts
CREATE POLICY "Anyone can view approved blog comments"
ON public.blog_comments
FOR SELECT
USING (
  is_approved = true
  AND post_id IN (SELECT id FROM public.blog_posts WHERE status = 'published')
);

-- Anyone can comment on published posts (guest or logged-in)
CREATE POLICY "Anyone can comment on published blog posts"
ON public.blog_comments
FOR INSERT
WITH CHECK (
  post_id IN (SELECT id FROM public.blog_posts WHERE status = 'published')
);

-- Admins can manage all comments
CREATE POLICY "Admins can manage blog comments"
ON public.blog_comments
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
