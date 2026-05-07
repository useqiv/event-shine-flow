import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCampaign } from '@/hooks/useCampaigns';
import { 
  useCampaignDonationTrends, 
  useCampaignDonorStats 
} from '@/hooks/useCampaignAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LineChart,
  Line,
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
  Wallet,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const CampaignAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: campaign, isLoading: campaignLoading } = useCampaign(id!);
  const { data: donationTrends, isLoading: trendsLoading } = useCampaignDonationTrends(id!, 30);
  const { data: donorStats, isLoading: statsLoading } = useCampaignDonorStats(id!);

  // Fetch commission rates
  const { data: commissionData } = useQuery({
    queryKey: ['campaign-commission', user?.id],
    queryFn: async () => {
      // Get org-specific rate
      const { data: orgApproval } = await supabase
        .from('organization_approvals')
        .select('special_commission_rate')
        .eq('organization_id', user?.id)
        .single();
      
      // Get platform default rate
      const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['donation_commission_percentage', 'platform_commission_percentage']);
      
      const donationCommission = platformSettings?.find(s => s.setting_key === 'donation_commission_percentage');
      const platformCommission = platformSettings?.find(s => s.setting_key === 'platform_commission_percentage');
      
      const defaultRate = parseFloat(donationCommission?.setting_value || platformCommission?.setting_value || '10');
      const commissionRate = orgApproval?.special_commission_rate ?? defaultRate;
      
      return { commissionRate };
    },
    enabled: !!user?.id,
  });

  if (campaignLoading) {
    return (
      <OrganizationLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </OrganizationLayout>
    );
  }

  if (!campaign) {
    return (
      <OrganizationLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Campaign not found</p>
          <Button asChild className="mt-4">
            <Link to="/org/campaigns">Back to Campaigns</Link>
          </Button>
        </div>
      </OrganizationLayout>
    );
  }

  // Use fee-free base totals for any "raised" / "revenue" calculations.
  const baseRaised = donorStats?.totalDonationsAmount ?? 0;

  const progress = campaign.goal_amount > 0
    ? Math.min((baseRaised / campaign.goal_amount) * 100, 100)
    : 0;

  const commissionRate = commissionData?.commissionRate ?? 10;
  const commissionDeducted = (baseRaised * commissionRate) / 100;
  const netRevenue = baseRaised - commissionDeducted;

  const distributionData = donorStats ? [
    { name: '< ₦5,000', value: donorStats.distribution.small },
    { name: '₦5,000 - ₦20,000', value: donorStats.distribution.medium },
    { name: '₦20,000 - ₦50,000', value: donorStats.distribution.large },
    { name: '> ₦50,000', value: donorStats.distribution.major },
  ].filter(d => d.value > 0) : [];

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/org/campaigns">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <p className="text-muted-foreground">Campaign Analytics</p>
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
                  <p className="text-sm text-muted-foreground">Total Raised</p>
                  <p className="text-2xl font-bold">₦{baseRaised.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Wallet className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex items-center gap-1">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Revenue</p>
                    <p className="text-2xl font-bold">₦{Math.round(netRevenue).toLocaleString()}</p>
                  </div>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>After {commissionRate}% commission</p>
                        <p className="text-muted-foreground">-₦{Math.round(commissionDeducted).toLocaleString()}</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
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
                  <p className="text-sm text-muted-foreground">Goal Progress</p>
                  <p className="text-2xl font-bold">{progress.toFixed(1)}%</p>
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
                  <p className="text-sm text-muted-foreground">Total Donors</p>
                  <p className="text-2xl font-bold">{donorStats?.totalDonors || campaign.donor_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Donation</p>
                  <p className="text-2xl font-bold">₦{Math.round(donorStats?.averageDonation || 0).toLocaleString()}</p>
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
          </CardContent>
        </Card>

        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">Donation Trends</TabsTrigger>
            <TabsTrigger value="donors">Donor Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            {/* Donation Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Donation Trends (Last 30 Days)</CardTitle>
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
                      <p className="text-sm">Data will appear once donations come in</p>
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
        </Tabs>
      </div>
    </OrganizationLayout>
  );
};

export default CampaignAnalytics;
