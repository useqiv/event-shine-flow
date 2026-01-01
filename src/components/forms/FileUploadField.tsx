import { useState } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileUploadFieldProps {
  fieldId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  placeholder?: string;
  hasError?: boolean;
}

export const FileUploadField = ({ 
  fieldId, 
  value, 
  onChange, 
  placeholder,
  hasError 
}: FileUploadFieldProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ 
        title: 'File too large', 
        description: 'Maximum file size is 10MB',
        variant: 'destructive' 
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('form-uploads')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('form-uploads')
        .getPublicUrl(fileName);

      onChange(urlData.publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
      toast({ 
        title: 'Upload failed', 
        description: 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  if (value) {
    const fileName = value.split('/').pop() || 'Uploaded file';
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(value);

    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-3">
          {isImage ? (
            <img 
              src={value} 
              alt="Uploaded" 
              className="h-16 w-16 object-cover rounded-lg"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View file
            </a>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all hover:border-primary/50 hover:bg-primary/5 ${hasError ? 'border-destructive' : 'border-border/50'}`}>
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        id={`file-${fieldId}`}
        disabled={isUploading}
      />
      <label htmlFor={`file-${fieldId}`} className="cursor-pointer">
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div className="text-muted-foreground">
              <p className="font-medium">{placeholder || 'Click to upload a file'}</p>
              <p className="text-sm">or drag and drop (max 10MB)</p>
            </div>
          </div>
        )}
      </label>
    </div>
  );
};