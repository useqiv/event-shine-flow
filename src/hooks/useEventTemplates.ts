import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface EventTemplateData {
  title: string;
  description: string;
  category: string;
  image_url: string;
  venue: string;
  address: string;
}

export interface EventTemplate {
  id: string;
  organization_id: string;
  name: string;
  template_data: EventTemplateData;
  created_at: string;
  updated_at: string;
}

export const useEventTemplates = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['event-templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        template_data: item.template_data as unknown as EventTemplateData,
      })) as EventTemplate[];
    },
    enabled: !!user,
  });
};

export const useCreateEventTemplate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, templateData }: { name: string; templateData: EventTemplateData }) => {
      const { data, error } = await supabase
        .from('event_templates')
        .insert({
          organization_id: user!.id,
          name,
          template_data: templateData as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-templates'] });
      toast.success('Template saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    },
  });
};

export const useDeleteEventTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('event_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-templates'] });
      toast.success('Template deleted');
    },
    onError: (error) => {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    },
  });
};
