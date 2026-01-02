import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';
import { CSVImport, ContestantCSVRow } from '@/components/ui/csv-import';
import { ShareButtons } from '@/components/ui/share-buttons';
import { SortableContestantCard } from '@/components/org/SortableContestantCard';
import { FraudAlertsCard } from '@/components/org/FraudAlertsCard';
import EntityTransactionHistory from '@/components/org/EntityTransactionHistory';
import { ShareCardGenerator } from '@/components/org/ShareCardGenerator';
import { ContestBrandingForm } from '@/components/org/ContestBrandingForm';
import { BrandingPreview } from '@/components/org/BrandingPreview';
import { CategoryManager } from '@/components/org/CategoryManager';
import { useContestCategories } from '@/hooks/useContestCategories';

import { useContest, useContestants } from '@/hooks/useContests';
import { useUpdateContest, useCreateContestant, useUpdateContestant, useDeleteContestant, useBulkDeleteContestants, useReorderContestants } from '@/hooks/useOrganization';
import { useRealtimeContestants, useRealtimeContest } from '@/hooks/useRealtimeContestants';
import CurrencySelector, { formatCurrency, getCurrencySymbol } from '@/components/ui/currency-selector';
import EventPayoutRequest from '@/components/org/EventPayoutRequest';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
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
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Trophy, Users, Vote, PlusCircle, BarChart3, Download, ArrowLeft, Edit, Copy, Link as LinkIcon, Save, FileSpreadsheet, Share2, Pencil, Camera, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, Filter, TrendingUp, Award, PieChart, Info, DollarSign, Megaphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { exportToCsv, formatDateForExport } from '@/lib/exportCsv';

const categories = [
  'Music', 'Beauty', 'Fashion', 'Sports', 'Talent',
  'Dance', 'Photography', 'Art', 'Tech', 'Other'
];


