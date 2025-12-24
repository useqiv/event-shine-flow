-- Create storage buckets for contests and events
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('contest-images', 'contest-images', true),
  ('event-images', 'event-images', true),
  ('contestant-images', 'contestant-images', true);

-- RLS policies for contest-images bucket
CREATE POLICY "Anyone can view contest images"
ON storage.objects FOR SELECT
USING (bucket_id = 'contest-images');

CREATE POLICY "Organizations can upload contest images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contest-images' 
  AND auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'organization')
);

CREATE POLICY "Organizations can update their contest images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contest-images' 
  AND auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'organization')
);

CREATE POLICY "Organizations can delete their contest images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contest-images' 
  AND auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'organization')
);

-- RLS policies for event-images bucket
CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

CREATE POLICY "Organizations can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'organization')
);

CREATE POLICY "Organizations can update their event images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'organization')
);

CREATE POLICY "Organizations can delete their event images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'organization')
);

-- RLS policies for contestant-images bucket
CREATE POLICY "Anyone can view contestant images"
ON storage.objects FOR SELECT
USING (bucket_id = 'contestant-images');

CREATE POLICY "Organizations can upload contestant images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contestant-images' 
  AND auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'organization')
);

CREATE POLICY "Organizations can update their contestant images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contestant-images' 
  AND auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'organization')
);

CREATE POLICY "Organizations can delete their contestant images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contestant-images' 
  AND auth.uid() IS NOT NULL 
  AND public.has_role(auth.uid(), 'organization')
);