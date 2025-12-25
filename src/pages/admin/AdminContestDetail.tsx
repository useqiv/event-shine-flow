import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Vote, 
  DollarSign, 
  Trophy,
  Building2,
  Eye,
  Pause,
  Play
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const AdminContestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: contest, isLoading: contestLoading } = useQuery({
    queryKey: ['admin-contest-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select(`
          *,
          contestants (count),
          votes (count)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: contestants, isLoading: contestantsLoading } = useQuery({
    queryKey: ['admin-contest-contestants', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contestants')
        .select('*')
        .eq('contest_id', id)
        .order('vote_count', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: recentVotes } = useQuery({
    queryKey: ['admin-contest-recent-votes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          *,
          contestants (name)
        `)
        .eq('contest_id', id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: organization } = useQuery({
    queryKey: ['admin-contest-organization', contest?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', contest?.organization_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!contest?.organization_id
  });

  const toggleContestStatus = async () => {
    if (!contest) return;
    
    const { error } = await supabase
      .from('contests')
      .update({ is_active: !contest.is_active })
      .eq('id', contest.id);

    if (error) {
      toast.error('Failed to update contest');
    } else {
      toast.success(contest.is_active ? 'Contest paused' : 'Contest activated');
      queryClient.invalidateQueries({ queryKey: ['admin-contest-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-contests'] });
    }
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = () => {
    if (!contest) return null;
    const now = new Date();
    const startDate = new Date(contest.start_date);
    const endDate = new Date(contest.end_date);

    if (!contest.is_active) {
      return <Badge variant="secondary">Paused</Badge>;
    }
    if (now < startDate) {
      return <Badge variant="outline">Upcoming</Badge>;
    }
    if (now > endDate) {
      return <Badge variant="secondary">Ended</Badge>;
    }
    return <Badge className="bg-green-500">Active</Badge>;
  };

  if (contestLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  if (!contest) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Contest not found</h2>
          <Button asChild className="mt-4">
            <Link to="/admin/contests">Back to Contests</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const totalRevenue = (contest.total_votes || 0) * (contest.vote_price || 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/contests">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{contest.title}</h1>
                {getStatusBadge()}
              </div>
              <p className="text-muted-foreground">{contest.category}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/contests/${contest.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Public Page
              </Link>
            </Button>
            <Button 
              variant={contest.is_active ? "destructive" : "default"}
              onClick={toggleContestStatus}
            >
              {contest.is_active ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Contest
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Activate Contest
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Vote className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Votes</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {contest.total_votes?.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Contestants</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {contestants?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Revenue</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(totalRevenue, contest.vote_currency)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Duration</span>
              </div>
              <div className="text-sm font-medium mt-1">
                {format(new Date(contest.start_date), 'MMM d')} - {format(new Date(contest.end_date), 'MMM d, yyyy')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contest Details & Organization */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contest Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contest.image_url && (
                <img 
                  src={contest.image_url} 
                  alt={contest.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vote Price</span>
                  <span className="font-medium">{formatCurrency(contest.vote_price, contest.vote_currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Featured</span>
                  <Badge variant={contest.is_featured ? "default" : "secondary"}>
                    {contest.is_featured ? "Yes" : "No"}
                  </Badge>
                </div>
                {contest.custom_slug && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custom URL</span>
                    <span className="font-mono text-sm">/c/{contest.custom_slug}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(contest.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
              {contest.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{contest.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              {organization ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{organization.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{organization.email || 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No organization data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contestants Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Contestants Leaderboard
            </CardTitle>
            <CardDescription>Top performers in this contest</CardDescription>
          </CardHeader>
          <CardContent>
            {contestantsLoading ? (
              <Skeleton className="h-48" />
            ) : contestants && contestants.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Contestant</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contestants.map((contestant, index) => (
                      <TableRow key={contestant.id}>
                        <TableCell>
                          <Badge variant={index < 3 ? "default" : "secondary"}>
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {contestant.photo_url && (
                              <img 
                                src={contestant.photo_url} 
                                alt={contestant.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            )}
                            <span className="font-medium">{contestant.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{contestant.vote_count.toLocaleString()}</TableCell>
                        <TableCell>
                          {formatCurrency(contestant.vote_count * (contest.vote_price || 0), contest.vote_currency)}
                        </TableCell>
                        <TableCell>
                          {contest.total_votes > 0 
                            ? ((contestant.vote_count / contest.total_votes) * 100).toFixed(1) 
                            : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No contestants yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Votes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Votes</CardTitle>
            <CardDescription>Last 10 votes for this contest</CardDescription>
          </CardHeader>
          <CardContent>
            {recentVotes && recentVotes.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Contestant</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentVotes.map((vote) => (
                      <TableRow key={vote.id}>
                        <TableCell>
                          {format(new Date(vote.created_at), 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell>{vote.contestants?.name || 'Unknown'}</TableCell>
                        <TableCell>{vote.quantity}</TableCell>
                        <TableCell>{formatCurrency(vote.amount_paid, contest.vote_currency)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{vote.payment_method}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No votes yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminContestDetail;
