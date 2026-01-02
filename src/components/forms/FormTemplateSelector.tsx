import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, ClipboardList, Calendar, BarChart3, 
  Briefcase, Vote, FileText, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFormTemplates, useCreateFormFromTemplate } from '@/hooks/useFormTemplates';

const categoryIcons: Record<string, React.ElementType> = {
  contact: MessageSquare,
  feedback: ClipboardList,
  event: Calendar,
  survey: BarChart3,
  general: FileText,
};

const categoryColors: Record<string, string> = {
  contact: 'bg-blue-500/10 text-blue-600 border-blue-200',
  feedback: 'bg-amber-500/10 text-amber-600 border-amber-200',
  event: 'bg-purple-500/10 text-purple-600 border-purple-200',
  survey: 'bg-green-500/10 text-green-600 border-green-200',
  general: 'bg-muted text-muted-foreground border-border',
};

interface FormTemplateSelectorProps {
  onClose?: () => void;
}

const FormTemplateSelector = ({ onClose }: FormTemplateSelectorProps) => {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useFormTemplates();
  const createFromTemplate = useCreateFormFromTemplate();

  const handleSelectTemplate = async (templateId: string) => {
    const form = await createFromTemplate.mutateAsync(templateId);
    onClose?.();
    navigate(`/forms/${form.id}/builder`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groupedTemplates = templates?.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  return (
    <div className="space-y-6">
      {groupedTemplates && Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
        const Icon = categoryIcons[category] || FileText;
        
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {category === 'event' ? 'Registration' : category}
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {categoryTemplates?.map((template) => (
                <Card 
                  key={template.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColors[category]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {template.fields_data.length} fields
                          </Badge>
                          {template.template_data.total_pages && template.template_data.total_pages > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {template.template_data.total_pages} pages
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FormTemplateSelector;
