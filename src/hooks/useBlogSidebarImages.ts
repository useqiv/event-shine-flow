import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SETTING_KEY = 'blog_sidebar_images';

function parseSidebarImages(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  } catch {
    // ignore invalid JSON
  }
  return [];
}

export function useBlogSidebarImages() {
  return useQuery({
    queryKey: ['blog-sidebar-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', SETTING_KEY)
        .maybeSingle();

      if (error) throw error;
      return parseSidebarImages(data?.setting_value);
    },
  });
}

export function useUpdateBlogSidebarImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (images: string[]) => {
      const value = JSON.stringify(images.filter(Boolean));
      const { data: existing } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('setting_key', SETTING_KEY)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ setting_value: value, updated_at: new Date().toISOString() })
          .eq('setting_key', SETTING_KEY);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('platform_settings').insert({
          setting_key: SETTING_KEY,
          setting_value: value,
          category: 'public',
          setting_type: 'json',
          description: 'Sidebar images shown on all blog post pages (right column)',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-sidebar-images'] });
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Blog sidebar images saved');
    },
    onError: () => {
      toast.error('Failed to save sidebar images');
    },
  });
}
