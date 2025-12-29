import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContestCategory {
  id: string;
  contest_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useContestCategories = (contestId: string) => {
  return useQuery({
    queryKey: ['contest-categories', contestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contest_categories')
        .select('*')
        .eq('contest_id', contestId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as ContestCategory[];
    },
    enabled: !!contestId,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contest_id: string;
      name: string;
      description?: string;
      display_order?: number;
    }) => {
      const { data: result, error } = await supabase
        .from('contest_categories')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contest-categories', variables.contest_id] });
      toast.success('Category created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create category');
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      contest_id: string;
      name?: string;
      description?: string;
      display_order?: number;
    }) => {
      const { id, contest_id, ...updates } = data;
      const { data: result, error } = await supabase
        .from('contest_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contest-categories', variables.contest_id] });
      toast.success('Category updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update category');
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, contest_id }: { id: string; contest_id: string }) => {
      const { error } = await supabase
        .from('contest_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, contest_id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contest-categories', variables.contest_id] });
      queryClient.invalidateQueries({ queryKey: ['contestants'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
};

export const useReorderCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contest_id, updates }: { 
      contest_id: string; 
      updates: Array<{ id: string; display_order: number }> 
    }) => {
      const promises = updates.map(({ id, display_order }) =>
        supabase
          .from('contest_categories')
          .update({ display_order })
          .eq('id', id)
      );
      
      await Promise.all(promises);
      return { contest_id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contest-categories', variables.contest_id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reorder categories');
    },
  });
};
