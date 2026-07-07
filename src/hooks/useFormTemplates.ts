import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { POLL_TEMPLATE_NAME } from '@/lib/formHelpers';
export interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  template_data: {
    title: string;
    description?: string;
    confirmation_message?: string;
    total_pages?: number;
    form_type?: 'standard' | 'poll';
  };
  fields_data: Array<{
    field_type: string;
    label: string;
    is_required?: boolean;
    page_number?: number;
    display_order?: number;
    description?: string;
    placeholder?: string;
    options?: string[];
  }>;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useFormTemplates = () => {
  return useQuery({
    queryKey: ['form-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      
      return data.map(template => ({
        ...template,
        template_data: template.template_data as FormTemplate['template_data'],
        fields_data: template.fields_data as FormTemplate['fields_data'],
      })) as FormTemplate[];
    },
  });
};

export const useCreateFormFromTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the template
      const { data: template, error: templateError } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      const templateData = template.template_data as FormTemplate['template_data'];
      const fieldsData = template.fields_data as FormTemplate['fields_data'];
      const isPoll =
        templateData.form_type === 'poll' || template.name === POLL_TEMPLATE_NAME;

      // Create the form
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          user_id: user.id,
          title: templateData.title,
          description: templateData.description || null,
          confirmation_message: templateData.confirmation_message || 'Thank you for your response!',
          total_pages: templateData.total_pages || 1,
          form_type: isPoll ? 'poll' : 'standard',
          approval_status: isPoll ? 'pending' : 'approved',
          is_active: !isPoll,
          is_accepting_responses: !isPoll,
          allow_multiple_submissions: !isPoll,
        })
        .select()
        .single();

      if (formError) throw formError;

      // Create fields
      if (fieldsData && fieldsData.length > 0) {
        const fields = fieldsData.map(field => ({
          form_id: form.id,
          field_type: field.field_type,
          label: field.label,
          is_required: field.is_required || false,
          page_number: field.page_number || 1,
          display_order: field.display_order || 1,
          description: field.description || null,
          placeholder: field.placeholder || null,
          options: field.options || null,
        }));

        const { error: fieldsError } = await supabase
          .from('form_fields')
          .insert(fields);

        if (fieldsError) throw fieldsError;
      }

      return form;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-forms'] });
      toast({ title: 'Form created from template' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create form', description: error.message, variant: 'destructive' });
    },
  });
};
