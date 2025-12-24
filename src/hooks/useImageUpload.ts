import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type BucketName = 'contest-images' | 'event-images' | 'contestant-images';

export const useImageUpload = (bucket: BucketName) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload images",
        variant: "destructive",
      });
      return null;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image",
        variant: "destructive",
      });
      return null;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      setProgress(30);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      setProgress(80);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress(100);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [bucket, user]);

  const deleteImage = useCallback(async (imageUrl: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Extract path from URL
      const urlParts = imageUrl.split(`${bucket}/`);
      if (urlParts.length < 2) return false;
      
      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      return false;
    }
  }, [bucket, user]);

  return {
    uploadImage,
    deleteImage,
    isUploading,
    progress,
  };
};
