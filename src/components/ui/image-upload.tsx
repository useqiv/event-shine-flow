import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  compressImage,
  getCompressedExtension,
  type CompressImageOptions,
} from '@/lib/imageCompression';

interface ImageUploadProps {
  bucket: 'contest-images' | 'event-images' | 'contestant-images' | 'campaign-images' | 'avatars' | 'blog-images';
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  compressOptions?: number | CompressImageOptions;
  maxFileSizeMB?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  bucket,
  value,
  onChange,
  label = 'Upload Image',
  className,
  compressOptions,
  maxFileSizeMB = 10,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > maxFileSizeMB * 1024 * 1024) {
      toast.error(`Image must be less than ${maxFileSizeMB}MB`);
      return;
    }

    setIsUploading(true);

    try {
      const compressedBlob = await compressImage(file, compressOptions);
      const extension = getCompressedExtension(file, compressedBlob);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: compressedBlob.type || file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(publicUrl);

      if (compressedBlob.size < file.size) {
        const savedPercent = Math.round((1 - compressedBlob.size / file.size) * 100);
        toast.success(`Image uploaded (${savedPercent}% smaller)`);
      } else {
        toast.success('Image uploaded at full quality');
      }
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}

      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-border',
          value ? 'p-2' : 'p-6'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
            <img
              src={value}
              alt="Uploaded"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-muted-foreground mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drag & drop an image here</p>
                <p className="text-xs text-muted-foreground mb-3">or</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  PNG, JPG or WEBP (max {maxFileSizeMB}MB)
                </p>
              </>
            )}
          </div>
        )}

        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUpload;
