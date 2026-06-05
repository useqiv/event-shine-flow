import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string | null;
  author_name: string;
  author_email: string | null;
  content: string;
  is_approved: boolean;
  created_at: string;
}

export function useBlogComments(postId: string | undefined) {
  return useQuery({
    queryKey: ['blog-comments', postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', postId!)
        .eq('is_approved', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as BlogComment[];
    },
  });
}

export function useCreateBlogComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      post_id: string;
      author_name: string;
      author_email?: string;
      content: string;
      user_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: input.post_id,
          author_name: input.author_name.trim(),
          author_email: input.author_email?.trim() || null,
          content: input.content.trim(),
          user_id: input.user_id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BlogComment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments', variables.post_id] });
      toast.success('Comment posted!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to post comment');
    },
  });
}
