import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminContests } from '@/hooks/useAdminData';
import { Search, MoreHorizontal, Eye, Pause, Play, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const AdminContests: React.FC = () => {
  const { data: contests, isLoading } = useAdminContests();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContests = contests?.filter(contest => 
    contest.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contest.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const toggleContestStatus = async (contestId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('contests')
      .update({ is_active: !currentStatus })
      .eq('id', contestId);

    if (error) {
      toast.error('Failed to update contest');
    } else {
      toast.success(currentStatus ? 'Contest paused' : 'Contest activated');
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

  const getStatusBadge = (contest: any) => {
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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Contest Management</h1>
            <p className="text-muted-foreground">View and manage all contests</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Contest Management</h1>
          <p className="text-muted-foreground">View and manage all contests</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{contests?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total Contests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">
                {contests?.filter(c => c.is_active && new Date(c.end_date) > new Date()).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {contests?.reduce((sum, c) => sum + (c.total_votes || 0), 0)?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total Votes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {formatCurrency(contests?.reduce((sum, c) => sum + (c.total_votes || 0) * (c.vote_price || 0), 0) || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Contests Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Contests</CardTitle>
            <CardDescription>View contest details and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contest</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contestants</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContests.map((contest) => (
                    <TableRow key={contest.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {contest.image_url && (
                            <img 
                              src={contest.image_url} 
                              alt={contest.title}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          <span className="font-medium">{contest.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contest.category}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(contest)}</TableCell>
                      <TableCell>{contest.contestants?.[0]?.count || 0}</TableCell>
                      <TableCell>{contest.total_votes?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        {formatCurrency((contest.total_votes || 0) * (contest.vote_price || 0), contest.vote_currency)}
                      </TableCell>
                      <TableCell>{format(new Date(contest.end_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/contests/${contest.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleContestStatus(contest.id, contest.is_active)}>
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
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminContests;