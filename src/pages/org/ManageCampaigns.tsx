import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyCampaigns, useUpdateCampaign, useDeleteCampaign, Campaign } from '@/hooks/useCampaigns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { getBaseAmountsByTransactionId } from '@/lib/baseAmount';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Heart,
  Users,
  Target, 
  Clock, 
  Plus, 
  Edit, 
  Pause, 
  Play, 
  MoreVertical,
  Share2,
  Eye,
  Trash2,
  Search,
  CheckCircle,
  BarChart3,
  Copy
} from 'lucide-react';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import EditCampaignDialog from '@/components/org/EditCampaignDialog';
import { DuplicateCampaignDialog } from '@/components/DuplicateCampaignDialog';
import { formatDistanceToNow, isPast } from 'date-fns';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/20 text-green-600',
  paused: 'bg-yellow-500/20 text-yellow-600',
  completed: 'bg-blue-500/20 text-blue-600',
  cancelled: 'bg-destructive/20 text-destructive',
};

const ManageCampaigns: React.FC = () => {
  const { data: campaigns, isLoading } = useMyCampaigns();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [campaignToDuplicate, setCampaignToDuplicate] = useState<Campaign | null>(null);

  const campaignIds = useMemo(() => (campaigns || []).map(c => c.id), [campaigns]);

  // Replace `current_amount` (which can include convenience fee) with fee-free base totals.
  const { data: campaignBaseAmounts } = useQuery({
    queryKey: ['campaign-base-amounts', campaignIds.join(',')],
    queryFn: async () => {
      if (!campaignIds.length) return {};

      const { data: donations } = await supabase
        .from('donations')
        .select('campaign_id, transaction_id, amount')
        .eq('status', 'completed')
        .in('campaign_id', campaignIds);

      const baseAmountMap = await getBaseAmountsByTransactionId(donations?.map(d => d.transaction_id) || []);

      const sums: Record<string, number> = {};
      (donations || []).forEach((d: any) => {
        const baseAmount = baseAmountMap.get(d.transaction_id) ?? 0;
        sums[d.campaign_id] = (sums[d.campaign_id] || 0) + Number(baseAmount || 0);
      });

      return sums;
    },
    enabled: !isLoading && campaignIds.length > 0,
    staleTime: 60_000,
  });

  const campaignsWithBaseAmounts = useMemo(() => {
    return (campaigns || []).map(c => ({
      ...c,
      current_amount: campaignBaseAmounts?.[c.id] ?? c.current_amount,
    })) as Campaign[];
  }, [campaigns, campaignBaseAmounts]);

  const filteredCampaigns = campaignsWithBaseAmounts.filter(c => {
    const matchesTab = activeTab === 'all' || c.status === activeTab;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleStatusChange = async (campaign: Campaign, newStatus: string) => {
    try {
      await updateCampaign.mutateAsync({ id: campaign.id, status: newStatus });
      toast.success(`Campaign ${newStatus === 'active' ? 'published' : newStatus}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    try {
      await deleteCampaign.mutateAsync(campaignToDelete.id);
      toast.success('Campaign deleted successfully');
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleShare = (campaign: Campaign) => {
    const url = `${window.location.origin}/campaigns/${campaign.id}`;
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: campaign.short_description || campaign.description || '',
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const openDeleteDialog = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Manage Campaigns</h1>
            <p className="text-sm text-muted-foreground">View, edit, and manage your fundraising campaigns</p>
          </div>
          <Button size="sm" className="sm:size-default" asChild>
            <Link to="/campaigns/create">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Campaign</span>
              <span className="sm:hidden">Create</span>
            </Link>
          </Button>
        </div>


        {/* Search & Tabs */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="w-max sm:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
                <TabsTrigger value="paused">Paused</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>

        {/* Campaign List */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-24 w-24 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredCampaigns.map(campaign => (
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign}
                onStatusChange={handleStatusChange}
                onShare={handleShare}
                onDelete={openDeleteDialog}
                onEdit={(c) => {
                  setCampaignToEdit(c);
                  setEditDialogOpen(true);
                }}
                onDuplicate={(c) => {
                  setCampaignToDuplicate(c);
                  setDuplicateDialogOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No campaigns found' : activeTab === 'all' ? 'No campaigns yet' : `No ${activeTab} campaigns`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search query' : 'Start a fundraising campaign to support your cause'}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link to="/campaigns/create">Create Campaign</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{campaignToDelete?.title}"? This action cannot be undone.
                All donation records will be preserved but the campaign will no longer be accessible.
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

        {/* Edit Campaign Dialog */}
        <EditCampaignDialog
          campaign={campaignToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />

        {/* Duplicate Campaign Dialog */}
        <DuplicateCampaignDialog
          campaign={campaignToDuplicate}
          open={duplicateDialogOpen}
          onOpenChange={setDuplicateDialogOpen}
        />
      </div>
    </OrganizationLayout>
  );
};

interface CampaignCardProps {
  campaign: Campaign;
  onStatusChange: (campaign: Campaign, status: string) => void;
  onShare: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
  onDuplicate: (campaign: Campaign) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ 
  campaign, 
  onStatusChange,
  onShare,
  onDelete,
  onEdit,
  onDuplicate
}) => {
  const progress = campaign.goal_amount > 0 
    ? Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100) 
    : 0;
  
  const isEnded = campaign.end_date && isPast(new Date(campaign.end_date));
  const timeLeft = campaign.end_date 
    ? formatDistanceToNow(new Date(campaign.end_date), { addSuffix: true })
    : null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <Link to={`/campaigns/${campaign.id}`} className="shrink-0">
            <div className="h-24 w-24 rounded-lg bg-muted overflow-hidden">
              {campaign.image_url ? (
                <img 
                  src={campaign.image_url} 
                  alt={campaign.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Heart className="h-8 w-8 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link to={`/campaigns/${campaign.id}`}>
                  <h3 className="font-semibold truncate hover:text-primary transition-colors">
                    {campaign.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={STATUS_COLORS[campaign.status] || ''}>
                    {campaign.status}
                  </Badge>
                  <Badge variant="outline">{campaign.category}</Badge>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/campaigns/${campaign.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Campaign
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(campaign)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Campaign
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/org/campaigns/${campaign.id}/analytics`}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare(campaign)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(campaign)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {campaign.status === 'active' && (
                    <DropdownMenuItem onClick={() => onStatusChange(campaign, 'paused')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Campaign
                    </DropdownMenuItem>
                  )}
                  {campaign.status === 'paused' && (
                    <DropdownMenuItem onClick={() => onStatusChange(campaign, 'active')}>
                      <Play className="h-4 w-4 mr-2" />
                      Resume Campaign
                    </DropdownMenuItem>
                  )}
                  {campaign.status === 'draft' && (
                    <DropdownMenuItem onClick={() => onStatusChange(campaign, 'active')}>
                      <Play className="h-4 w-4 mr-2" />
                      Publish Campaign
                    </DropdownMenuItem>
                  )}
                  {campaign.status === 'active' && (
                    <DropdownMenuItem onClick={() => onStatusChange(campaign, 'completed')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(campaign)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Campaign
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Progress */}
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">
                  {campaign.currency} {Number(campaign.current_amount).toLocaleString()}
                </span>
                <span className="text-muted-foreground">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{campaign.donor_count} donors</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{campaign.currency} {Number(campaign.goal_amount).toLocaleString()}</span>
              </div>
              {timeLeft && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{isEnded ? 'Ended' : timeLeft}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManageCampaigns;
