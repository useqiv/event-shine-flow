import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { slugify } from '@/lib/blogUtils';

export type BlogPostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  sidebar_images: string[];
  author_id: string | null;
  status: BlogPostStatus;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BlogPostInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  cover_image_url?: string | null;
  sidebar_images?: string[];
  status: BlogPostStatus;
  is_featured?: boolean;
};

function parseSidebarImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  return [];
}

function normalizePost(row: Record<string, unknown>): BlogPost {
  return {
    ...(row as BlogPost),
    sidebar_images: parseSidebarImages(row.sidebar_images),
  };
}

export function usePublishedBlogPosts(limit = 6) {
  return useQuery({
    queryKey: ['blog-posts', 'published', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map((row) => normalizePost(row as Record<string, unknown>));
    },
  });
}

export function useRelatedBlogPosts(currentSlug: string | undefined, limit = 4) {
  return useQuery({
    queryKey: ['blog-posts', 'related', currentSlug, limit],
    enabled: !!currentSlug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .neq('slug', currentSlug!)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map((row) => normalizePost(row as Record<string, unknown>));
    },
  });
}

export function useBlogPostBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['blog-post', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug!)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      return data ? normalizePost(data as Record<string, unknown>) : null;
    },
  });
}

export function useAdminBlogPosts() {
  return useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((row) => normalizePost(row as Record<string, unknown>));
    },
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BlogPostInput & { author_id?: string }) => {
      const slug = input.slug?.trim() || slugify(input.title);
      const published_at =
        input.status === 'published' ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title: input.title,
          slug,
          excerpt: input.excerpt ?? null,
          content: input.content,
          cover_image_url: input.cover_image_url ?? null,
          sidebar_images: input.sidebar_images ?? [],
          status: input.status,
          is_featured: input.is_featured ?? false,
          author_id: input.author_id ?? null,
          published_at,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Blog post created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create blog post');
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: BlogPostInput & { id: string; author_id?: string }) => {
      const updates: Record<string, unknown> = {
        title: input.title,
        excerpt: input.excerpt ?? null,
        content: input.content,
        cover_image_url: input.cover_image_url ?? null,
        sidebar_images: input.sidebar_images ?? [],
        status: input.status,
        is_featured: input.is_featured ?? false,
      };

      if (input.slug) {
        updates.slug = input.slug.trim();
      }

      if (input.status === 'published') {
        const { data: existing } = await supabase
          .from('blog_posts')
          .select('published_at')
          .eq('id', id)
          .single();

        if (!existing?.published_at) {
          updates.published_at = new Date().toISOString();
        }
      } else {
        updates.published_at = null;
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post'] });
      toast.success('Blog post updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update blog post');
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Blog post deleted');
    },
    onError: () => {
      toast.error('Failed to delete blog post');
    },
  });
}
