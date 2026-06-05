import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { BLOG_IMAGE_COMPRESS_OPTIONS } from '@/lib/imageCompression';
import { Plus, X } from 'lucide-react';

interface BlogSidebarImagesManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const BlogSidebarImagesManager: React.FC<BlogSidebarImagesManagerProps> = ({
  images,
  onChange,
  maxImages = 3,
}) => {
  const addImage = () => {
    if (images.length < maxImages) {
      onChange([...images, '']);
    }
  };

  const updateAt = (index: number, url: string) => {
    const next = [...images];
    next[index] = url;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const displaySlots = images.length > 0 ? images : [];

  return (
    <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between gap-2">
        <Label>Global sidebar images (all blog posts)</Label>
        {images.filter(Boolean).length < maxImages && images.length < maxImages && (
          <Button type="button" variant="outline" size="sm" onClick={addImage}>
            <Plus className="h-4 w-4 mr-1" />
            Add image
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        These images appear in the right sidebar on every published blog post (below the ad).
      </p>

      {displaySlots.length === 0 ? (
        <Button type="button" variant="secondary" size="sm" onClick={addImage}>
          <Plus className="h-4 w-4 mr-1" />
          Add sidebar image
        </Button>
      ) : (
        <div className="space-y-6">
          {displaySlots.map((url, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Image {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-8"
                  onClick={() => removeAt(index)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
              <ImageUpload
                bucket="blog-images"
                label=""
                value={url}
                onChange={(newUrl) => updateAt(index, newUrl)}
                compressOptions={BLOG_IMAGE_COMPRESS_OPTIONS}
                maxFileSizeMB={15}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogSidebarImagesManager;
