import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, Plus, Trash2, GripVertical, Eye, Save, Settings, 
  Type, AlignLeft, Hash, Mail, Calendar, ListFilter, CheckSquare, 
  CircleDot, Star, Upload
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useForm, useFormFields, useUpdateForm, useCreateFormField, useUpdateFormField, useDeleteFormField, FormField } from '@/hooks/useForms';
import { useToast } from '@/hooks/use-toast';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text', icon: Type },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'dropdown', label: 'Dropdown', icon: ListFilter },
  { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
  { value: 'radio', label: 'Multiple Choice', icon: CircleDot },
  { value: 'rating', label: 'Rating', icon: Star },
  { value: 'file', label: 'File Upload', icon: Upload },
];

const FormBuilder = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: form, isLoading: formLoading } = useForm(formId || '');
  const { data: fields, isLoading: fieldsLoading } = useFormFields(formId || '');
  const updateForm = useUpdateForm();
  const createField = useCreateFormField();
  const updateField = useUpdateFormField();
  const deleteField = useDeleteFormField();

  const [activeTab, setActiveTab] = useState('fields');
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [formSettings, setFormSettings] = useState({
    title: '',
    description: '',
    custom_slug: '',
    is_active: true,
    is_accepting_responses: true,
    confirmation_message: 'Thank you for your response!',
  });

  useEffect(() => {
    if (form) {
      setFormSettings({
        title: form.title,
        description: form.description || '',
        custom_slug: form.custom_slug || '',
        is_active: form.is_active,
        is_accepting_responses: form.is_accepting_responses,
        confirmation_message: form.confirmation_message || 'Thank you for your response!',
      });
    }
  }, [form]);

  const handleSaveSettings = async () => {
    if (!formId) return;
    await updateForm.mutateAsync({
      id: formId,
      ...formSettings,
      custom_slug: formSettings.custom_slug || null,
    });
  };

  const handleAddField = async (fieldType: string) => {
    if (!formId) return;
    
    const newField = await createField.mutateAsync({
      form_id: formId,
      field_type: fieldType,
      label: `New ${FIELD_TYPES.find(t => t.value === fieldType)?.label || 'Field'}`,
      is_required: false,
      display_order: (fields?.length || 0) + 1,
      description: null,
      placeholder: null,
      options: ['dropdown', 'checkbox', 'radio'].includes(fieldType) ? ['Option 1', 'Option 2'] : null,
      validation_rules: null,
    });

    setIsAddFieldOpen(false);
    setSelectedField(newField);
  };

  const handleUpdateField = async (updates: Partial<FormField>) => {
    if (!selectedField || !formId) return;
    await updateField.mutateAsync({
      id: selectedField.id,
      form_id: formId,
      ...updates,
    });
    setSelectedField({ ...selectedField, ...updates });
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!formId) return;
    if (confirm('Are you sure you want to delete this field?')) {
      await deleteField.mutateAsync({ id: fieldId, form_id: formId });
      if (selectedField?.id === fieldId) {
        setSelectedField(null);
      }
    }
  };

  if (formLoading || fieldsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!form) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">Form not found</h2>
          <Button onClick={() => navigate('/forms')}>Back to Forms</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Edit Form - {form.title} | VoteApp</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/forms">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{form.title}</h1>
              <p className="text-muted-foreground text-sm">Edit your form</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/f/${form.id}`} target="_blank">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </Link>
            <Button onClick={() => navigate(`/forms/${formId}/responses`)}>
              View Responses
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Fields List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Form Fields</h3>
                  <Button onClick={() => setIsAddFieldOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                {fields && fields.length > 0 ? (
                  <div className="space-y-3">
                    {fields.map((field) => {
                      const fieldType = FIELD_TYPES.find(t => t.value === field.field_type);
                      const Icon = fieldType?.icon || Type;
                      
                      return (
                        <Card 
                          key={field.id}
                          className={`cursor-pointer transition-all ${
                            selectedField?.id === field.id 
                              ? 'ring-2 ring-primary' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setSelectedField(field)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                              <Icon className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{field.label}</p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {fieldType?.label || field.field_type}
                                </p>
                              </div>
                              {field.is_required && (
                                <Badge variant="secondary">Required</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteField(field.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">No fields yet. Add your first field to get started.</p>
                      <Button onClick={() => setIsAddFieldOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Field Editor */}
              <div className="lg:col-span-1">
                {selectedField ? (
                  <Card className="sticky top-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Edit Field</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={selectedField.label}
                          onChange={(e) => handleUpdateField({ label: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description (optional)</Label>
                        <Textarea
                          value={selectedField.description || ''}
                          onChange={(e) => handleUpdateField({ description: e.target.value || null })}
                          placeholder="Help text for this field"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={selectedField.placeholder || ''}
                          onChange={(e) => handleUpdateField({ placeholder: e.target.value || null })}
                          placeholder="Placeholder text"
                        />
                      </div>

                      {['dropdown', 'checkbox', 'radio'].includes(selectedField.field_type) && (
                        <div className="space-y-2">
                          <Label>Options (one per line)</Label>
                          <Textarea
                            value={(selectedField.options as string[] || []).join('\n')}
                            onChange={(e) => {
                              const options = e.target.value.split('\n').filter(o => o.trim());
                              handleUpdateField({ options: options.length > 0 ? options : null });
                            }}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={4}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Label htmlFor="required">Required</Label>
                        <Switch
                          id="required"
                          checked={selectedField.is_required}
                          onCheckedChange={(checked) => handleUpdateField({ is_required: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Settings className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        Select a field to edit its properties
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Form Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formSettings.title}
                    onChange={(e) => setFormSettings({ ...formSettings, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formSettings.description}
                    onChange={(e) => setFormSettings({ ...formSettings, description: e.target.value })}
                    placeholder="Describe your form..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Custom URL Slug (optional)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">{window.location.origin}/f/</span>
                    <Input
                      value={formSettings.custom_slug}
                      onChange={(e) => setFormSettings({ ...formSettings, custom_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="my-form"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Confirmation Message</Label>
                  <Textarea
                    value={formSettings.confirmation_message}
                    onChange={(e) => setFormSettings({ ...formSettings, confirmation_message: e.target.value })}
                    placeholder="Thank you for your response!"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Form Active</Label>
                      <p className="text-sm text-muted-foreground">Make this form publicly accessible</p>
                    </div>
                    <Switch
                      checked={formSettings.is_active}
                      onCheckedChange={(checked) => setFormSettings({ ...formSettings, is_active: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Accepting Responses</Label>
                      <p className="text-sm text-muted-foreground">Allow new responses to be submitted</p>
                    </div>
                    <Switch
                      checked={formSettings.is_accepting_responses}
                      onCheckedChange={(checked) => setFormSettings({ ...formSettings, is_accepting_responses: checked })}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={updateForm.isPending} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {updateForm.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Field Dialog */}
      <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Field</DialogTitle>
            <DialogDescription>Choose a field type to add to your form.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {FIELD_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.value}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => handleAddField(type.value)}
                  disabled={createField.isPending}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{type.label}</span>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FormBuilder;
