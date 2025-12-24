import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<string | null>;
  isUploading?: boolean;
  progress?: number;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'banner';
}

const ImageUpload = ({
  value,
  onChange,
  onUpload,
  isUploading = false,
  progress = 0,
  className,
  aspectRatio = 'video',
}: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[3/1]',
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const url = await onUpload(files[0]);
      if (url) onChange(url);
    }
  }, [onUpload, onChange]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const url = await onUpload(files[0]);
      if (url) onChange(url);
    }
    // Reset input
    if (inputRef.current) inputRef.current.value = '';
  }, [onUpload, onChange]);

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  if (value) {
    return (
      <div className={cn('relative rounded-lg overflow-hidden border', aspectClasses[aspectRatio], className)}>
        <img
          src={value}
          alt="Uploaded"
          className="w-full h-full object-cover"
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-colors cursor-pointer',
        aspectClasses[aspectRatio],
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
            <Progress value={progress} className="w-32" />
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              {isDragging ? (
                <ImageIcon className="h-6 w-6 text-primary" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragging ? 'Drop image here' : 'Click or drag image'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP or GIF (max 5MB)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
