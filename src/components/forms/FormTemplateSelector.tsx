import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, ClipboardList, Calendar, BarChart3, 
  FileText, Loader2, Vote
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFormTemplates, useCreateFormFromTemplate } from '@/hooks/useFormTemplates';
import { POLL_TEMPLATE_NAME } from '@/lib/formHelpers';

const categoryIcons: Record<string, React.ElementType> = {
  contact: MessageSquare,
  feedback: ClipboardList,
  event: Calendar,
  survey: BarChart3,
  general: FileText,
  poll: Vote,
};

const categoryColors: Record<string, string> = {
  contact: 'bg-blue-500/10 text-blue-600 border-blue-200',
  feedback: 'bg-amber-500/10 text-amber-600 border-amber-200',
  event: 'bg-purple-500/10 text-purple-600 border-purple-200',
  survey: 'bg-green-500/10 text-green-600 border-green-200',
  general: 'bg-muted text-muted-foreground border-border',
  poll: 'bg-orange-500/10 text-orange-600 border-orange-200',
};

interface FormTemplateSelectorProps {
  onClose?: () => void;
}

const FormTemplateSelector = ({ onClose }: FormTemplateSelectorProps) => {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useFormTemplates();
  const createFromTemplate = useCreateFormFromTemplate();
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);

  const handleSelectTemplate = async (templateId: string) => {
    if (creatingTemplateId) return;

    try {
      setCreatingTemplateId(templateId);
      const form = await createFromTemplate.mutateAsync(templateId);
      onClose?.();
      navigate(`/forms/${form.id}/edit`);
    } catch {
      // Error toast handled by mutation
    } finally {
      setCreatingTemplateId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!templates?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No templates available yet.
      </div>
    );
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    const category =
      template.name === POLL_TEMPLATE_NAME || template.template_data.form_type === 'poll'
        ? 'poll'
        : template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  const categoryLabels: Record<string, string> = {
    contact: 'Contact',
    feedback: 'Feedback',
    event: 'Registration',
    survey: 'Survey',
    poll: 'Poll / Quick Vote',
    general: 'General',
  };

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
        const Icon = categoryIcons[category] || FileText;
        
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {categoryLabels[category] || category}
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {categoryTemplates.map((template) => {
                const isCreating = creatingTemplateId === template.id;
                const isPoll =
                  template.name === POLL_TEMPLATE_NAME ||
                  template.template_data.form_type === 'poll';

                return (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group ${
                      isCreating ? 'opacity-70 pointer-events-none' : ''
                    }`}
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColors[category]}`}>
                          {isCreating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                            {template.name}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {template.fields_data.length} fields
                            </Badge>
                            {template.template_data.total_pages && template.template_data.total_pages > 1 && (
                              <Badge variant="outline" className="text-xs">
                                {template.template_data.total_pages} pages
                              </Badge>
                            )}
                            {isPoll && (
                              <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-200">
                                Admin approval required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FormTemplateSelector;
