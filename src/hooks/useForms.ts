import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface Form {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  custom_slug: string | null;
  logo_url: string | null;
  is_active: boolean;
  is_accepting_responses: boolean;
  confirmation_message: string | null;
  allow_multiple_submissions: boolean;
  // Scheduling
  start_date: string | null;
  end_date: string | null;
  // Multi-page
  total_pages: number;
  // Payment
  requires_payment: boolean;
  payment_amount: number;
  payment_currency: string;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  form_id: string;
  field_type: string;
  label: string;
  description: string | null;
  placeholder: string | null;
  is_required: boolean;
  options: string[] | null;
  validation_rules: Json | null;
  display_order: number;
  // Multi-page
  page_number: number;
  // Conditional logic
  conditional_logic: {
    action: 'show' | 'hide';
    logic_type: 'all' | 'any';
    rules: Array<{
      field_id: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
      value: string;
    }>;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  respondent_email: string | null;
  respondent_name: string | null;
  response_data: Json;
  status: string;
  submitted_at: string;
  payment_status: string | null;
  payment_reference: string | null;
  payment_amount: number | null;
}

export const useUserForms = () => {
  return useQuery({
    queryKey: ['user-forms'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Form[];
    },
  });
};

export const useForm = (formId: string) => {
  return useQuery({
    queryKey: ['form', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) throw error;
      return data as Form;
    },
    enabled: !!formId,
  });
};

export const usePublicForm = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['public-form', idOrSlug],
    queryFn: async () => {
      // Try by ID first
      let { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', idOrSlug)
        .eq('is_active', true)
        .maybeSingle();

      // If not found, try by custom slug
      if (!data) {
        const result = await supabase
          .from('forms')
          .select('*')
          .eq('custom_slug', idOrSlug)
          .eq('is_active', true)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data as Form | null;
    },
    enabled: !!idOrSlug,
  });
};

export const useFormFields = (formId: string) => {
  return useQuery({
    queryKey: ['form-fields', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as FormField[];
    },
    enabled: !!formId,
  });
};

export const useFormResponses = (formId: string) => {
  return useQuery({
    queryKey: ['form-responses', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data as FormResponse[];
    },
    enabled: !!formId,
  });
};

export const useCreateForm = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: { title: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('forms')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Form;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-forms'] });
      toast({ title: 'Form created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create form', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateForm = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Form> & { id: string }) => {
      const { data, error } = await supabase
        .from('forms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Form;
    },
    onSuccess: (data) => {
      // Invalidate all form-related queries to ensure fresh data across the app
      queryClient.invalidateQueries({ queryKey: ['user-forms'] });
      queryClient.invalidateQueries({ queryKey: ['form', data.id] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['admin-forms'] });
      queryClient.invalidateQueries({ queryKey: ['public-form', data.custom_slug || data.id] });
      toast({ title: 'Form updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update form', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteForm = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formId: string) => {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-forms'] });
      toast({ title: 'Form deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete form', description: error.message, variant: 'destructive' });
    },
  });
};

export const useCreateFormField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fieldData: {
      form_id: string;
      field_type: string;
      label: string;
      description: string | null;
      placeholder: string | null;
      is_required: boolean;
      options: Json | null;
      validation_rules: Json | null;
      display_order: number;
      page_number?: number;
      conditional_logic?: Json | null;
    }) => {
      const { data, error } = await supabase
        .from('form_fields')
        .insert({
          ...fieldData,
          page_number: fieldData.page_number || 1,
          conditional_logic: fieldData.conditional_logic || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FormField;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['form-fields', data.form_id] });
    },
  });
};

export const useUpdateFormField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, form_id, ...updates }: {
      id: string;
      form_id: string;
      field_type?: string;
      label?: string;
      description?: string | null;
      placeholder?: string | null;
      is_required?: boolean;
      options?: Json | null;
      validation_rules?: Json | null;
      display_order?: number;
      page_number?: number;
      conditional_logic?: Json | null;
    }) => {
      const { data, error } = await supabase
        .from('form_fields')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, form_id } as FormField;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['form-fields', data.form_id] });
    },
  });
};

export const useDeleteFormField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, form_id }: { id: string; form_id: string }) => {
      const { error } = await supabase
        .from('form_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { form_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['form-fields', data.form_id] });
    },
  });
};

export const useSubmitFormResponse = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (responseData: {
      form_id: string;
      respondent_email?: string;
      respondent_name?: string;
      response_data: Json;
    }) => {
      const { data, error } = await supabase
        .from('form_responses')
        .insert(responseData)
        .select()
        .single();

      if (error) throw error;
      return data as FormResponse;
    },
    onError: (error) => {
      toast({ title: 'Failed to submit response', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteFormResponse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, form_id }: { id: string; form_id: string }) => {
      const { error } = await supabase
        .from('form_responses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { form_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['form-responses', data.form_id] });
      toast({ title: 'Response deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete response', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateFormResponse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, form_id, status }: { id: string; form_id: string; status: string }) => {
      const { data, error } = await supabase
        .from('form_responses')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, form_id } as FormResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['form-responses', data.form_id] });
      toast({ title: 'Response status updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update response', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDuplicateForm = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the original form
      const { data: originalForm, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (formError) throw formError;

      // Create new form
      const { data: newForm, error: newFormError } = await supabase
        .from('forms')
        .insert({
          user_id: user.id,
          title: `${originalForm.title} (Copy)`,
          description: originalForm.description,
          confirmation_message: originalForm.confirmation_message,
          allow_multiple_submissions: originalForm.allow_multiple_submissions,
        })
        .select()
        .single();

      if (newFormError) throw newFormError;

      // Get original fields
      const { data: originalFields, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formId)
        .order('display_order', { ascending: true });

      if (fieldsError) throw fieldsError;

      // Duplicate fields
      if (originalFields && originalFields.length > 0) {
        const newFields = originalFields.map(field => ({
          form_id: newForm.id,
          field_type: field.field_type,
          label: field.label,
          description: field.description,
          placeholder: field.placeholder,
          is_required: field.is_required,
          options: field.options,
          validation_rules: field.validation_rules,
          display_order: field.display_order,
        }));

        const { error: insertFieldsError } = await supabase
          .from('form_fields')
          .insert(newFields);

        if (insertFieldsError) throw insertFieldsError;
      }

      return newForm as Form;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-forms'] });
      toast({ title: 'Form duplicated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to duplicate form', description: error.message, variant: 'destructive' });
    },
  });
};

export const useCheckEmailSubmission = () => {
  return useMutation({
    mutationFn: async ({ form_id, email }: { form_id: string; email: string }) => {
      const { data, error } = await supabase
        .from('form_responses')
        .select('id')
        .eq('form_id', form_id)
        .eq('respondent_email', email)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    },
  });
};

export const useFormAnalytics = (formId: string) => {
  return useQuery({
    queryKey: ['form-analytics', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_responses')
        .select('submitted_at, status')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyStats: Record<string, number> = {};
      const statusCounts: Record<string, number> = { pending: 0, reviewed: 0, archived: 0 };

      data?.forEach(response => {
        const date = new Date(response.submitted_at).toISOString().split('T')[0];
        dailyStats[date] = (dailyStats[date] || 0) + 1;
        statusCounts[response.status] = (statusCounts[response.status] || 0) + 1;
      });

      return {
        totalResponses: data?.length || 0,
        dailyStats: Object.entries(dailyStats).map(([date, count]) => ({ date, count })),
        statusCounts,
      };
    },
    enabled: !!formId,
  });
};
