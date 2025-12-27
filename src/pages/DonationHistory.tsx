import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Heart, Calendar, DollarSign, TrendingUp, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDonationHistory, useDonationStats } from "@/hooks/useDonationHistory";

const DonationHistory = () => {
  const { data: donations, isLoading } = useDonationHistory();
  const { data: stats } = useDonationStats();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Donation History</h1>
          <p className="text-muted-foreground">Track all your contributions and supported campaigns</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? `₦${stats.totalDonated.toLocaleString()}` : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalDonations ?? "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Campaigns Supported</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.uniqueCampaigns ?? "—"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Donations List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Donations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 p-4 border rounded-lg">
                    <Skeleton className="w-20 h-20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : donations && donations.length > 0 ? (
              <div className="space-y-4">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {donation.campaign?.image_url ? (
                        <img
                          src={donation.campaign.image_url}
                          alt={donation.campaign.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className="font-semibold truncate">
                            {donation.campaign?.title ?? "Unknown Campaign"}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(donation.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">
                            {donation.currency} {donation.amount.toLocaleString()}
                          </span>
                          {getStatusBadge(donation.status)}
                        </div>
                      </div>
                      {donation.campaign && (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Campaign Progress</span>
                            <span>
                              {Math.round(
                                (donation.campaign.current_amount / donation.campaign.goal_amount) * 100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              (donation.campaign.current_amount / donation.campaign.goal_amount) * 100
                            }
                            className="h-2"
                          />
                        </div>
                      )}
                      {donation.donor_message && (
                        <p className="mt-2 text-sm text-muted-foreground italic">
                          "{donation.donor_message}"
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        {donation.campaign && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/campaigns/${donation.campaign.id}`}>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Campaign
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No donations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start supporting campaigns and make a difference!
                </p>
                <Button asChild>
                  <Link to="/campaigns">Browse Campaigns</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DonationHistory;
