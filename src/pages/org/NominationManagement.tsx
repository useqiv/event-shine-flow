import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, Plus, Trash2, Edit2, Copy, ExternalLink, 
  Calendar, Users, ChevronDown, ChevronRight, Download, Link as LinkIcon
} from 'lucide-react';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CustomSlugInput, validateCustomSlug } from '@/components/ui/custom-slug-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useNomination,
  useUpdateNomination,
  useNominationCategories,
  useCreateNominationCategory,
  useUpdateNominationCategory,
  useDeleteNominationCategory,
  useNominationSubmissions,
  useDeleteNominationSubmission,
  useNominationEmails,
} from '@/hooks/useNominations';
import { toast } from 'sonner';

function CategorySubmissions({ categoryId }: { categoryId: string }) {
  const { data: submissions, isLoading } = useNominationSubmissions(categoryId);
  const deleteSubmission = useDeleteNominationSubmission();
  const [viewMode, setViewMode] = useState<'ranked' | 'all'>('ranked');

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!submissions || submissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No submissions yet
      </p>
    );
  }

  // Aggregate nominees by name and count
  const nomineeRankings = submissions.reduce((acc, submission) => {
    const name = submission.nominee_name.trim().toLowerCase();
    const displayName = submission.nominee_name.trim();
    if (!acc[name]) {
      acc[name] = { displayName, count: 0, submissions: [] };
    }
    acc[name].count += 1;
    acc[name].submissions.push(submission);
    return acc;
  }, {} as Record<string, { displayName: string; count: number; submissions: typeof submissions }>);

  // Sort by count descending
  const rankedNominees = Object.values(nomineeRankings).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {submissions.length} nomination{submissions.length !== 1 ? 's' : ''} • {rankedNominees.length} unique nominee{rankedNominees.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'ranked' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('ranked')}
          >
            Ranked
          </Button>
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('all')}
          >
            All
          </Button>
        </div>
      </div>

      {viewMode === 'ranked' ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Nominee</TableHead>
              <TableHead className="text-right">Nominations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedNominees.map((nominee, index) => (
              <TableRow key={nominee.displayName}>
                <TableCell>
                  <Badge variant={index < 3 ? 'default' : 'secondary'}>
                    #{index + 1}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{nominee.displayName}</TableCell>
                <TableCell className="text-right font-bold">{nominee.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nominee</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="font-medium">{submission.nominee_name}</TableCell>
                <TableCell>
                  {submission.submitter_name || submission.submitter_email || 'Anonymous'}
                </TableCell>
                <TableCell>{format(new Date(submission.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSubmission.mutate({ id: submission.id, categoryId })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default function NominationManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: nomination, isLoading: nominationLoading } = useNomination(id!);
  const { data: categories, isLoading: categoriesLoading } = useNominationCategories(id!);
  const { data: nominatorEmails } = useNominationEmails(id!);
  const updateNomination = useUpdateNomination();
  const createCategory = useCreateNominationCategory();
  const updateCategory = useUpdateNominationCategory();
  const deleteCategory = useDeleteNominationCategory();

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editCategory, setEditCategory] = useState<{ id: string; name: string; description: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    await createCategory.mutateAsync({
      nomination_id: id!,
      name: newCategory.name,
      description: newCategory.description || undefined,
      display_order: (categories?.length || 0) + 1,
    });
    setNewCategory({ name: '', description: '' });
    setShowAddCategory(false);
  };

  const handleUpdateCategory = async () => {
    if (!editCategory) return;
    await updateCategory.mutateAsync({
      id: editCategory.id,
      name: editCategory.name,
      description: editCategory.description || undefined,
    });
    setEditCategory(null);
  };

  const handleDeleteCategory = async () => {
    if (deleteId) {
      await deleteCategory.mutateAsync({ id: deleteId, nominationId: id! });
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (isActive: boolean) => {
    await updateNomination.mutateAsync({ id: id!, is_active: isActive });
  };

  const copyPublicLink = () => {
    const slug = nomination?.custom_slug;
    const url = slug 
      ? `${window.location.origin}/n/${slug}`
      : `${window.location.origin}/nominations/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Public link copied to clipboard!');
  };

  const handleUpdateSlug = async (newSlug: string) => {
    const slugError = validateCustomSlug(newSlug);
    if (slugError) {
      toast.error(slugError);
      return;
    }
    await updateNomination.mutateAsync({ id: id!, custom_slug: newSlug || null });
  };

  const downloadNominatorEmails = () => {
    if (!nominatorEmails || nominatorEmails.length === 0) {
      toast.error('No nominator emails to download');
      return;
    }
    
    const content = nominatorEmails.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nominator-emails-${nomination?.title?.replace(/\s+/g, '-').toLowerCase() || id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${nominatorEmails.length} email(s)`);
  };

  if (nominationLoading) {
    return (
      <OrganizationLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </OrganizationLayout>
    );
  }

  if (!nomination) {
    return (
      <OrganizationLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nomination not found</p>
          <Button className="mt-4" onClick={() => navigate('/org/nominations')}>
            Back to Nominations
          </Button>
        </div>
      </OrganizationLayout>
    );
  }

  const getStatus = () => {
    if (!nomination.is_active) return { label: 'Inactive', variant: 'secondary' as const };
    const now = new Date();
    const start = new Date(nomination.start_date);
    const end = new Date(nomination.end_date);
    
    if (now < start) return { label: 'Upcoming', variant: 'outline' as const };
    if (now > end) return { label: 'Ended', variant: 'secondary' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  const status = getStatus();

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/org/nominations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {nomination.logo_url && (
                <img 
                  src={nomination.logo_url} 
                  alt="Logo" 
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold">{nomination.title}</h1>
                <p className="text-muted-foreground">{nomination.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(nomination.start_date), 'MMM d, yyyy')} - {format(new Date(nomination.end_date), 'MMM d, yyyy')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Categories</span>
              </div>
              <p className="text-2xl font-bold">{categories?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="active-toggle">Active</Label>
                  <Switch
                    id="active-toggle"
                    checked={nomination.is_active}
                    onCheckedChange={handleToggleActive}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Custom URL
            </CardTitle>
            <CardDescription>Set a custom URL for this nomination</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomSlugInput
              value={nomination.custom_slug || ''}
              onChange={handleUpdateSlug}
              entityType="nomination"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyPublicLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Public Link
          </Button>
          <Button variant="outline" onClick={() => {
            const slug = nomination?.custom_slug;
            const url = slug ? `/n/${slug}` : `/nominations/${id}`;
            window.open(url, '_blank');
          }}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Public Form
          </Button>
          <Button 
            variant="outline" 
            onClick={downloadNominatorEmails}
            disabled={!nominatorEmails || nominatorEmails.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Emails ({nominatorEmails?.length || 0})
          </Button>
        </div>

        {/* Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>
                  Add categories for people to submit nominations
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddCategory(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((category) => (
                  <Collapsible
                    key={category.id}
                    open={expandedCategories.has(category.id)}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            {expandedCategories.has(category.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <div>
                              <p className="font-medium">{category.name}</p>
                              {category.description && (
                                <p className="text-sm text-muted-foreground">{category.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditCategory({
                                  id: category.id,
                                  name: category.name,
                                  description: category.description || '',
                                });
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(category.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t px-4 py-2">
                          <CategorySubmissions categoryId={category.id} />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No categories yet</p>
                <Button onClick={() => setShowAddCategory(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Category
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new nomination category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g., Best Performance"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this category is for..."
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Adding...' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={editCategory?.name || ''}
                onChange={(e) => setEditCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={editCategory?.description || ''}
                onChange={(e) => setEditCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCategory(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={updateCategory.isPending}>
              {updateCategory.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category and all its submissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OrganizationLayout>
  );
}
