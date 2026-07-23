import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { useOrganizationContests, useDuplicateContest, useDeleteContest } from '@/hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MultiCurrencyRevenueSummary from '@/components/org/MultiCurrencyRevenueSummary';
import { Trophy, PlusCircle, Calendar, Vote, Eye, Settings, Copy, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useContestsRevenueByCurrency } from '@/hooks/useContestRevenueByCurrency';
import { fetchPlatformCommissionSettings } from '@/lib/platformCommission';

const ManageContests = () => {
  const { data: contests, isLoading } = useOrganizationContests();
  const duplicateContest = useDuplicateContest();
  const deleteContest = useDeleteContest();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contestToDelete, setContestToDelete] = useState<any>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [contestToCopy, setContestToCopy] = useState<any>(null);

  const contestIds = contests?.map((c: { id: string }) => c.id) || [];
  const { data: contestRevenues } = useContestsRevenueByCurrency(contestIds);

  // Fetch commission settings
  const { data: commissionSettings } = useQuery({
    queryKey: ['platform-commission-settings'],
    queryFn: fetchPlatformCommissionSettings,
  });

  // Fetch organization-specific commission rates
  const { data: orgApproval } = useQuery({
    queryKey: ['org-approval-commission'],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('organization_approvals')
        .select('vote_commission_rate, ticket_commission_rate, special_commission_rate')
        .eq('organization_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const platformVoteCommission = commissionSettings?.vote_commission_percentage || commissionSettings?.platform_commission_percentage || 10;
  const voteCommission = orgApproval?.vote_commission_rate ?? orgApproval?.special_commission_rate ?? platformVoteCommission;

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Manage Contests</h1>
            <p className="text-sm text-muted-foreground">View and manage all your voting contests.</p>
          </div>
          <Link to="/org/contests/create">
            <Button size="sm" className="sm:size-default">
              <PlusCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Contest</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : contests && contests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contests.map((contest: any) => {
              const contestData = contestRevenues?.[contest.id] || {
                grossByCurrency: {},
                totalVotes: 0,
                listingVoteQuantity: 0,
                listingCatalogGross: 0,
              };

              return (
                <Card key={contest.id} className="overflow-hidden">
                  <div className="h-32 bg-secondary">
                    {contest.image_url ? (
                      <img
                        src={contest.image_url}
                        alt={contest.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold truncate">{contest.title}</h3>
                      <Badge variant={contest.is_active ? "default" : "secondary"}>
                        {contest.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(contest.start_date), 'MMM d')} - {format(new Date(contest.end_date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Vote className="h-4 w-4" />
                        <span>{(contestData.totalVotes || contest.total_votes || 0).toLocaleString()} votes</span>
                      </div>
                    </div>

                    {/* Revenue Section — per paid currency (never mixed) */}
                    <div className="bg-secondary/50 rounded-lg p-3 mb-3 space-y-2">
                      <MultiCurrencyRevenueSummary
                        grossByCurrency={contestData.grossByCurrency}
                        commissionRatePercent={voteCommission}
                        listingCurrency={contest.vote_currency || 'NGN'}
                        totalVotes={contestData.totalVotes}
                        listingVoteQuantity={contestData.listingVoteQuantity}
                        listingCatalogGross={contestData.listingCatalogGross}
                        voteUnitPrice={Number(contest.vote_price) || 0}
                        size="sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/org/contests/${contest.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Settings className="mr-2 h-4 w-4" />
                          Manage
                        </Button>
                      </Link>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setContestToCopy(contest);
                                setCopyDialogOpen(true);
                              }}
                              disabled={duplicateContest.isPending}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Duplicate contest</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setContestToDelete(contest);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete contest</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Link to={`/contests/${contest.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Contests Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first contest to start collecting votes.
              </p>
              <Link to="/org/contests/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Contest
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Contest</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to duplicate "{contestToCopy?.title}"? A new copy will be created
              with the same settings but without contestants or vote data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (contestToCopy) {
                  duplicateContest.mutate(contestToCopy.id);
                  setCopyDialogOpen(false);
                  setContestToCopy(null);
                }
              }}
            >
              Duplicate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contest</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{contestToDelete?.title}"? This will permanently delete
              the contest and all its contestants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (contestToDelete) {
                  deleteContest.mutate(contestToDelete.id);
                  setDeleteDialogOpen(false);
                  setContestToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OrganizationLayout>
  );
};

export default ManageContests;