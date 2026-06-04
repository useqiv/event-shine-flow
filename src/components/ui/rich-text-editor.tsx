import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { compressImage, getCompressedExtension } from '@/lib/imageCompression';
import { toast } from 'sonner';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Link as LinkIcon,
  ImageIcon,
  Loader2,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your blog post...',
  className,
  minHeight = '280px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || isInternalUpdate.current) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalUpdate.current = true;
    onChange(el.innerHTML);
    requestAnimationFrame(() => {
      isInternalUpdate.current = false;
    });
  }, [onChange]);

  const exec = (command: string, valueArg?: string) => {
    document.execCommand(command, false, valueArg);
    editorRef.current?.focus();
    emitChange();
  };

  const handleLink = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      exec('createLink', url);
    }
  };

  const uploadInlineImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setIsUploadingImage(true);
    try {
      const compressedBlob = await compressImage(file);
      const extension = getCompressedExtension(file, compressedBlob);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, compressedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: compressedBlob.type,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('blog-images').getPublicUrl(fileName);

      exec('insertImage', publicUrl);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const toolbarButtons = [
    { icon: Bold, label: 'Bold', action: () => exec('bold') },
    { icon: Italic, label: 'Italic', action: () => exec('italic') },
    { icon: Underline, label: 'Underline', action: () => exec('underline') },
    { icon: Heading2, label: 'Heading 2', action: () => exec('formatBlock', 'h2') },
    { icon: Heading3, label: 'Heading 3', action: () => exec('formatBlock', 'h3') },
    { icon: List, label: 'Bullet list', action: () => exec('insertUnorderedList') },
    { icon: ListOrdered, label: 'Numbered list', action: () => exec('insertOrderedList') },
    { icon: LinkIcon, label: 'Link', action: handleLink },
    {
      icon: ImageIcon,
      label: 'Image',
      action: () => fileInputRef.current?.click(),
      disabled: isUploadingImage,
    },
  ];

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden bg-background', className)}>
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/50">
        {toolbarButtons.map(({ icon: Icon, label, action, disabled }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={label}
            onClick={action}
            disabled={disabled}
          >
            {disabled && label === 'Image' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </Button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        className={cn(
          'px-4 py-3 outline-none prose prose-sm max-w-none dark:prose-invert',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground',
          '[&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2'
        )}
        style={{ minHeight }}
        onInput={emitChange}
        onBlur={emitChange}
        suppressContentEditableWarning
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadInlineImage(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default RichTextEditor;
