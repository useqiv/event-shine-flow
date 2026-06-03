import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyCampaigns, useUpdateCampaign, Campaign } from '@/hooks/useCampaigns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Heart, 
  Users, 
  Target, 
  Clock, 
  Plus, 
  TrendingUp, 
  Edit, 
  Pause, 
  Play, 
  MoreVertical,
  ExternalLink,
  Share2,
  Eye,
  DollarSign,
  BarChart3
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { toast } from 'sonner';
import { ShareButtons } from '@/components/ui/share-buttons';
import { getCampaignShareUrl } from '@/lib/urlHelpers';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/20 text-green-600',
  paused: 'bg-yellow-500/20 text-yellow-600',
  completed: 'bg-blue-500/20 text-blue-600',
  cancelled: 'bg-destructive/20 text-destructive',
};

const MyCampaigns: React.FC = () => {
  const { data: campaigns, isLoading } = useMyCampaigns();
  const updateCampaign = useUpdateCampaign();
  const [activeTab, setActiveTab] = useState('all');

  const filteredCampaigns = campaigns?.filter(c => {
    if (activeTab === 'all') return true;
    return c.status === activeTab;
  });

  const stats = {
    totalCampaigns: campaigns?.length || 0,
    activeCampaigns: campaigns?.filter(c => c.status === 'active').length || 0,
    totalRaised: campaigns?.reduce((sum, c) => sum + c.current_amount, 0) || 0,
    totalDonors: campaigns?.reduce((sum, c) => sum + c.donor_count, 0) || 0,
  };

  const handleStatusChange = async (campaign: Campaign, newStatus: string) => {
    try {
      await updateCampaign.mutateAsync({ id: campaign.id, status: newStatus });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleShare = (campaign: Campaign) => {
    const url = getCampaignShareUrl(campaign.custom_slug || campaign.id, true);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Campaigns</h1>
            <p className="text-muted-foreground">Manage your fundraising campaigns and track donations</p>
          </div>
          <Button asChild>
            <Link to="/campaigns/create">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Campaigns</p>
                  <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Play className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Raised</p>
                  <p className="text-2xl font-bold">₦{stats.totalRaised.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Donors</p>
                  <p className="text-2xl font-bold">{stats.totalDonors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs & Campaign List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
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
                  <CampaignManagementCard 
                    key={campaign.id} 
                    campaign={campaign}
                    onStatusChange={handleStatusChange}
                    onShare={handleShare}
                  />
                ))}
              </div>
            ) : (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {activeTab === 'all' ? 'No campaigns yet' : `No ${activeTab} campaigns`}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start a fundraising campaign to support your cause
                  </p>
                  <Button asChild>
                    <Link to="/campaigns/create">Create Campaign</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

interface CampaignManagementCardProps {
  campaign: Campaign;
  onStatusChange: (campaign: Campaign, status: string) => void;
  onShare: (campaign: Campaign) => void;
}

const CampaignManagementCard: React.FC<CampaignManagementCardProps> = ({ 
  campaign, 
  onStatusChange,
  onShare 
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
                <div className="flex items-center gap-2 mt-1">
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
                    <Link to={`/campaigns/${campaign.id}/dashboard`}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/campaigns/${campaign.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare(campaign)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
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
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{campaign.donor_count}</span>
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

export default MyCampaigns;
