import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Calendar, Eye, Trash2, MoreHorizontal, Copy, ExternalLink, Search } from 'lucide-react';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useOrganizationNominations, useDeleteNomination } from '@/hooks/useNominations';
import { toast } from 'sonner';

export default function ManageNominations() {
  const navigate = useNavigate();
  const { data: nominations, isLoading } = useOrganizationNominations();
  const deleteNomination = useDeleteNomination();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter nominations based on search
  const filteredNominations = useMemo(() => {
    if (!nominations) return [];
    if (!searchQuery.trim()) return nominations;
    const query = searchQuery.toLowerCase();
    return nominations.filter((nom) =>
      nom.title.toLowerCase().includes(query) ||
      (nom.description && nom.description.toLowerCase().includes(query))
    );
  }, [nominations, searchQuery]);

  const getStatus = (startDate: string, endDate: string, isActive: boolean) => {
    if (!isActive) return { label: 'Inactive', variant: 'secondary' as const };
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return { label: 'Upcoming', variant: 'outline' as const };
    if (now > end) return { label: 'Ended', variant: 'secondary' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteNomination.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const copyPublicLink = (id: string) => {
    const url = `${window.location.origin}/nominations/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Public link copied to clipboard!');
  };

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nominations</h1>
            <p className="text-muted-foreground">Create and manage nomination forms</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search nominations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => navigate('/org/nominations/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Nomination
            </Button>
          </div>
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
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNominations && filteredNominations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNominations.map((nomination) => {
              const status = getStatus(nomination.start_date, nomination.end_date, nomination.is_active);
              return (
                <Card key={nomination.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="line-clamp-1">{nomination.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {nomination.description || 'No description'}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/org/nominations/${nomination.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View & Manage
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/nominations/${nomination.id}`, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Public Page
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyPublicLink(nomination.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Public Link
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteId(nomination.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(nomination.start_date), 'MMM d, yyyy')} - {format(new Date(nomination.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => navigate(`/org/nominations/${nomination.id}`)}
                      >
                        Manage
                      </Button>
                      <Button 
                        variant="secondary" 
                        className="flex-1"
                        onClick={() => window.open(`/nominations/${nomination.id}`, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Public Page
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : nominations && nominations.length > 0 && searchQuery ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                No nominations match "{searchQuery}"
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Nominations Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first nomination to start collecting submissions.
              </p>
              <Button onClick={() => navigate('/org/nominations/create')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Nomination
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Nomination?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this nomination and all its categories and submissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OrganizationLayout>
  );
}
