import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useEventTemplates, useCreateEventTemplate, useDeleteEventTemplate, EventTemplateData } from '@/hooks/useEventTemplates';
import { FileText, Save, Trash2, FolderOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface EventTemplateSelectorProps {
  currentData: EventTemplateData;
  onLoadTemplate: (data: EventTemplateData) => void;
}

export const EventTemplateSelector: React.FC<EventTemplateSelectorProps> = ({
  currentData,
  onLoadTemplate,
}) => {
  const { data: templates, isLoading } = useEventTemplates();
  const createTemplate = useCreateEventTemplate();
  const deleteTemplate = useDeleteEventTemplate();
  
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    
    await createTemplate.mutateAsync({
      name: templateName,
      templateData: currentData,
    });
    
    setTemplateName('');
    setSaveDialogOpen(false);
  };

  const handleLoadTemplate = (templateData: EventTemplateData) => {
    onLoadTemplate(templateData);
    setLoadDialogOpen(false);
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    await deleteTemplate.mutateAsync(templateId);
  };

  return (
    <div className="flex gap-2">
      {/* Save as Template */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Event Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Weekly Concert Setup"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This will save the current event details (except date) as a reusable template.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTemplate} 
                disabled={!templateName.trim() || createTemplate.isPending}
              >
                {createTemplate.isPending ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Template */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            Load Template
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Load Event Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : templates && templates.length > 0 ? (
              templates.map((template) => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleLoadTemplate(template.template_data)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {template.template_data.category || 'No category'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteTemplate(e, template.id)}
                      disabled={deleteTemplate.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No templates saved yet</p>
                <p className="text-sm">Save your first template to reuse event details</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