const ContestManagement = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: contest, isLoading } = useContest(id || '');
  const { data: contestants, isLoading: contestantsLoading } = useContestants(id || '');
  const { data: contestCategories } = useContestCategories(id || '');
  const updateContest = useUpdateContest();
  const createContestant = useCreateContestant();
  const updateContestant = useUpdateContestant();
  const deleteContestant = useDeleteContestant();
  const bulkDeleteContestants = useBulkDeleteContestants();
  const reorderContestants = useReorderContestants();

  // Enable real-time updates
  useRealtimeContestants(id || '');
  useRealtimeContest(id || '');

  // Fetch commission rates
  const { data: orgApproval } = useQuery({
    queryKey: ['org-approval-commission-contest', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('organization_approvals')
        .select('vote_commission_rate, special_commission_rate')
        .eq('organization_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: platformSettings } = useQuery({
    queryKey: ['platform-commission-settings-contest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .eq('category', 'commission');
      if (error) throw error;
      const settings: Record<string, number> = {};
      data?.forEach((s: any) => {
        settings[s.setting_key] = Number(s.setting_value) || 0;
      });
      return settings;
    },
  });

  const platformVoteCommission = platformSettings?.vote_commission_percentage || platformSettings?.platform_commission_percentage || 10;
  const voteCommission = orgApproval?.vote_commission_rate ?? orgApproval?.special_commission_rate ?? platformVoteCommission;

  // Calculate revenue with commission
  const totalRevenue = contest ? contest.total_votes * Number(contest.vote_price) : 0;
  const netRevenue = totalRevenue * (1 - voteCommission / 100);

  const [isAddContestantOpen, setIsAddContestantOpen] = useState(false);
  const [isEditContestantOpen, setIsEditContestantOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [contestantToDelete, setContestantToDelete] = useState<any>(null);
  const [editingContestant, setEditingContestant] = useState<any>(null);
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedContestants, setSelectedContestants] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'votes-high' | 'votes-low' | 'name'>('order');
  const [minVotes, setMinVotes] = useState('');
  const [maxVotes, setMaxVotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [newContestant, setNewContestant] = useState({
    name: '',
    bio: '',
    photo_url: '',
    performance: '',
    category_id: '',
  });

  // Filter and sort contestants
  const filteredContestants = useMemo(() => {
    if (!contestants) return [];
    
    let filtered = [...contestants];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((c: any) => 
        c.name.toLowerCase().includes(query) ||
        (c.bio && c.bio.toLowerCase().includes(query))
      );
    }

    // Apply vote range filter
    const minV = minVotes ? parseInt(minVotes, 10) : null;
    const maxV = maxVotes ? parseInt(maxVotes, 10) : null;
    if (minV !== null && !isNaN(minV)) {
      filtered = filtered.filter((c: any) => c.vote_count >= minV);
    }
    if (maxV !== null && !isNaN(maxV)) {
      filtered = filtered.filter((c: any) => c.vote_count <= maxV);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'votes-high':
        filtered.sort((a: any, b: any) => b.vote_count - a.vote_count);
        break;
      case 'votes-low':
        filtered.sort((a: any, b: any) => a.vote_count - b.vote_count);
        break;
      case 'name':
        filtered.sort((a: any, b: any) => a.name.localeCompare(b.name));
        break;
      case 'order':
      default:
        filtered.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
        break;
    }
    
    return filtered;
  }, [contestants, searchQuery, sortBy, minVotes, maxVotes]);

  // Statistics for filtered contestants
  const filteredStats = useMemo(() => {
    if (filteredContestants.length === 0) {
      return { totalVotes: 0, averageVotes: 0, topPerformer: null };
    }
    const totalVotes = filteredContestants.reduce((sum: number, c: any) => sum + c.vote_count, 0);
    const averageVotes = totalVotes / filteredContestants.length;
    const topPerformer = filteredContestants.reduce((top: any, c: any) => 
      !top || c.vote_count > top.vote_count ? c : top, null);
    return { totalVotes, averageVotes, topPerformer };
  }, [filteredContestants]);

  // Chart data for vote distribution (top 10 contestants)
  const chartData = useMemo(() => {
    if (filteredContestants.length === 0) return [];
    const sorted = [...filteredContestants].sort((a: any, b: any) => b.vote_count - a.vote_count);
    return sorted.slice(0, 10).map((c: any) => ({
      name: c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name,
      fullName: c.name,
      votes: c.vote_count,
    }));
  }, [filteredContestants]);

  // Pagination
  const totalPages = Math.ceil(filteredContestants.length / pageSize);
  const paginatedContestants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContestants.slice(start, start + pageSize);
  }, [filteredContestants, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, minVotes, maxVotes, pageSize]);

  // For drag-and-drop, use the paginated list
  const sortedContestants = useMemo(() => {
    return paginatedContestants;
  }, [paginatedContestants]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Edit contest form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    image_url: '',
    start_date: '',
    end_date: '',
    vote_price: 100,
    vote_currency: 'NGN',
    custom_slug: '',
    brand_primary_color: '#7c3aed',
    brand_secondary_color: '#f97316',
    brand_logo_url: '',
    is_live_voting: false,
  });

  // Share card state
  const [shareCardContestant, setShareCardContestant] = useState<any>(null);

  // Initialize edit form when contest data loads
  useEffect(() => {
    if (contest) {
      setEditForm({
        title: contest.title || '',
        description: contest.description || '',
        category: contest.category || '',
        image_url: contest.image_url || '',
        start_date: contest.start_date ? new Date(contest.start_date).toISOString().slice(0, 16) : '',
        end_date: contest.end_date ? new Date(contest.end_date).toISOString().slice(0, 16) : '',
        vote_price: Number(contest.vote_price) || 100,
        vote_currency: contest.vote_currency || 'NGN',
        custom_slug: (contest as any).custom_slug || '',
        brand_primary_color: (contest as any).brand_primary_color || '#7c3aed',
        brand_secondary_color: (contest as any).brand_secondary_color || '#f97316',
        brand_logo_url: (contest as any).brand_logo_url || '',
        is_live_voting: (contest as any).is_live_voting || false,
      });
    }
  }, [contest]);

  const handleAddContestant = async () => {
    if (!id || !newContestant.name) return;
    
    // For category-based contests, require a category
    const isCategoryBased = (contest as any)?.contest_type === 'category';
    if (isCategoryBased && !newContestant.category_id) {
      toast.error('Please select a category for this contestant');
      return;
    }
    
    try {
      await createContestant.mutateAsync({
        contest_id: id,
        name: newContestant.name,
        bio: newContestant.bio,
        photo_url: newContestant.photo_url,
        performance: newContestant.performance,
        category_id: isCategoryBased ? newContestant.category_id : null,
      });
      setIsAddContestantOpen(false);
      setNewContestant({ name: '', bio: '', photo_url: '', performance: '', category_id: '' });
    } catch (error) {
      console.error('Failed to add contestant:', error);
    }
  };

  const handleEditContestant = (contestant: any) => {
    setEditingContestant({
      id: contestant.id,
      name: contestant.name,
      bio: contestant.bio || '',
      photo_url: contestant.photo_url || '',
      performance: contestant.performance || '',
      category_id: contestant.category_id || '',
    });
    setIsEditContestantOpen(true);
  };

  const handleSaveContestant = async () => {
    if (!editingContestant) return;
    
    // For category-based contests, require a category
    const isCategoryBased = (contest as any)?.contest_type === 'category';
    if (isCategoryBased && !editingContestant.category_id) {
      toast.error('Please select a category for this contestant');
      return;
    }
    
    try {
      await updateContestant.mutateAsync({
        id: editingContestant.id,
        name: editingContestant.name,
        bio: editingContestant.bio,
        photo_url: editingContestant.photo_url,
        performance: editingContestant.performance,
        category_id: isCategoryBased ? editingContestant.category_id : null,
      });
      setIsEditContestantOpen(false);
      setEditingContestant(null);
    } catch (error) {
      console.error('Failed to update contestant:', error);
    }
  };

  const handleDeleteContestant = async () => {
    if (!contestantToDelete) return;
    try {
      await deleteContestant.mutateAsync(contestantToDelete.id);
      setIsDeleteDialogOpen(false);
      setContestantToDelete(null);
      setSelectedContestants(prev => {
        const next = new Set(prev);
        next.delete(contestantToDelete.id);
        return next;
      });
    } catch (error) {
      console.error('Failed to delete contestant:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContestants.size === 0) return;
    try {
      await bulkDeleteContestants.mutateAsync(Array.from(selectedContestants));
      setIsBulkDeleteDialogOpen(false);
      setSelectedContestants(new Set());
    } catch (error) {
      console.error('Failed to bulk delete contestants:', error);
    }
  };

  const handleSelectContestant = (id: string, selected: boolean) => {
    setSelectedContestants(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && sortedContestants) {
      setSelectedContestants(new Set(sortedContestants.map((c: any) => c.id)));
    } else {
      setSelectedContestants(new Set());
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = sortedContestants.findIndex((c: any) => c.id === active.id);
    const newIndex = sortedContestants.findIndex((c: any) => c.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(sortedContestants, oldIndex, newIndex);
    const updates = newOrder.map((contestant: any, index: number) => ({
      id: contestant.id,
      display_order: index + 1,
    }));

    await reorderContestants.mutateAsync(updates);
  };

  const handleCSVImport = async (data: ContestantCSVRow[]) => {
    if (!id) return;
    setIsImporting(true);
    try {
      for (const contestant of data) {
        await createContestant.mutateAsync({
          contest_id: id,
          name: contestant.name,
          bio: contestant.bio || '',
          performance: contestant.performance || '',
          photo_url: '',
        });
      }
      toast.success(`Successfully imported ${data.length} contestant(s)`);
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyLink = () => {
    const url = (contest as any)?.custom_slug 
      ? `${window.location.origin}/${(contest as any).custom_slug}`
      : `${window.location.origin}/contests/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Contest link copied to clipboard!');
  };

  const handleCopyContestantLink = (contestantId: string, contestantName: string) => {
    const url = (contest as any)?.custom_slug 
      ? `${window.location.origin}/${(contest as any).custom_slug}?vote=${contestantId}`
      : `${window.location.origin}/contests/${id}?vote=${contestantId}`;
    navigator.clipboard.writeText(url);
    toast.success(`Link for ${contestantName} copied!`);
  };

  const handleToggleActive = async () => {
    if (!contest) return;
    await updateContest.mutateAsync({
      id: contest.id,
      is_active: !contest.is_active,
    });
  };

  const handleSaveContestDetails = async () => {
    if (!contest) {
      toast.error('Contest data not loaded. Please refresh the page.');
      return;
    }
    
    if (!editForm.title.trim()) {
      toast.error('Contest title is required');
      return;
    }
    
    try {
      await updateContest.mutateAsync({
        id: contest.id,
        title: editForm.title.trim(),
        description: editForm.description?.trim() || null,
        category: editForm.category,
        image_url: editForm.image_url || null,
        start_date: editForm.start_date ? new Date(editForm.start_date).toISOString() : contest.start_date,
        end_date: editForm.end_date ? new Date(editForm.end_date).toISOString() : contest.end_date,
        vote_price: Number(editForm.vote_price) || 100,
        vote_currency: editForm.vote_currency || 'NGN',
        custom_slug: editForm.custom_slug?.trim() || null,
        brand_primary_color: editForm.brand_primary_color || '#7c3aed',
        brand_secondary_color: editForm.brand_secondary_color || '#f97316',
        brand_logo_url: editForm.brand_logo_url || null,
        is_live_voting: editForm.is_live_voting,
      });
    } catch (error: any) {
      console.error('Failed to update contest:', error);
      toast.error(error?.message || 'Failed to update contest');
    }
  };

  const handleExportContestants = () => {
    if (!filteredContestants || filteredContestants.length === 0) {
      toast.error('No contestants to export');
      return;
    }

    const headers = [
      { key: 'rank', label: 'Rank' },
      { key: 'name', label: 'Name' },
      { key: 'bio', label: 'Bio' },
      { key: 'performance', label: 'Performance' },
      { key: 'vote_count', label: 'Votes' },
      { key: 'created_at', label: 'Added Date' },
    ];

    const exportData = filteredContestants.map((c: any, index: number) => ({
      rank: index + 1,
      name: c.name,
      bio: c.bio || '',
      performance: c.performance || '',
      vote_count: c.vote_count,
      created_at: formatDateForExport(c.created_at),
    }));

    const filterSuffix = searchQuery || minVotes || maxVotes ? '-filtered' : '';
    exportToCsv(exportData, `${contest?.title || 'contest'}-results${filterSuffix}-${format(new Date(), 'yyyy-MM-dd')}`, headers);
    toast.success(`Exported ${filteredContestants.length} contestants successfully`);
  };

  const handleExportLeaderboard = () => {
    if (!contestants || contestants.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      { key: 'rank', label: 'Rank' },
      { key: 'name', label: 'Contestant Name' },
      { key: 'vote_count', label: 'Total Votes' },
      { key: 'percentage', label: 'Vote Percentage' },
    ];

    const totalVotes = contestants.reduce((sum: number, c: any) => sum + c.vote_count, 0);
    
    const exportData = contestants.map((c: any, index: number) => ({
      rank: index + 1,
      name: c.name,
      vote_count: c.vote_count,
      percentage: totalVotes > 0 ? `${((c.vote_count / totalVotes) * 100).toFixed(2)}%` : '0%',
    }));

    exportToCsv(exportData, `${contest?.title || 'contest'}-leaderboard-${format(new Date(), 'yyyy-MM-dd')}`, headers);
    toast.success('Leaderboard exported successfully');
  };

  if (isLoading) {
    return (
      <OrganizationLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64" />
        </div>
      </OrganizationLayout>
    );
  }

  if (!contest) {
    return (
      <OrganizationLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Contest not found</p>
          <Link to="/org/contests">
            <Button variant="link">Back to Contests</Button>
          </Link>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Link to="/org/contests">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{contest.title}</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(contest.start_date), 'MMM d')} - {format(new Date(contest.end_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to={`/org/contests/${id}/analytics`}>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            </Link>
            <Link to={`/org/contests/${id}/marketing`}>
              <Button variant="outline" size="sm">
                <Megaphone className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Marketing</span>
              </Button>
            </Link>
            <ShareButtons
              title={contest.title}
              description={contest.description || `Vote now in ${contest.title}`}
              url={(contest as any)?.custom_slug 
                ? `${window.location.origin}/${(contest as any).custom_slug}`
                : `${window.location.origin}/contests/${id}`}
            />
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Copy Link</span>
            </Button>
            <Button
              size="sm"
              variant={contest.is_active ? "destructive" : "default"}
              onClick={handleToggleActive}
            >
              {contest.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Votes</p>
                  <p className="text-2xl font-bold">{contest.total_votes.toLocaleString()}</p>
                </div>
                <Vote className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contestants</p>
                  <p className="text-2xl font-bold">{contestants?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vote Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(Number(contest.vote_price), contest.vote_currency || 'NGN')}</p>
                </div>
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue, contest.vote_currency || 'NGN')}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-muted-foreground">Net Revenue</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {voteCommission}% commission deducted
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(netRevenue, contest.vote_currency || 'NGN')}
                  </p>
                  <div className="mt-2">
                    <EventPayoutRequest
                      mode="dialog"
                      netRevenue={netRevenue}
                      currency={contest.vote_currency || 'NGN'}
                      itemType="contest"
                      itemTitle={contest.title}
                      triggerLabel="Request payout"
                      triggerVariant="outline"
                      triggerSize="sm"
                      triggerClassName="w-full"
                    />
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="contestants" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="w-max sm:w-auto">
              <TabsTrigger value="contestants">Contestants</TabsTrigger>
              {(contest as any)?.contest_type === 'category' && (
                <TabsTrigger value="categories">Categories</TabsTrigger>
              )}
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="payout">Payout</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="contestants" className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Contestants ({contestants?.length || 0})</h2>
                  {sortedContestants.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedContestants.size === sortedContestants.length && sortedContestants.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm text-muted-foreground">Select all</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedContestants.size > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setIsBulkDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete ({selectedContestants.size})
                    </Button>
                  )}
                  {(contest as any)?.contest_type !== 'category' ? (
                    <>
                      <Button variant="outline" onClick={() => setIsCSVImportOpen(true)}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Import CSV
                      </Button>
                      <Dialog open={isAddContestantOpen} onOpenChange={setIsAddContestantOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Contestant
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Contestant</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Name *</Label>
                              <Input
                                placeholder="Contestant name"
                                value={newContestant.name}
                                onChange={(e) => setNewContestant(prev => ({ ...prev, name: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Bio</Label>
                              <Textarea
                                placeholder="Short bio..."
                                value={newContestant.bio}
                                onChange={(e) => setNewContestant(prev => ({ ...prev, bio: e.target.value }))}
                              />
                            </div>
                            <ImageUpload
                              bucket="contestant-images"
                              value={newContestant.photo_url}
                              onChange={(url) => setNewContestant(prev => ({ ...prev, photo_url: url }))}
                              label="Photo"
                            />
                            <div className="space-y-2">
                              <Label>Performance/Entry</Label>
                              <Input
                                placeholder="e.g., Song title, routine name"
                                value={newContestant.performance}
                                onChange={(e) => setNewContestant(prev => ({ ...prev, performance: e.target.value }))}
                              />
                            </div>
                            <Button onClick={handleAddContestant} className="w-full" disabled={createContestant.isPending}>
                              {createContestant.isPending ? 'Adding...' : 'Add Contestant'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground flex items-center">
                      Add contestants from the Categories tab
                    </p>
                  )}
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contestants..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="order">Custom Order</SelectItem>
                      <SelectItem value="votes-high">Votes: High to Low</SelectItem>
                      <SelectItem value="votes-low">Votes: Low to High</SelectItem>
                      <SelectItem value="name">Name: A to Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minVotes}
                    onChange={(e) => setMinVotes(e.target.value)}
                    className="w-20"
                    min="0"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxVotes}
                    onChange={(e) => setMaxVotes(e.target.value)}
                    className="w-20"
                    min="0"
                  />
                  <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                    <SelectTrigger className="w-[90px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="6">6 / page</SelectItem>
                      <SelectItem value="12">12 / page</SelectItem>
                      <SelectItem value="24">24 / page</SelectItem>
                      <SelectItem value="48">48 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {(searchQuery || minVotes || maxVotes) && (
                <p className="text-sm text-muted-foreground">
                  Showing {sortedContestants.length} of {filteredContestants.length} filtered ({contestants?.length || 0} total)
                </p>
              )}

              {/* Filtered Statistics Summary */}
              {filteredContestants.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Vote className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Votes (Filtered)</p>
                          <p className="text-xl font-bold">{filteredStats.totalVotes.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Average Votes</p>
                          <p className="text-xl font-bold">{filteredStats.averageVotes.toFixed(1)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Top Performer</p>
                          <p className="text-xl font-bold truncate max-w-[150px]" title={filteredStats.topPerformer?.name}>
                            {filteredStats.topPerformer?.name || 'N/A'}
                          </p>
                          {filteredStats.topPerformer && (
                            <p className="text-xs text-muted-foreground">{filteredStats.topPerformer.vote_count.toLocaleString()} votes</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Vote Distribution Chart */}
              {chartData.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Vote Distribution (Top 10)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                          <XAxis type="number" tickFormatter={(v) => v.toLocaleString()} />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={100} 
                            tick={{ fontSize: 12 }}
                          />
                          <RechartsTooltip 
                            formatter={(value: number) => [value.toLocaleString(), 'Votes']}
                            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.5)'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fraud Detection Alerts */}
              <FraudAlertsCard contestId={id || ''} />
            </div>

            <CSVImport
              open={isCSVImportOpen}
              onOpenChange={setIsCSVImportOpen}
              onImport={handleCSVImport}
              isImporting={isImporting}
            />

            {contestantsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : sortedContestants.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sortedContestants.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedContestants.map((contestant: any) => (
                      <SortableContestantCard
                        key={contestant.id}
                        contestant={contestant}
                        isSelected={selectedContestants.has(contestant.id)}
                        contestId={id || ''}
                        contestTitle={contest?.title || ''}
                        brandPrimaryColor={editForm.brand_primary_color}
                        customSlug={(contest as any)?.custom_slug}
                        onSelect={handleSelectContestant}
                        onEdit={handleEditContestant}
                        onDelete={(c) => {
                          setContestantToDelete(c);
                          setIsDeleteDialogOpen(true);
                        }}
                        onCopyLink={handleCopyContestantLink}
                        onShareCard={setShareCardContestant}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : filteredContestants.length === 0 && (searchQuery || minVotes || maxVotes) ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No contestants match your filters.</p>
                  <Button 
                    variant="link" 
                    onClick={() => { setSearchQuery(''); setMinVotes(''); setMaxVotes(''); }}
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No contestants yet. Add your first contestant to get started.</p>
                </CardContent>
              </Card>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {(contest as any)?.contest_type === 'category' && (
            <TabsContent value="categories" className="space-y-4">
              <CategoryManager contestId={id || ''} />
            </TabsContent>
          )}

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {editForm.brand_logo_url && (
                      <img 
                        src={editForm.brand_logo_url} 
                        alt="Contest Logo" 
                        className="h-8 object-contain"
                      />
                    )}
                    <CardTitle>Leaderboard</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportLeaderboard}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contestants && contestants.length > 0 ? (
                  <div className="space-y-2">
                    {contestants.map((contestant: any, index: number) => (
                      <div 
                        key={contestant.id} 
                        className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 transition-all"
                        style={index === 0 ? { 
                          borderLeft: `4px solid ${editForm.brand_primary_color}`,
                          backgroundColor: `${editForm.brand_primary_color}10`
                        } : undefined}
                      >
                        <span 
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                          style={{ 
                            backgroundColor: index === 0 ? editForm.brand_primary_color :
                                            index === 1 ? editForm.brand_secondary_color :
                                            index === 2 ? `${editForm.brand_primary_color}80` :
                                            'hsl(var(--muted-foreground))'
                          }}
                        >
                          {index + 1}
                        </span>
                        <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                          {contestant.photo_url ? (
                            <img src={contestant.photo_url} alt={contestant.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{contestant.name}</p>
                        </div>
                        <Badge 
                          variant="secondary"
                          style={index === 0 ? { 
                            backgroundColor: `${editForm.brand_primary_color}20`,
                            color: editForm.brand_primary_color,
                            borderColor: editForm.brand_primary_color
                          } : undefined}
                        >
                          {contestant.vote_count.toLocaleString()} votes
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No contestants to display</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <EntityTransactionHistory
              entityType="contest"
              entityId={id || ''}
              currency={contest.vote_currency || 'NGN'}
            />
          </TabsContent>

          <TabsContent value="payout" className="space-y-6">
            <EventPayoutRequest
              netRevenue={netRevenue}
              currency={contest.vote_currency || 'NGN'}
              itemType="contest"
              itemTitle={contest.title}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contest Details</CardTitle>
                <CardDescription>Update your contest information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Contest Title *</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category *</Label>
                    <Select
                      value={editForm.category}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-vote-price">Price per Vote ({getCurrencySymbol(editForm.vote_currency)}) *</Label>
                    <Input
                      id="edit-vote-price"
                      type="number"
                      min="1"
                      value={editForm.vote_price}
                      onChange={(e) => setEditForm(prev => ({ ...prev, vote_price: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Currency *</Label>
                    <CurrencySelector
                      value={editForm.vote_currency}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, vote_currency: value }))}
                    />
                  </div>
                </div>

                <ImageUpload
                  bucket="contest-images"
                  value={editForm.image_url}
                  onChange={(url) => setEditForm(prev => ({ ...prev, image_url: url }))}
                  label="Contest Banner Image"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Update contest dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start-date">Start Date *</Label>
                    <Input
                      id="edit-start-date"
                      type="datetime-local"
                      value={editForm.start_date}
                      onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-end-date">End Date *</Label>
                    <Input
                      id="edit-end-date"
                      type="datetime-local"
                      value={editForm.end_date}
                      onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Voting Display</CardTitle>
                <CardDescription>Control how votes are displayed to the public</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="live-voting">Live Voting (Real-time)</Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, vote counts update in real-time for all viewers. Disable to keep votes hidden until you choose to reveal them.
                    </p>
                  </div>
                  <Switch
                    id="live-voting"
                    checked={editForm.is_live_voting}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_live_voting: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Branding */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ContestBrandingForm
                values={{
                  custom_slug: editForm.custom_slug,
                  brand_primary_color: editForm.brand_primary_color,
                  brand_secondary_color: editForm.brand_secondary_color,
                  brand_logo_url: editForm.brand_logo_url,
                }}
                onChange={(field, value) => setEditForm(prev => ({ ...prev, [field]: value }))}
                contestId={id}
              />
              
              {/* Live Branding Preview */}
              <BrandingPreview
                contestTitle={editForm.title || contest.title}
                brandLogoUrl={editForm.brand_logo_url}
                primaryColor={editForm.brand_primary_color}
                secondaryColor={editForm.brand_secondary_color}
                contestants={contestants?.slice(0, 3).map((c: any) => ({
                  name: c.name,
                  photo_url: c.photo_url,
                  vote_count: c.vote_count,
                })) || []}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveContestDetails} disabled={updateContest.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateContest.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Share Card Generator */}
        {shareCardContestant && contest && (
          <ShareCardGenerator
            open={!!shareCardContestant}
            onOpenChange={(open) => !open && setShareCardContestant(null)}
            contestant={shareCardContestant}
            contest={{
              id: contest.id,
              title: contest.title,
              brand_primary_color: (contest as any).brand_primary_color,
              brand_logo_url: (contest as any).brand_logo_url,
              custom_slug: (contest as any).custom_slug,
            }}
          />
        )}

        {/* Edit Contestant Dialog */}
        <Dialog open={isEditContestantOpen} onOpenChange={setIsEditContestantOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Contestant</DialogTitle>
            </DialogHeader>
            {editingContestant && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="Contestant name"
                    value={editingContestant.name}
                    onChange={(e) => setEditingContestant((prev: any) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    placeholder="Short bio..."
                    value={editingContestant.bio}
                    onChange={(e) => setEditingContestant((prev: any) => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
                <ImageUpload
                  bucket="contestant-images"
                  value={editingContestant.photo_url}
                  onChange={(url) => setEditingContestant((prev: any) => ({ ...prev, photo_url: url }))}
                  label="Photo"
                />
                <div className="space-y-2">
                  <Label>Performance/Entry</Label>
                  <Input
                    placeholder="e.g., Song title, routine name"
                    value={editingContestant.performance}
                    onChange={(e) => setEditingContestant((prev: any) => ({ ...prev, performance: e.target.value }))}
                  />
                </div>
                {(contest as any)?.contest_type === 'category' && contestCategories && contestCategories.length > 0 && (
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={editingContestant.category_id || ''}
                      onValueChange={(value) => setEditingContestant((prev: any) => ({ ...prev, category_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {contestCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handleSaveContestant} className="w-full" disabled={updateContestant.isPending}>
                  {updateContestant.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contestant</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{contestantToDelete?.name}</strong>? 
                This action cannot be undone. All votes for this contestant will also be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setContestantToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteContestant}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteContestant.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedContestants.size} Contestant(s)</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedContestants.size} contestant(s)? 
                This action cannot be undone. All votes for these contestants will also be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {bulkDeleteContestants.isPending ? 'Deleting...' : `Delete ${selectedContestants.size} Contestant(s)`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </OrganizationLayout>
  );
};

export default ContestManagement;
