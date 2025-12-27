import React, { useState } from 'react';
import { useCampaignUpdates, useCreateCampaignUpdate, useDeleteCampaignUpdate, CampaignUpdate } from '@/hooks/useCampaignUpdates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Megaphone, Trash2, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface CampaignUpdatesManagerProps {
  campaignId: string;
  isOwner: boolean;
}

const CampaignUpdatesManager: React.FC<CampaignUpdatesManagerProps> = ({ 
  campaignId, 
  isOwner 
}) => {
  const { data: updates, isLoading } = useCampaignUpdates(campaignId);
  const createUpdate = useCreateCampaignUpdate();
  const deleteUpdate = useDeleteCampaignUpdate();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<CampaignUpdate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUpdate.mutateAsync({
        campaign_id: campaignId,
        title: formData.title,
        content: formData.content,
        image_url: formData.image_url || undefined,
      });
      setDialogOpen(false);
      setFormData({ title: '', content: '', image_url: '' });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!updateToDelete) return;
    try {
      await deleteUpdate.mutateAsync({ 
        id: updateToDelete.id, 
        campaignId 
      });
      setDeleteDialogOpen(false);
      setUpdateToDelete(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Campaign Updates</h3>
        {isOwner && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Post Update
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Post Campaign Update</DialogTitle>
                  <DialogDescription>
                    Share progress with your donors. They'll receive a notification.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="update-title">Title *</Label>
                    <Input
                      id="update-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., We've reached 50% of our goal!"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="update-content">Content *</Label>
                    <Textarea
                      id="update-content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Share your progress, thank donors, or provide news..."
                      rows={5}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="update-image">Image URL (optional)</Label>
                    <Input
                      id="update-image"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createUpdate.isPending}>
                    {createUpdate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Post Update
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-5 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : updates && updates.length > 0 ? (
        <div className="space-y-4">
          {updates.map(update => (
            <Card key={update.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{update.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(update.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setUpdateToDelete(update);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {update.image_url && (
                  <img 
                    src={update.image_url} 
                    alt={update.title}
                    className="w-full h-48 object-cover rounded-lg mt-4"
                  />
                )}
                
                <p className="text-muted-foreground mt-3 whitespace-pre-wrap">
                  {update.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Megaphone className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {isOwner 
                ? "No updates yet. Keep your donors informed about your progress!" 
                : "No updates posted yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this update? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CampaignUpdatesManager;
