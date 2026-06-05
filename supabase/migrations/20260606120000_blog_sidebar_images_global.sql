-- Global blog sidebar images (same on every blog post, not per-post)
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, category, description)
VALUES (
  'blog_sidebar_images',
  '[]',
  'json',
  'public',
  'Sidebar images shown on all blog post pages (right column)'
)
ON CONFLICT (setting_key) DO NOTHING;
