import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ImageUpload } from '@/components/ui/image-upload';
import { 
  useContestCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  useReorderCategories,
  ContestCategory 
} from '@/hooks/useContestCategories';
import { useCreateContestant } from '@/hooks/useOrganization';
import { useContestants } from '@/hooks/useContests';
import { FolderPlus, Pencil, Trash2, GripVertical, Layers, ChevronDown, ChevronRight, UserPlus, Users } from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// Sortable category item component
interface SortableCategoryItemProps {
  category: ContestCategory;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  categoryContestants: any[];
  onEdit: (category: ContestCategory) => void;
  onDelete: (category: ContestCategory) => void;
  onAddContestant: (categoryId: string) => void;
}

const SortableCategoryItem: React.FC<SortableCategoryItemProps> = ({
  category,
  isExpanded,
  onToggleExpanded,
  categoryContestants,
  onEdit,
  onDelete,
  onAddContestant,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-3 flex-1 text-left" onClick={onToggleExpanded}>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                  </div>
                </button>
              </CollapsibleTrigger>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {categoryContestants.length}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onAddContestant(category.id);
                }}
              >
                <UserPlus className="mr-1 h-3 w-3" />
                Add Contestant
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(category)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <CollapsibleContent>
            <div className="border-t px-3 py-2 bg-muted/30">
              {categoryContestants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No contestants in this category yet
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 py-2">
                  {categoryContestants.map((contestant: any) => (
                    <div 
                      key={contestant.id} 
                      className="flex items-center gap-2 p-2 bg-background rounded border"
                    >
                      {contestant.photo_url ? (
                        <img 
                          src={contestant.photo_url} 
                          alt={contestant.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{contestant.name}</p>
                        <p className="text-xs text-muted-foreground">{contestant.vote_count} votes</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
};

interface CategoryManagerProps {
  contestId: string;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ contestId }) => {
  const { data: categories, isLoading } = useContestCategories(contestId);
  const { data: contestants } = useContestants(contestId);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();
  const createContestant = useCreateContestant();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ContestCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ContestCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Add contestant to category state
  const [addContestantCategoryId, setAddContestantCategoryId] = useState<string | null>(null);
  const [newContestant, setNewContestant] = useState({
    name: '',
    bio: '',
    photo_url: '',
    performance: '',
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  });

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const getContestantsForCategory = (categoryId: string) => {
    return contestants?.filter((c: any) => c.category_id === categoryId) || [];
  };

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

  const handleAddContestant = async () => {
    if (!addContestantCategoryId || !newContestant.name.trim()) return;
    
    await createContestant.mutateAsync({
      contest_id: contestId,
      name: newContestant.name.trim(),
      bio: newContestant.bio.trim() || undefined,
      photo_url: newContestant.photo_url || undefined,
      performance: newContestant.performance.trim() || undefined,
      category_id: addContestantCategoryId,
    });
    
    setAddContestantCategoryId(null);
    setNewContestant({ name: '', bio: '', photo_url: '', performance: '' });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && categories) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);
      
      const reordered = arrayMove(categories, oldIndex, newIndex);
      const updates = reordered.map((cat, index) => ({
        id: cat.id,
        display_order: index + 1,
      }));
      
      reorderCategories.mutate({ contest_id: contestId, updates });
    }
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {categories.map((category) => (
                  <SortableCategoryItem
                    key={category.id}
                    category={category}
                    isExpanded={expandedCategories.has(category.id)}
                    onToggleExpanded={() => toggleExpanded(category.id)}
                    categoryContestants={getContestantsForCategory(category.id)}
                    onEdit={handleEdit}
                    onDelete={confirmDelete}
                    onAddContestant={setAddContestantCategoryId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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

      {/* Add Contestant to Category Dialog */}
      <Dialog open={!!addContestantCategoryId} onOpenChange={(open) => !open && setAddContestantCategoryId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contestant to Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contestant Name *</Label>
              <Input
                placeholder="Enter contestant name"
                value={newContestant.name}
                onChange={(e) => setNewContestant(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Bio (optional)</Label>
              <Textarea
                placeholder="Brief bio or description..."
                value={newContestant.bio}
                onChange={(e) => setNewContestant(prev => ({ ...prev, bio: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Performance/Entry (optional)</Label>
              <Input
                placeholder="e.g., Song title, video link, etc."
                value={newContestant.performance}
                onChange={(e) => setNewContestant(prev => ({ ...prev, performance: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Photo</Label>
              <ImageUpload
                value={newContestant.photo_url}
                onChange={(url) => setNewContestant(prev => ({ ...prev, photo_url: url }))}
                bucket="contestant-images"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddContestantCategoryId(null)}>Cancel</Button>
            <Button 
              onClick={handleAddContestant} 
              disabled={createContestant.isPending || !newContestant.name.trim()}
            >
              {createContestant.isPending ? 'Adding...' : 'Add Contestant'}
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
