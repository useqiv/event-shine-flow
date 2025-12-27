-- Create campaign-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-images', 'campaign-images', true);

-- Allow public read access
CREATE POLICY "Campaign images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-images');

-- Allow authenticated users to upload campaign images
CREATE POLICY "Authenticated users can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

-- Allow users to update their own campaign images
CREATE POLICY "Users can update campaign images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

-- Allow users to delete campaign images
CREATE POLICY "Users can delete campaign images"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');