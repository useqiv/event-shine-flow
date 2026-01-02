import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, Plus, Trash2, GripVertical, Eye, Save, Settings, 
  Type, AlignLeft, Hash, Mail, Calendar, ListFilter, CheckSquare, 
  CircleDot, Star, Upload, Phone, Link2, Clock, MapPin, ToggleLeft,
  Heading, SeparatorHorizontal, Image, User, CreditCard, CalendarClock
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm, useFormFields, useUpdateForm, useCreateFormField, useUpdateFormField, useDeleteFormField, FormField } from '@/hooks/useForms';
import { useToast } from '@/hooks/use-toast';
import ConditionalLogicEditor, { ConditionalLogic } from '@/components/forms/ConditionalLogicEditor';

const FIELD_TYPES = [
  // Text inputs
  { value: 'first_name', label: 'First Name', icon: User, category: 'text' },
  { value: 'last_name', label: 'Last Name', icon: User, category: 'text' },
  { value: 'text', label: 'Short Text', icon: Type, category: 'text' },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft, category: 'text' },
  { value: 'number', label: 'Number', icon: Hash, category: 'text' },
  { value: 'email', label: 'Email', icon: Mail, category: 'text' },
  { value: 'phone', label: 'Phone Number', icon: Phone, category: 'text' },
  { value: 'url', label: 'Website URL', icon: Link2, category: 'text' },
  
  // Date & Time
  { value: 'date', label: 'Date', icon: Calendar, category: 'datetime' },
  { value: 'time', label: 'Time', icon: Clock, category: 'datetime' },
  { value: 'datetime', label: 'Date & Time', icon: Calendar, category: 'datetime' },
  { value: 'datetime_picker', label: 'Advanced Date/Time', icon: CalendarClock, category: 'datetime' },
  
  // Choice fields
  { value: 'dropdown', label: 'Dropdown', icon: ListFilter, category: 'choice' },
  { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare, category: 'choice' },
  { value: 'radio', label: 'Multiple Choice', icon: CircleDot, category: 'choice' },
  { value: 'yes_no', label: 'Yes/No', icon: ToggleLeft, category: 'choice' },
  
  // Advanced
  { value: 'rating', label: 'Rating (1-5)', icon: Star, category: 'advanced' },
  { value: 'star_rating', label: 'Star Rating', icon: Star, category: 'advanced' },
  { value: 'scale', label: 'Linear Scale', icon: Hash, category: 'advanced' },
  { value: 'file', label: 'File Upload', icon: Upload, category: 'advanced' },
  { value: 'address', label: 'Address', icon: MapPin, category: 'advanced' },
  
  // Layout
  { value: 'heading', label: 'Section Heading', icon: Heading, category: 'layout' },
  { value: 'paragraph', label: 'Paragraph Text', icon: AlignLeft, category: 'layout' },
  { value: 'divider', label: 'Divider', icon: SeparatorHorizontal, category: 'layout' },
  { value: 'image', label: 'Image', icon: Image, category: 'layout' },
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
    allow_multiple_submissions: true,
    // Scheduling
    start_date: '',
    end_date: '',
    // Multi-page
    total_pages: 1,
    // Payment
    requires_payment: false,
    payment_amount: 0,
    payment_currency: 'NGN',
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
        allow_multiple_submissions: form.allow_multiple_submissions,
        start_date: form.start_date ? new Date(form.start_date).toISOString().slice(0, 16) : '',
        end_date: form.end_date ? new Date(form.end_date).toISOString().slice(0, 16) : '',
        total_pages: form.total_pages || 1,
        requires_payment: form.requires_payment || false,
        payment_amount: form.payment_amount || 0,
        payment_currency: form.payment_currency || 'NGN',
      });
    }
  }, [form]);

  const handleSaveSettings = async () => {
    if (!formId) return;
    await updateForm.mutateAsync({
      id: formId,
      ...formSettings,
      custom_slug: formSettings.custom_slug || null,
      start_date: formSettings.start_date ? new Date(formSettings.start_date).toISOString() : null,
      end_date: formSettings.end_date ? new Date(formSettings.end_date).toISOString() : null,
    });
  };

  const handleAddField = async (fieldType: string) => {
    if (!formId) return;
    
    // Determine which page to add to (current max page or 1)
    const currentPage = fields?.length ? Math.max(...fields.map(f => f.page_number || 1)) : 1;
    
    const newField = await createField.mutateAsync({
      form_id: formId,
      field_type: fieldType,
      label: `New ${FIELD_TYPES.find(t => t.value === fieldType)?.label || 'Field'}`,
      is_required: false,
      display_order: (fields?.length || 0) + 1,
      page_number: currentPage,
      description: null,
      placeholder: null,
      options: ['dropdown', 'checkbox', 'radio'].includes(fieldType) ? ['Option 1', 'Option 2'] : null,
      validation_rules: null,
      conditional_logic: null,
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

          <TabsContent value="fields" className="space-y-6 mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Fields List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Form Fields</h3>
                  <Button onClick={() => setIsAddFieldOpen(true)} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Field
                  </Button>
                </div>

                {fields && fields.length > 0 ? (
                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const fieldType = FIELD_TYPES.find(t => t.value === field.field_type);
                      const Icon = fieldType?.icon || Type;
                      
                      return (
                        <Card 
                          key={field.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedField?.id === field.id 
                              ? 'ring-2 ring-primary shadow-md' 
                              : ''
                          }`}
                          onClick={() => setSelectedField(field)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="text-xs font-medium w-5">{index + 1}</span>
                                <GripVertical className="h-4 w-4 cursor-grab" />
                              </div>
                              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{field.label}</p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {fieldType?.label || field.field_type}
                                </p>
                              </div>
                              {field.is_required && (
                                <Badge variant="secondary" className="text-xs">Required</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteField(field.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">No fields yet. Add your first field to get started.</p>
                      <Button onClick={() => setIsAddFieldOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Field
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Field Editor */}
              <div className="lg:col-span-1">
                {selectedField ? (
                  <Card className="sticky top-6 shadow-sm">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Edit Field
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-5">
                      <div className="space-y-2">
                        <Label className="text-sm">Label</Label>
                        <Input
                          value={selectedField.label}
                          onChange={(e) => handleUpdateField({ label: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Description (optional)</Label>
                        <Textarea
                          value={selectedField.description || ''}
                          onChange={(e) => handleUpdateField({ description: e.target.value || null })}
                          placeholder="Help text for this field"
                          className="resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Placeholder</Label>
                        <Input
                          value={selectedField.placeholder || ''}
                          onChange={(e) => handleUpdateField({ placeholder: e.target.value || null })}
                          placeholder="Placeholder text"
                        />
                      </div>

                      {['dropdown', 'checkbox', 'radio'].includes(selectedField.field_type) && (
                        <div className="space-y-2">
                          <Label className="text-sm">Options (one per line)</Label>
                          <Textarea
                            value={(selectedField.options as string[] || []).join('\n')}
                            onChange={(e) => {
                              const options = e.target.value.split('\n').filter(o => o.trim());
                              handleUpdateField({ options: options.length > 0 ? options : null });
                            }}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={4}
                            className="resize-none font-mono text-sm"
                          />
                        </div>
                      )}

                      {/* Page Number for multi-page forms */}
                      {formSettings.total_pages > 1 && (
                        <div className="space-y-2">
                          <Label className="text-sm">Page</Label>
                          <Select
                            value={String(selectedField.page_number || 1)}
                            onValueChange={(value) => handleUpdateField({ page_number: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: formSettings.total_pages }, (_, i) => i + 1).map((page) => (
                                <SelectItem key={page} value={String(page)}>
                                  Page {page}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <Label htmlFor="required" className="text-sm">Required</Label>
                          <p className="text-xs text-muted-foreground">Make this field mandatory</p>
                        </div>
                        <Switch
                          id="required"
                          checked={selectedField.is_required}
                          onCheckedChange={(checked) => handleUpdateField({ is_required: checked })}
                        />
                      </div>

                      {/* Conditional Logic */}
                      <div className="pt-2 border-t">
                        <ConditionalLogicEditor
                          value={selectedField.conditional_logic as ConditionalLogic | null}
                          onChange={(logic) => handleUpdateField({ conditional_logic: logic as any })}
                          availableFields={fields || []}
                          currentFieldId={selectedField.id}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Select a field to edit its properties
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle>Form Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm">Title</Label>
                    <Input
                      value={formSettings.title}
                      onChange={(e) => setFormSettings({ ...formSettings, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm">Description</Label>
                    <Textarea
                      value={formSettings.description}
                      onChange={(e) => setFormSettings({ ...formSettings, description: e.target.value })}
                      placeholder="Describe your form..."
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm">Custom URL Slug (optional)</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground text-sm whitespace-nowrap">{window.location.origin}/f/</span>
                      <Input
                        value={formSettings.custom_slug}
                        onChange={(e) => setFormSettings({ ...formSettings, custom_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        placeholder="my-form"
                        className="flex-1 bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm">Confirmation Message</Label>
                    <Textarea
                      value={formSettings.confirmation_message}
                      onChange={(e) => setFormSettings({ ...formSettings, confirmation_message: e.target.value })}
                      placeholder="Thank you for your response!"
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Scheduling */}
                <div className="space-y-4 pt-6 border-t">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Form Scheduling
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Start Date (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={formSettings.start_date}
                        onChange={(e) => setFormSettings({ ...formSettings, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">End Date (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={formSettings.end_date}
                        onChange={(e) => setFormSettings({ ...formSettings, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-page */}
                <div className="space-y-4 pt-6 border-t">
                  <h4 className="text-sm font-medium">Multi-Page Form</h4>
                  <div className="space-y-2">
                    <Label className="text-sm">Number of Pages</Label>
                    <Select
                      value={String(formSettings.total_pages)}
                      onValueChange={(value) => setFormSettings({ ...formSettings, total_pages: parseInt(value) })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {num} {num === 1 ? 'Page' : 'Pages'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Set page numbers for each field in the Fields tab</p>
                  </div>
                </div>

                {/* Payment */}
                <div className="space-y-4 pt-6 border-t">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Collection
                  </h4>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-sm">Require Payment</Label>
                      <p className="text-xs text-muted-foreground">Collect payment before submission</p>
                    </div>
                    <Switch
                      checked={formSettings.requires_payment}
                      onCheckedChange={(checked) => setFormSettings({ ...formSettings, requires_payment: checked })}
                    />
                  </div>
                  {formSettings.requires_payment && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm">Amount</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formSettings.payment_amount}
                          onChange={(e) => setFormSettings({ ...formSettings, payment_amount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Currency</Label>
                        <Select
                          value={formSettings.payment_currency}
                          onValueChange={(value) => setFormSettings({ ...formSettings, payment_currency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NGN">NGN - Naira</SelectItem>
                            <SelectItem value="USD">USD - Dollar</SelectItem>
                            <SelectItem value="GBP">GBP - Pound</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Status */}
                <div className="space-y-4 pt-6 border-t">
                  <h4 className="text-sm font-medium">Form Status</h4>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-sm">Form Active</Label>
                      <p className="text-xs text-muted-foreground">Make this form publicly accessible</p>
                    </div>
                    <Switch
                      checked={formSettings.is_active}
                      onCheckedChange={(checked) => setFormSettings({ ...formSettings, is_active: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-sm">Accepting Responses</Label>
                      <p className="text-xs text-muted-foreground">Allow new responses to be submitted</p>
                    </div>
                    <Switch
                      checked={formSettings.is_accepting_responses}
                      onCheckedChange={(checked) => setFormSettings({ ...formSettings, is_accepting_responses: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-sm">Allow Multiple Submissions</Label>
                      <p className="text-xs text-muted-foreground">Let users submit multiple times with same email</p>
                    </div>
                    <Switch
                      checked={formSettings.allow_multiple_submissions}
                      onCheckedChange={(checked) => setFormSettings({ ...formSettings, allow_multiple_submissions: checked })}
                    />
                  </div>
                </div>

                {/* Embed Code */}
                <div className="space-y-4 pt-6 border-t">
                  <h4 className="text-sm font-medium">Embed Form</h4>
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <p className="text-xs text-muted-foreground">Copy this code to embed the form on your website:</p>
                    <div className="relative">
                      <pre className="text-xs bg-background p-3 rounded-lg border overflow-x-auto">
                        {`<iframe src="${window.location.origin}/embed/form/${form.id}" width="100%" height="600" frameborder="0"></iframe>`}
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 h-7 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(`<iframe src="${window.location.origin}/embed/form/${form.id}" width="100%" height="600" frameborder="0"></iframe>`);
                          toast({ title: 'Copied to clipboard' });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={updateForm.isPending} className="w-full h-11 gap-2">
                  <Save className="h-4 w-4" />
                  {updateForm.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Field Dialog */}
      <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Field</DialogTitle>
            <DialogDescription>Choose a field type to add to your form.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <div className="space-y-6 pr-4">
              {/* Text Inputs */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Text Inputs</h4>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.filter(t => t.category === 'text').map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant="outline"
                        className="h-auto py-3 px-4 flex items-center gap-3 justify-start hover:bg-primary/5 hover:border-primary/50 transition-colors"
                        onClick={() => handleAddField(type.value)}
                        disabled={createField.isPending}
                      >
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Date & Time</h4>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.filter(t => t.category === 'datetime').map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant="outline"
                        className="h-auto py-3 px-4 flex items-center gap-3 justify-start hover:bg-primary/5 hover:border-primary/50 transition-colors"
                        onClick={() => handleAddField(type.value)}
                        disabled={createField.isPending}
                      >
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Choice Fields */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Choice Fields</h4>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.filter(t => t.category === 'choice').map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant="outline"
                        className="h-auto py-3 px-4 flex items-center gap-3 justify-start hover:bg-primary/5 hover:border-primary/50 transition-colors"
                        onClick={() => handleAddField(type.value)}
                        disabled={createField.isPending}
                      >
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Advanced</h4>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.filter(t => t.category === 'advanced').map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant="outline"
                        className="h-auto py-3 px-4 flex items-center gap-3 justify-start hover:bg-primary/5 hover:border-primary/50 transition-colors"
                        onClick={() => handleAddField(type.value)}
                        disabled={createField.isPending}
                      >
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Layout */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Layout</h4>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.filter(t => t.category === 'layout').map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant="outline"
                        className="h-auto py-3 px-4 flex items-center gap-3 justify-start hover:bg-primary/5 hover:border-primary/50 transition-colors"
                        onClick={() => handleAddField(type.value)}
                        disabled={createField.isPending}
                      >
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FormBuilder;
