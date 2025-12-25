import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RefreshCw, Check, X, Search, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Refund {
  id: string;
  original_transaction_type: string;
  original_transaction_id: string;
  user_id: string;
  amount: number;
  reason: string;
  status: string;
  processed_by: string | null;
  processed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const AdminRefunds = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: refunds, isLoading } = useQuery({
    queryKey: ['admin-refunds', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('refunds')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Refund[];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      if (error) throw error;
      return new Map(data.map(u => [u.id, u]));
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: async ({ refundId, action, reason }: { refundId: string; action: 'approve' | 'reject'; reason?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: Record<string, unknown> = {
        status: action === 'approve' ? 'processed' : 'rejected',
        processed_by: user?.id,
        processed_at: new Date().toISOString(),
      };

      if (action === 'reject' && reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('refunds')
        .update(updateData)
        .eq('id', refundId);

      if (error) throw error;

      // If approved, we could add wallet credit logic here
      if (action === 'approve') {
        const refund = refunds?.find(r => r.id === refundId);
        if (refund) {
          // Credit the user's wallet
          const { data: wallet } = await supabase
            .from('wallets')
            .select('id, balance')
            .eq('user_id', refund.user_id)
            .single();

          if (wallet) {
            await supabase
              .from('wallets')
              .update({ balance: wallet.balance + refund.amount })
              .eq('id', wallet.id);

            await supabase.from('wallet_transactions').insert({
              wallet_id: wallet.id,
              user_id: refund.user_id,
              type: 'refund',
              amount: refund.amount,
              description: `Refund for ${refund.original_transaction_type}`,
              reference_id: refund.id,
            });
          }
        }
      }
    },
    onSuccess: (_, { action }) => {
      toast.success(`Refund ${action === 'approve' ? 'approved and processed' : 'rejected'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      setSelectedRefund(null);
      setRejectionReason('');
    },
    onError: (error) => {
      toast.error(`Failed to process refund: ${error.message}`);
    },
  });

  const handleProcess = async (action: 'approve' | 'reject') => {
    if (!selectedRefund) return;
    
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    await processRefundMutation.mutateAsync({
      refundId: selectedRefund.id,
      action,
      reason: rejectionReason,
    });
    setIsProcessing(false);
  };

  const filteredRefunds = refunds?.filter(refund => {
    if (!searchTerm) return true;
    const user = users?.get(refund.user_id);
    const searchLower = searchTerm.toLowerCase();
    return (
      user?.full_name?.toLowerCase().includes(searchLower) ||
      user?.email?.toLowerCase().includes(searchLower) ||
      refund.reason.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    pending: refunds?.filter(r => r.status === 'pending').length || 0,
    processed: refunds?.filter(r => r.status === 'processed').length || 0,
    rejected: refunds?.filter(r => r.status === 'rejected').length || 0,
    totalAmount: refunds?.filter(r => r.status === 'processed').reduce((sum, r) => sum + Number(r.amount), 0) || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'processed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Processed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Refund Management</h1>
          <p className="text-muted-foreground">Process and manage refund requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Processed</p>
                  <p className="text-2xl font-bold">{stats.processed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Refunded</p>
                  <p className="text-2xl font-bold">₦{stats.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Refunds Table */}
        <Card>
          <CardHeader>
            <CardTitle>Refund Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRefunds?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No refund requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRefunds?.map((refund) => {
                      const user = users?.get(refund.user_id);
                      return (
                        <TableRow key={refund.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{refund.original_transaction_type}</TableCell>
                          <TableCell className="font-medium">₦{Number(refund.amount).toLocaleString()}</TableCell>
                          <TableCell className="max-w-xs truncate">{refund.reason}</TableCell>
                          <TableCell>{getStatusBadge(refund.status)}</TableCell>
                          <TableCell>{format(new Date(refund.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            {refund.status === 'pending' ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-500 hover:text-green-600"
                                  onClick={() => setSelectedRefund(refund)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => setSelectedRefund(refund)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {refund.processed_at && format(new Date(refund.processed_at), 'MMM d')}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Process Dialog */}
        <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Refund Request</DialogTitle>
            </DialogHeader>
            {selectedRefund && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">User</p>
                    <p className="font-medium">{users?.get(selectedRefund.user_id)?.full_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-medium">₦{Number(selectedRefund.amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{selectedRefund.original_transaction_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedRefund.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Reason</p>
                  <p className="text-sm">{selectedRefund.reason}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Rejection Reason (if rejecting)</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedRefund(null)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleProcess('reject')}
                disabled={isProcessing}
              >
                <X className="h-4 w-4 mr-1" /> Reject
              </Button>
              <Button
                onClick={() => handleProcess('approve')}
                disabled={isProcessing}
              >
                <Check className="h-4 w-4 mr-1" /> Approve & Process
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminRefunds;
