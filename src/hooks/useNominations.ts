import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Nomination {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  logo_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NominationCategory {
  id: string;
  nomination_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface NominationSubmission {
  id: string;
  category_id: string;
  nominee_name: string;
  submitter_email: string | null;
  submitter_name: string | null;
  created_at: string;
}

// Fetch all nominations for an organization
export function useOrganizationNominations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['nominations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nominations')
        .select('*')
        .eq('organization_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Nomination[];
    },
    enabled: !!user?.id,
  });
}

// Fetch single nomination
export function useNomination(nominationId: string) {
  return useQuery({
    queryKey: ['nomination', nominationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nominations')
        .select('*')
        .eq('id', nominationId)
        .single();

      if (error) throw error;
      return data as Nomination;
    },
    enabled: !!nominationId,
  });
}

// Fetch categories for a nomination
export function useNominationCategories(nominationId: string) {
  return useQuery({
    queryKey: ['nomination-categories', nominationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nomination_categories')
        .select('*')
        .eq('nomination_id', nominationId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as NominationCategory[];
    },
    enabled: !!nominationId,
  });
}

// Fetch submissions for a category
export function useNominationSubmissions(categoryId: string) {
  return useQuery({
    queryKey: ['nomination-submissions', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nomination_submissions')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as NominationSubmission[];
    },
    enabled: !!categoryId,
  });
}

// Fetch all submissions for a nomination (across all categories)
export function useAllNominationSubmissions(nominationId: string) {
  const { data: categories } = useNominationCategories(nominationId);

  return useQuery({
    queryKey: ['all-nomination-submissions', nominationId],
    queryFn: async () => {
      if (!categories || categories.length === 0) return [];
      
      const categoryIds = categories.map(c => c.id);
      const { data, error } = await supabase
        .from('nomination_submissions')
        .select('*')
        .in('category_id', categoryIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as NominationSubmission[];
    },
    enabled: !!categories && categories.length > 0,
  });
}

// Create nomination
export function useCreateNomination() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      logo_url?: string;
      start_date: string;
      end_date: string;
    }) => {
      const { data: result, error } = await supabase
        .from('nominations')
        .insert({
          ...data,
          organization_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result as Nomination;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominations'] });
      toast.success('Nomination created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create nomination: ${error.message}`);
    },
  });
}

// Update nomination
export function useUpdateNomination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Nomination> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('nominations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Nomination;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['nominations'] });
      queryClient.invalidateQueries({ queryKey: ['nomination', data.id] });
      toast.success('Nomination updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update nomination: ${error.message}`);
    },
  });
}

// Delete nomination
export function useDeleteNomination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('nominations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominations'] });
      toast.success('Nomination deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete nomination: ${error.message}`);
    },
  });
}

// Create category
export function useCreateNominationCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nomination_id: string;
      name: string;
      description?: string;
      display_order?: number;
    }) => {
      const { data: result, error } = await supabase
        .from('nomination_categories')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as NominationCategory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['nomination-categories', data.nomination_id] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });
}

// Update category
export function useUpdateNominationCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<NominationCategory> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('nomination_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as NominationCategory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['nomination-categories', data.nomination_id] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
}

// Delete category
export function useDeleteNominationCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nominationId }: { id: string; nominationId: string }) => {
      const { error } = await supabase
        .from('nomination_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return nominationId;
    },
    onSuccess: (nominationId) => {
      queryClient.invalidateQueries({ queryKey: ['nomination-categories', nominationId] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });
}

// Public: Submit a nomination (no auth required)
export function useSubmitNomination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category_id: string;
      nominee_name: string;
      submitter_email?: string;
      submitter_name?: string;
    }) => {
      // Important: do NOT call `.select()` here.
      // For public submissions we typically don't allow SELECT on nomination_submissions via RLS,
      // and PostgREST will try to read the inserted row when `returning=representation`.
      const { error } = await supabase
        .from('nomination_submissions')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nomination-submissions', variables.category_id] });
      toast.success('Nomination submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit nomination: ${error.message}`);
    },
  });
}

// Delete submission
export function useDeleteNominationSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, categoryId }: { id: string; categoryId: string }) => {
      const { error } = await supabase
        .from('nomination_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return categoryId;
    },
    onSuccess: (categoryId) => {
      queryClient.invalidateQueries({ queryKey: ['nomination-submissions', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['all-nomination-submissions'] });
      toast.success('Submission deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete submission: ${error.message}`);
    },
  });
}

// Fetch public nomination by ID (for public form page)
export function usePublicNomination(nominationId: string) {
  return useQuery({
    queryKey: ['public-nomination', nominationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nominations')
        .select('*')
        .eq('id', nominationId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as Nomination;
    },
    enabled: !!nominationId,
  });
}

// Fetch public categories for a nomination
export function usePublicNominationCategories(nominationId: string) {
  return useQuery({
    queryKey: ['public-nomination-categories', nominationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nomination_categories')
        .select('*')
        .eq('nomination_id', nominationId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as NominationCategory[];
    },
    enabled: !!nominationId,
  });
}

// Check if an email has already submitted a nomination for a given category
export function useCheckPreviousNomination(categoryId: string, email: string) {
  return useQuery({
    queryKey: ['check-previous-nomination', categoryId, email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nomination_submissions')
        .select('id, nominee_name, created_at')
        .eq('category_id', categoryId)
        .eq('submitter_email', email)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as { id: string; nominee_name: string; created_at: string }[];
    },
    enabled: !!categoryId && !!email && email.includes('@'),
  });
}

// Fetch all unique emails that submitted nominations for a given nomination
export function useNominationEmails(nominationId: string) {
  const { data: categories } = useNominationCategories(nominationId);

  return useQuery({
    queryKey: ['nomination-emails', nominationId],
    queryFn: async () => {
      if (!categories || categories.length === 0) return [];
      
      const categoryIds = categories.map(c => c.id);
      const { data, error } = await supabase
        .from('nomination_submissions')
        .select('submitter_email')
        .in('category_id', categoryIds)
        .not('submitter_email', 'is', null);

      if (error) throw error;
      
      // Get unique emails
      const emails = [...new Set(data.map(d => d.submitter_email).filter(Boolean))] as string[];
      return emails;
    },
    enabled: !!categories && categories.length > 0,
  });
}
