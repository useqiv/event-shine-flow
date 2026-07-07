import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Plus, FileText, MoreVertical, Trash2, Copy, ExternalLink, Settings, LayoutTemplate } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserForms, useCreateForm, useDeleteForm, useDuplicateForm } from '@/hooks/useForms';
import FormTemplateSelector from '@/components/forms/FormTemplateSelector';
import { isPollForm } from '@/lib/formHelpers';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getFormShareUrl } from '@/lib/urlHelpers';

const Forms = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: forms, isLoading } = useUserForms();
  const createForm = useCreateForm();
  const deleteForm = useDeleteForm();
  const duplicateForm = useDuplicateForm();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createTab, setCreateTab] = useState<'blank' | 'template'>('blank');
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');

  const handleCreateForm = async () => {
    if (!newFormTitle.trim()) return;

    const form = await createForm.mutateAsync({
      title: newFormTitle,
      description: newFormDescription,
    });

    setIsCreateDialogOpen(false);
    setNewFormTitle('');
    setNewFormDescription('');
    navigate(`/forms/${form.id}/edit`);
  };

  const handleCopyLink = (form: { id: string; custom_slug?: string | null }) => {
    const url = getFormShareUrl(form.custom_slug || form.id, true);
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied to clipboard' });
  };

  const handleDeleteForm = async (formId: string) => {
    if (confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      await deleteForm.mutateAsync(formId);
    }
  };

  const handleDuplicateForm = async (formId: string) => {
    const newForm = await duplicateForm.mutateAsync(formId);
    navigate(`/forms/${newForm.id}/edit`);
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>My Forms | USEQIV</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Forms</h1>
            <p className="text-muted-foreground">Create and manage your forms</p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Form</DialogTitle>
                <DialogDescription>
                  Start from scratch or choose a template.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={createTab} onValueChange={(v) => setCreateTab(v as 'blank' | 'template')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="blank">
                    <FileText className="h-4 w-4 mr-2" />
                    Blank Form
                  </TabsTrigger>
                  <TabsTrigger value="template">
                    <LayoutTemplate className="h-4 w-4 mr-2" />
                    Use Template
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="blank" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Form Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Customer Feedback Survey"
                      value={newFormTitle}
                      onChange={(e) => setNewFormTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Briefly describe your form..."
                      value={newFormDescription}
                      onChange={(e) => setNewFormDescription(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateForm} disabled={!newFormTitle.trim() || createForm.isPending}>
                      {createForm.isPending ? 'Creating...' : 'Create Form'}
                    </Button>
                  </DialogFooter>
                </TabsContent>
                
                <TabsContent value="template" className="mt-4">
                  <FormTemplateSelector onClose={() => setIsCreateDialogOpen(false)} />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : forms && forms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card key={form.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{form.title}</CardTitle>
                      <CardDescription className="text-sm">
                        Created {format(new Date(form.created_at), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}/edit`)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Form
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyLink(form)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/f/${form.id}`} target="_blank">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Preview
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateForm(form.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteForm(form.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isPollForm(form) && (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                        Poll
                      </Badge>
                    )}
                    {isPollForm(form) ? (
                      <Badge
                        variant="outline"
                        className={
                          form.approval_status === 'approved'
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : form.approval_status === 'rejected'
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                        }
                      >
                        {form.approval_status === 'approved'
                          ? 'Approved'
                          : form.approval_status === 'rejected'
                            ? 'Rejected'
                            : 'Pending Approval'}
                      </Badge>
                    ) : (
                      <Badge variant={form.is_active ? 'default' : 'secondary'}>
                        {form.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                    <Badge variant={form.is_accepting_responses ? 'outline' : 'secondary'}>
                      {form.is_accepting_responses ? 'Accepting Responses' : 'Closed'}
                    </Badge>
                  </div>
                  {form.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {form.description}
                    </p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/forms/${form.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/forms/${form.id}/responses`)}
                    >
                      Responses
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first form to start collecting responses.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Forms;
