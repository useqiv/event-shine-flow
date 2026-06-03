import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCampaign } from '@/hooks/useCampaigns';
import { 
  useCampaignDonationTrends, 
  useCampaignDonorStats,
  useCampaignTrafficSources,
  useCampaignViewStats,
} from '@/hooks/useCampaignAnalytics';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Heart,
  Repeat,
  Eye,
  Share2,
  Globe,
  ExternalLink,
  Edit,
  BarChart3,
  Megaphone
} from 'lucide-react';
import { format } from 'date-fns';
import SocialShareButtons from '@/components/SocialShareButtons';
import { CampaignEmbedGenerator } from '@/components/CampaignEmbedGenerator';
import CampaignUpdatesManager from '@/components/org/CampaignUpdatesManager';
import { ExtendDeadlineDialog } from '@/components/ExtendDeadlineDialog';
import { AdjustGoalDialog } from '@/components/AdjustGoalDialog';
import { CampaignStatusToggle } from '@/components/CampaignStatusToggle';
import EntityTransactionHistory from '@/components/org/EntityTransactionHistory';
import { getCampaignShareUrl } from '@/lib/urlHelpers';
import { getCurrencySymbol } from '@/lib/campaignConstants';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const CampaignDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading: campaignLoading } = useCampaign(id!);
  const { data: donationTrends, isLoading: trendsLoading } = useCampaignDonationTrends(id!, 30);
  const { data: donorStats, isLoading: statsLoading } = useCampaignDonorStats(id!);
  const { data: trafficSources } = useCampaignTrafficSources(id!);
  const { data: viewStats } = useCampaignViewStats(id!);

  if (campaignLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Campaign not found</p>
          <Button asChild>
            <Link to="/campaigns/my">Back to My Campaigns</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const baseRaised = donorStats?.totalDonationsAmount ?? 0;

  const progress = campaign.goal_amount > 0 
    ? Math.min((baseRaised / campaign.goal_amount) * 100, 100) 
    : 0;

  const pageUrl = getCampaignShareUrl(campaign.custom_slug || campaign.id, true);
  const currencySymbol = getCurrencySymbol(campaign.currency);

  const distributionData = donorStats ? [
    { name: '< ₦5K', value: donorStats.distribution.small },
    { name: '₦5K-20K', value: donorStats.distribution.medium },
    { name: '₦20K-50K', value: donorStats.distribution.large },
    { name: '> ₦50K', value: donorStats.distribution.major },
  ].filter(d => d.value > 0) : [];

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'direct': return 'Direct Link';
      case 'facebook': return 'Facebook';
      case 'twitter': return 'Twitter/X';
      case 'whatsapp': return 'WhatsApp';
      case 'email': return 'Email';
      case 'donation': return 'Internal';
      default: return source.charAt(0).toUpperCase() + source.slice(1);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/campaigns/my">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{campaign.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                  {campaign.status}
                </Badge>
                <Badge variant="outline">{campaign.category}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CampaignStatusToggle
              campaignId={campaign.id}
              currentStatus={campaign.status}
            />
            <AdjustGoalDialog
              campaignId={campaign.id}
              currentGoal={campaign.goal_amount}
              currentAmount={baseRaised}
              currency={campaign.currency}
            />
            <ExtendDeadlineDialog 
              campaignId={campaign.id}
              currentEndDate={campaign.end_date}
            />
            <Button variant="outline" size="sm" asChild>
              <Link to={`/campaigns/${id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Campaign
              </Link>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Raised</p>
                  <p className="text-xl font-bold">{currencySymbol}{baseRaised.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-xl font-bold">{progress.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Donors</p>
                  <p className="text-xl font-bold">{donorStats?.totalDonors || campaign.donor_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Views</p>
                  <p className="text-xl font-bold">{viewStats?.totalViews || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Donation</p>
                  <p className="text-xl font-bold">₦{Math.round(donorStats?.averageDonation || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">₦{baseRaised.toLocaleString()} raised</span>
              <span className="text-muted-foreground">of ₦{campaign.goal_amount.toLocaleString()} goal</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {Math.max(0, campaign.goal_amount - baseRaised).toLocaleString()} {campaign.currency} to go
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="donors">Donors</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="traffic">Traffic</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            {/* Donation Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Donation Trends (Last 30 Days)
                </CardTitle>
                <CardDescription>Daily donations amount and count</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : donationTrends && donationTrends.some(d => d.donations > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={donationTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                        formatter={(value: number, name: string) => [
                          name === 'amount' ? `₦${value.toLocaleString()}` : value,
                          name === 'amount' ? 'Amount' : 'Donations'
                        ]}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        name="Amount"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No donation data yet</p>
                      <p className="text-sm">Share your campaign to start receiving donations</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Donations Count */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Donation Count</CardTitle>
                <CardDescription>Number of donations per day</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : donationTrends && donationTrends.some(d => d.donations > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={donationTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                      />
                      <Bar 
                        dataKey="donations" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                        name="Donations"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No donation data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="donors" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Donor Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Donor Overview</CardTitle>
                  <CardDescription>Key donor metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12" />)}
                    </div>
                  ) : donorStats ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-primary" />
                          <span>Total Donors</span>
                        </div>
                        <span className="font-bold">{donorStats.totalDonors}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Repeat className="h-5 w-5 text-green-500" />
                          <span>Repeat Donors</span>
                        </div>
                        <span className="font-bold">{donorStats.repeatDonors} ({donorStats.repeatDonorRate.toFixed(1)}%)</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-blue-500" />
                          <span>Average Donation</span>
                        </div>
                        <span className="font-bold">₦{Math.round(donorStats.averageDonation).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Heart className="h-5 w-5 text-purple-500" />
                          <span>Anonymous Donations</span>
                        </div>
                        <span className="font-bold">{donorStats.anonymousDonations}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No donor data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Donation Size Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Donation Size Distribution</CardTitle>
                  <CardDescription>Breakdown by donation amount</CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : distributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No donation data yet</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <EntityTransactionHistory
              entityType="campaign"
              entityId={id || ''}
              currency={campaign.currency || 'USD'}
            />
          </TabsContent>

          <TabsContent value="traffic" className="space-y-4">
            {/* Traffic Overview */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Eye className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                      <p className="text-2xl font-bold">{viewStats?.totalViews || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Users className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unique Visitors</p>
                      <p className="text-2xl font-bold">{viewStats?.uniqueVisitors || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Share2 className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Shares</p>
                      <p className="text-2xl font-bold">{viewStats?.totalShares || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Traffic Sources Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Traffic Sources
                </CardTitle>
                <CardDescription>Where your visitors are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                {trafficSources && trafficSources.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Donations</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Conv. Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trafficSources.map((source) => (
                        <TableRow key={source.source}>
                          <TableCell className="font-medium">{getSourceLabel(source.source)}</TableCell>
                          <TableCell className="text-right">{source.views}</TableCell>
                          <TableCell className="text-right">{source.donations}</TableCell>
                          <TableCell className="text-right">₦{source.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={source.conversionRate > 5 ? 'default' : 'secondary'}>
                              {source.conversionRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No traffic data yet</p>
                    <p className="text-sm">Share your campaign to start tracking traffic sources</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Traffic Source Chart */}
            {trafficSources && trafficSources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Views by Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={trafficSources} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis 
                        type="category" 
                        dataKey="source" 
                        width={100}
                        tickFormatter={getSourceLabel}
                        className="text-xs"
                      />
                      <Tooltip 
                        formatter={(value: number) => [value, 'Views']}
                        labelFormatter={getSourceLabel}
                      />
                      <Bar 
                        dataKey="views" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="updates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Campaign Updates
                </CardTitle>
                <CardDescription>
                  Keep your donors informed about your campaign progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignUpdatesManager campaignId={campaign.id} isOwner={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share Your Campaign
                </CardTitle>
                <CardDescription>
                  Spread the word and reach more potential donors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Campaign Link</p>
                  <code className="text-xs bg-background p-2 rounded block overflow-x-auto">
                    {pageUrl}
                  </code>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Share on Social Media</p>
                  <SocialShareButtons 
                    url={pageUrl}
                    title={campaign.title}
                    description={campaign.short_description || `Help us reach our goal of ₦${campaign.goal_amount.toLocaleString()}`}
                  />
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-3">Tips for Effective Sharing</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Share with a personal message explaining why this cause matters to you
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Post updates regularly to keep donors engaged
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Tag friends and family who might be interested in supporting
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Share at different times of day to reach more people
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Embed Widget Generator */}
            <CampaignEmbedGenerator 
              campaignId={campaign.id}
              campaignTitle={campaign.title}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CampaignDashboard;
