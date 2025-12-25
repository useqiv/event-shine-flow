import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Trash2, Search, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

interface DuplicateVoteGroup {
  user_id: string;
  contest_id: string;
  contestant_id: string;
  amount_paid: number;
  vote_ids: string[];
  quantities: number[];
  created_ats: string[];
  contestant_name: string;
  contest_title: string;
  user_email: string;
  duplicate_count: number;
}

const AdminVoteReconciliation: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<DuplicateVoteGroup | null>(null);

  // Query to find duplicate votes
  const { data: duplicates, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['duplicate-votes'],
    queryFn: async () => {
      // Find votes that appear to be duplicates based on:
      // Same user, same contest, same contestant, same amount, within 5 minutes of each other
      const { data: votes, error } = await supabase
        .from('votes')
        .select(`
          id,
          user_id,
          contest_id,
          contestant_id,
          amount_paid,
          quantity,
          created_at,
          transaction_id,
          contestants!inner(name),
          contests!inner(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails for display
      const userIds = [...new Set(votes?.map(v => v.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

      // Group votes by user_id + contest_id + contestant_id + amount_paid
      // and find groups with more than one vote within 5 minutes
      const groups = new Map<string, any[]>();

      votes?.forEach(vote => {
        const key = `${vote.user_id}-${vote.contest_id}-${vote.contestant_id}-${vote.amount_paid}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(vote);
      });

      const duplicateGroups: DuplicateVoteGroup[] = [];

      groups.forEach((voteList, key) => {
        if (voteList.length > 1) {
          // Sort by created_at
          voteList.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          // Check for votes within 5 minutes of each other
          const closeVotes: any[] = [];
          for (let i = 0; i < voteList.length; i++) {
            const current = voteList[i];
            const isCloseToAnother = voteList.some((other, j) => {
              if (i === j) return false;
              const diff = Math.abs(new Date(current.created_at).getTime() - new Date(other.created_at).getTime());
              return diff < 5 * 60 * 1000; // 5 minutes
            });
            if (isCloseToAnother) {
              closeVotes.push(current);
            }
          }

          if (closeVotes.length > 1) {
            const first = closeVotes[0];
            duplicateGroups.push({
              user_id: first.user_id,
              contest_id: first.contest_id,
              contestant_id: first.contestant_id,
              amount_paid: first.amount_paid,
              vote_ids: closeVotes.map(v => v.id),
              quantities: closeVotes.map(v => v.quantity),
              created_ats: closeVotes.map(v => v.created_at),
              contestant_name: first.contestants?.name || 'Unknown',
              contest_title: first.contests?.title || 'Unknown',
              user_email: profileMap.get(first.user_id) || 'Unknown',
              duplicate_count: closeVotes.length,
            });
          }
        }
      });

      return duplicateGroups;
    },
  });

  // Mutation to delete duplicate votes (keep the first one)
  const deleteDuplicatesMutation = useMutation({
    mutationFn: async (group: DuplicateVoteGroup) => {
      // Keep the first vote, delete the rest
      const idsToDelete = group.vote_ids.slice(1);
      const quantitiesToRemove = group.quantities.slice(1).reduce((a, b) => a + b, 0);

      // Delete the duplicate votes
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;

      // Manually update contestant vote count
      const { data: contestant } = await supabase
        .from('contestants')
        .select('vote_count')
        .eq('id', group.contestant_id)
        .single();

      if (contestant) {
        await supabase
          .from('contestants')
          .update({ vote_count: Math.max(0, contestant.vote_count - quantitiesToRemove) })
          .eq('id', group.contestant_id);
      }

      // Also adjust contest total_votes
      const { data: contest } = await supabase
        .from('contests')
        .select('total_votes')
        .eq('id', group.contest_id)
        .single();

      if (contest) {
        await supabase
          .from('contests')
          .update({ total_votes: Math.max(0, contest.total_votes - quantitiesToRemove) })
          .eq('id', group.contest_id);
      }

      return { deletedCount: idsToDelete.length, adjustedVotes: quantitiesToRemove };
    },
    onSuccess: (data) => {
      toast.success(`Removed ${data.deletedCount} duplicate vote(s) and adjusted ${data.adjustedVotes} votes`);
      queryClient.invalidateQueries({ queryKey: ['duplicate-votes'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove duplicates: ${error.message}`);
    },
  });

  // Mutation to delete all selected duplicates
  const deleteAllSelectedMutation = useMutation({
    mutationFn: async (groups: DuplicateVoteGroup[]) => {
      let totalDeleted = 0;
      let totalAdjusted = 0;

      for (const group of groups) {
        const idsToDelete = group.vote_ids.slice(1);
        const quantitiesToRemove = group.quantities.slice(1).reduce((a, b) => a + b, 0);

        const { error: deleteError } = await supabase
          .from('votes')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) throw deleteError;

        // Manually update counts
        const { data: contestant } = await supabase
          .from('contestants')
          .select('vote_count')
          .eq('id', group.contestant_id)
          .single();

        if (contestant) {
          await supabase
            .from('contestants')
            .update({ vote_count: Math.max(0, contestant.vote_count - quantitiesToRemove) })
            .eq('id', group.contestant_id);
        }

        const { data: contest } = await supabase
          .from('contests')
          .select('total_votes')
          .eq('id', group.contest_id)
          .single();

        if (contest) {
          await supabase
            .from('contests')
            .update({ total_votes: Math.max(0, contest.total_votes - quantitiesToRemove) })
            .eq('id', group.contest_id);
        }

        totalDeleted += idsToDelete.length;
        totalAdjusted += quantitiesToRemove;
      }

      return { totalDeleted, totalAdjusted };
    },
    onSuccess: (data) => {
      toast.success(`Removed ${data.totalDeleted} duplicate votes and adjusted ${data.totalAdjusted} vote counts`);
      setSelectedGroups(new Set());
      queryClient.invalidateQueries({ queryKey: ['duplicate-votes'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove duplicates: ${error.message}`);
    },
  });

  const handleSelectGroup = (groupKey: string, checked: boolean) => {
    const newSelected = new Set(selectedGroups);
    if (checked) {
      newSelected.add(groupKey);
    } else {
      newSelected.delete(groupKey);
    }
    setSelectedGroups(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && duplicates) {
      setSelectedGroups(new Set(duplicates.map((_, i) => `group-${i}`)));
    } else {
      setSelectedGroups(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (!duplicates) return;
    const groupsToDelete = duplicates.filter((_, i) => selectedGroups.has(`group-${i}`));
    deleteAllSelectedMutation.mutate(groupsToDelete);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Vote Reconciliation</h1>
            <p className="text-muted-foreground">Find and remove duplicate votes from the database</p>
          </div>
          <Button onClick={() => refetch()} disabled={isFetching} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Scan for Duplicates
          </Button>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Duplicate Detection Results
            </CardTitle>
            <CardDescription>
              Votes with same user, contest, contestant, and amount within 5 minutes are flagged as potential duplicates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : duplicates && duplicates.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="destructive" className="text-lg px-3 py-1">
                      {duplicates.length} duplicate group{duplicates.length !== 1 ? 's' : ''} found
                    </Badge>
                    <span className="text-muted-foreground">
                      Total extra votes: {duplicates.reduce((sum, g) => sum + g.quantities.slice(1).reduce((a, b) => a + b, 0), 0)}
                    </span>
                  </div>
                  {selectedGroups.size > 0 && (
                    <Button
                      variant="destructive"
                      onClick={handleDeleteSelected}
                      disabled={deleteAllSelectedMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove {selectedGroups.size} Selected
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 py-2 border-b">
                  <Checkbox
                    checked={selectedGroups.size === duplicates.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {duplicates.map((group, index) => (
                    <Card key={index} className="border-destructive/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedGroups.has(`group-${index}`)}
                            onCheckedChange={(checked) => handleSelectGroup(`group-${index}`, !!checked)}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <span className="font-medium">{group.duplicate_count} votes for same payment</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDeletingGroup(group);
                                  setDeleteDialogOpen(true);
                                }}
                                disabled={deleteDuplicatesMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove Duplicates
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Contest:</span>
                                <p className="font-medium truncate">{group.contest_title}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Contestant:</span>
                                <p className="font-medium">{group.contestant_name}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">User:</span>
                                <p className="font-medium truncate">{group.user_email}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Amount:</span>
                                <p className="font-medium">{formatCurrency(group.amount_paid)}</p>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <span>Votes at: </span>
                              {group.created_ats.map((dt, i) => (
                                <span key={i}>
                                  {formatDate(dt)} ({group.quantities[i]} votes)
                                  {i < group.created_ats.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                            <div className="text-xs text-destructive">
                              Will remove: {group.duplicate_count - 1} vote record(s) ({group.quantities.slice(1).reduce((a, b) => a + b, 0)} votes)
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium">No Duplicates Found</h3>
                <p className="text-muted-foreground mt-1">
                  All votes in the database appear to be unique
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Duplicate Votes?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete {deletingGroup ? deletingGroup.duplicate_count - 1 : 0} duplicate vote record(s) 
                and adjust the contestant's vote count by -{deletingGroup?.quantities.slice(1).reduce((a, b) => a + b, 0) || 0} votes.
                <br /><br />
                The first vote will be kept. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingGroup) {
                    deleteDuplicatesMutation.mutate(deletingGroup);
                  }
                  setDeleteDialogOpen(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove Duplicates
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminVoteReconciliation;
