import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminPolls, useModeratePoll } from '@/hooks/useAdminData';
import { CheckCircle, XCircle, Clock, Vote, Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const AdminPolls: React.FC = () => {
  const { data: polls, isLoading } = useAdminPolls();
  const moderatePoll = useModeratePoll();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const pending = polls?.filter((poll) => poll.approval_status === 'pending') || [];
  const approved = polls?.filter((poll) => poll.approval_status === 'approved') || [];
  const rejected = polls?.filter((poll) => poll.approval_status === 'rejected') || [];

  const handleApprove = async (formId: string) => {
    await moderatePoll.mutateAsync({ formId, status: 'approved' });
  };

  const openRejectDialog = (formId: string) => {
    setSelectedPollId(formId);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedPollId) return;
    await moderatePoll.mutateAsync({
      formId: selectedPollId,
      status: 'rejected',
      reason: rejectionReason.trim() || undefined,
    });
    setRejectDialogOpen(false);
    setSelectedPollId(null);
  };

  const PollList = ({ items }: { items: NonNullable<typeof polls> }) => (
    <div className="space-y-3">
      {items.map((poll) => (
        <Card key={poll.id}>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{poll.title}</h3>
                  <Badge variant="outline" className="capitalize">
                    {poll.approval_status}
                  </Badge>
                  {poll.is_active && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Live</Badge>
                  )}
                </div>
                {poll.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{poll.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>By: {poll.owner?.full_name || poll.owner?.email || 'Unknown'}</span>
                  <span>Created {format(new Date(poll.created_at), 'MMM d, yyyy')}</span>
                  {poll.reviewed_at && (
                    <span>Reviewed {format(new Date(poll.reviewed_at), 'MMM d, yyyy')}</span>
                  )}
                </div>
                {poll.rejection_reason && (
                  <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md p-2">
                    {poll.rejection_reason}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/forms/${poll.id}/responses`}>
                    <Eye className="h-4 w-4 mr-1" />
                    Responses
                  </Link>
                </Button>
                {poll.approval_status === 'approved' && poll.is_active && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/f/${poll.id}`} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Live
                    </Link>
                  </Button>
                )}
                {poll.approval_status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => handleApprove(poll.id)}
                      disabled={moderatePoll.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openRejectDialog(poll.id)}
                      disabled={moderatePoll.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {items.length === 0 && (
        <div className="text-center text-muted-foreground py-12">No polls in this queue</div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <Skeleton className="h-64 w-full" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Vote className="h-6 w-6" />
            Poll / Quick Vote Approval
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Review organization polls before they go live
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-3">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold">{pending.length}</div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold">{approved.length}</div>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold">{rejected.length}</div>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Poll Queue</CardTitle>
            <CardDescription>
              Polls and quick votes must be approved before organizations can share them publicly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-4">
                <PollList items={pending} />
              </TabsContent>
              <TabsContent value="approved" className="mt-4">
                <PollList items={approved} />
              </TabsContent>
              <TabsContent value="rejected" className="mt-4">
                <PollList items={rejected} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Poll</DialogTitle>
            <DialogDescription>
              Provide a reason so the organization knows what to fix before resubmitting.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={moderatePoll.isPending}>
              Reject Poll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPolls;
