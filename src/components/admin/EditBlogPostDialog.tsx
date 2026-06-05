import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Loader2 } from 'lucide-react';
import {
  BlogPost,
  BlogPostStatus,
  useCreateBlogPost,
  useUpdateBlogPost,
} from '@/hooks/useBlogPosts';
import { slugify, stripHtmlToText } from '@/lib/blogUtils';
import { BLOG_IMAGE_COMPRESS_OPTIONS } from '@/lib/imageCompression';
import { useAuth } from '@/contexts/AuthContext';

interface EditBlogPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: BlogPost | null;
}

const EditBlogPostDialog: React.FC<EditBlogPostDialogProps> = ({
  open,
  onOpenChange,
  post,
}) => {
  const { user } = useAuth();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const isEditing = !!post;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [status, setStatus] = useState<BlogPostStatus>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (open) {
      if (post) {
        setTitle(post.title);
        setSlug(post.slug);
        setExcerpt(post.excerpt ?? '');
        setContent(post.content);
        setCoverImageUrl(post.cover_image_url ?? '');
        setStatus(post.status);
        setIsFeatured(post.is_featured);
        setSlugTouched(true);
      } else {
        setTitle('');
        setSlug('');
        setExcerpt('');
        setContent('');
        setCoverImageUrl('');
        setStatus('draft');
        setIsFeatured(false);
        setSlugTouched(false);
      }
    }
  }, [open, post]);

  useEffect(() => {
    if (!slugTouched && title) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  const isPending = createPost.isPending || updatePost.isPending;
  const hasTextContent = stripHtmlToText(content).length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !hasTextContent) return;

    const payload = {
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      excerpt: excerpt.trim() || undefined,
      content,
      cover_image_url: coverImageUrl || null,
      status,
      is_featured: isFeatured,
    };

    try {
      if (isEditing && post) {
        await updatePost.mutateAsync({ id: post.id, ...payload });
      } else {
        await createPost.mutateAsync({ ...payload, author_id: user?.id });
      }
      onOpenChange(false);
    } catch {
      // Toast handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit blog post' : 'New blog post'}</DialogTitle>
            <DialogDescription>
              Write with the visual editor. Images upload at high quality. Sidebar images are managed separately on the Blog admin page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="blog-title">Title *</Label>
                <Input
                  id="blog-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Post title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog-slug">URL slug *</Label>
                <Input
                  id="blog-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  placeholder="my-post-title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as BlogPostStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-excerpt">Excerpt (recommended for SEO)</Label>
              <Textarea
                id="blog-excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Write a compelling 1–2 sentence summary (used in Google search results and social previews)"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Aim for 120–160 characters. A clear excerpt helps this post rank higher in search results.
              </p>
            </div>

            <ImageUpload
              bucket="blog-images"
              label="Cover image"
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              compressOptions={BLOG_IMAGE_COMPRESS_OPTIONS}
              maxFileSizeMB={15}
            />

            <div className="space-y-2">
              <Label>Content *</Label>
              <RichTextEditor value={content} onChange={setContent} minHeight="360px" />
              {!hasTextContent && content.length > 0 && (
                <p className="text-xs text-destructive">Add some text content to your post.</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
              <Label htmlFor="featured">Featured on homepage</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim() || !hasTextContent}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Save changes' : 'Create post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBlogPostDialog;
