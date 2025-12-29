import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  useContestCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  ContestCategory 
} from '@/hooks/useContestCategories';
import { FolderPlus, Pencil, Trash2, GripVertical, Layers } from 'lucide-react';

interface CategoryManagerProps {
  contestId: string;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ contestId }) => {
  const { data: categories, isLoading } = useContestCategories(contestId);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ContestCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ContestCategory | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  });

  const handleCreate = async () => {
    if (!newCategory.name.trim()) return;
    
    await createCategory.mutateAsync({
      contest_id: contestId,
      name: newCategory.name.trim(),
      description: newCategory.description.trim() || undefined,
      display_order: (categories?.length || 0) + 1,
    });
    
    setIsAddOpen(false);
    setNewCategory({ name: '', description: '' });
  };

  const handleEdit = (category: ContestCategory) => {
    setEditingCategory({ ...category });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    
    await updateCategory.mutateAsync({
      id: editingCategory.id,
      contest_id: contestId,
      name: editingCategory.name.trim(),
      description: editingCategory.description?.trim() || undefined,
    });
    
    setIsEditOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    await deleteCategory.mutateAsync({
      id: categoryToDelete.id,
      contest_id: contestId,
    });
    
    setIsDeleteOpen(false);
    setCategoryToDelete(null);
  };

  const confirmDelete = (category: ContestCategory) => {
    setCategoryToDelete(category);
    setIsDeleteOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Award Categories
            </CardTitle>
            <CardDescription>
              Organize contestants into categories (e.g., Best Artist, Best Music Video)
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category Name *</Label>
                  <Input
                    placeholder="e.g., Best Artist of the Year"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Brief description of this category..."
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createCategory.isPending || !newCategory.name.trim()}>
                  {createCategory.isPending ? 'Creating...' : 'Create Category'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {(!categories || categories.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No categories yet</p>
            <p className="text-sm">Categories are optional. Add them to organize contestants into award groups.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => confirmDelete(category)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updateCategory.isPending}>
              {updateCategory.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? 
              Contestants in this category will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
