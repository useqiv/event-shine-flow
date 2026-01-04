import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminPayouts, useApprovePayout, useRejectPayout } from '@/hooks/useAdminData';
import { useBulkApprovePayouts, useBulkRejectPayouts, useLogAdminActivity } from '@/hooks/useAdminActivityLog';
import { Search, CheckCircle, XCircle, Download, Clock, Wallet, CheckSquare, Eye } from 'lucide-react';
import PayoutDetailsDialog from '@/components/admin/PayoutDetailsDialog';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import CurrencyDisplay from '@/components/ui/currency-display';

const AdminPayouts: React.FC = () => {
  const { data: payouts, isLoading } = useAdminPayouts();
  const approvePayout = useApprovePayout();
  const rejectPayout = useRejectPayout();
  const bulkApprove = useBulkApprovePayouts();
  const bulkReject = useBulkRejectPayouts();
  const logActivity = useLogAdminActivity();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [selectedPayouts, setSelectedPayouts] = useState<Set<string>>(new Set());
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'approve' | 'reject'>('approve');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsPayout, setDetailsPayout] = useState<any>(null);

  // Platform default currency from settings
  const platformCurrency = usePlatformCurrency();

  const pendingPayouts = payouts?.filter(p => p.status === 'pending') || [];
  const completedPayouts = payouts?.filter(p => p.status === 'completed') || [];
  const rejectedPayouts = payouts?.filter(p => p.status === 'rejected') || [];

  // Group payouts by currency for stats
  const pendingByCurrency = pendingPayouts.reduce((acc, p) => {
    const currency = p.currency || 'USD';
    acc[currency] = (acc[currency] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const completedByCurrency = completedPayouts.reduce((acc, p) => {
    const currency = p.currency || 'USD';
    acc[currency] = (acc[currency] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const filteredPayouts = (list: any[]) => list.filter(payout => 
    payout.organization?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payout.organization?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async () => {
    if (!selectedPayout) return;
    await approvePayout.mutateAsync({ 
      payoutId: selectedPayout.id, 
      referenceId: referenceId || undefined 
    });
    await logActivity.mutateAsync({
      actionType: 'approve_payout',
      entityType: 'payout',
      entityId: selectedPayout.id,
      description: `Approved payout of ₦${selectedPayout.amount.toLocaleString()} to ${selectedPayout.organization?.full_name}`,
      metadata: { amount: selectedPayout.amount, reference_id: referenceId }
    });
    setApproveDialogOpen(false);
    setReferenceId('');
    setSelectedPayout(null);
  };

  const handleReject = async (payout: any) => {
    await rejectPayout.mutateAsync({ payoutId: payout.id, reason: 'Rejected by admin' });
    await logActivity.mutateAsync({
      actionType: 'reject_payout',
      entityType: 'payout',
      entityId: payout.id,
      description: `Rejected payout of ₦${payout.amount.toLocaleString()} to ${payout.organization?.full_name}`,
      metadata: { amount: payout.amount }
    });
  };

  const handleSelectPayout = (payoutId: string, checked: boolean) => {
    const newSelected = new Set(selectedPayouts);
    if (checked) {
      newSelected.add(payoutId);
    } else {
      newSelected.delete(payoutId);
    }
    setSelectedPayouts(newSelected);
  };

  const handleSelectAllPending = (checked: boolean) => {
    if (checked) {
      setSelectedPayouts(new Set(filteredPayouts(pendingPayouts).map(p => p.id)));
    } else {
      setSelectedPayouts(new Set());
    }
  };

  const handleBulkAction = async () => {
    const payoutIds = Array.from(selectedPayouts);
    if (bulkActionType === 'approve') {
      await bulkApprove.mutateAsync(payoutIds);
    } else {
      await bulkReject.mutateAsync(payoutIds);
    }
    setSelectedPayouts(new Set());
    setBulkActionDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const PayoutTable = ({ payouts, showCheckbox = false }: { payouts: any[]; showCheckbox?: boolean }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showCheckbox && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedPayouts.size === payouts.length && payouts.length > 0}
                  onCheckedChange={handleSelectAllPending}
                />
              </TableHead>
            )}
            <TableHead>Organization</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Account Details</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.map((payout) => (
            <TableRow key={payout.id}>
              {showCheckbox && (
                <TableCell>
                  <Checkbox
                    checked={selectedPayouts.has(payout.id)}
                    onCheckedChange={(checked) => handleSelectPayout(payout.id, !!checked)}
                  />
                </TableCell>
              )}
              <TableCell>
                <div>
                  <p className="font-medium">{payout.organization?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{payout.organization?.email}</p>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <CurrencyDisplay amount={payout.amount} currency={payout.currency || 'USD'} />
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">{payout.payment_method}</Badge>
              </TableCell>
              <TableCell>
                {payout.payment_method === 'bank' ? (
                  <div className="text-sm">
                    <p>{payout.bank_name}</p>
                    <p className="text-muted-foreground">{payout.account_number}</p>
                    <p className="text-muted-foreground">{payout.account_name}</p>
                  </div>
                ) : (
                  <p className="text-sm font-mono">{payout.usdt_address}</p>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(payout.status)}</TableCell>
              <TableCell>{format(new Date(payout.created_at), 'MMM d, yyyy')}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setDetailsPayout(payout);
                      setDetailsDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  {payout.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => {
                          setSelectedPayout(payout);
                          setApproveDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleReject(payout)}
                        disabled={rejectPayout.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
                {payout.reference_id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ref: {payout.reference_id}
                  </p>
                )}
              </TableCell>
            </TableRow>
          ))}
          {payouts.length === 0 && (
            <TableRow>
              <TableCell colSpan={showCheckbox ? 8 : 7} className="text-center text-muted-foreground py-8">
                No payouts found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Payout Management</h1>
            <p className="text-muted-foreground">Process payout requests</p>
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
          <h1 className="text-2xl font-bold">Payout Management</h1>
          <p className="text-muted-foreground">Process payout requests</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{pendingPayouts.length}</div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-sm font-bold space-y-1">
                    {Object.keys(pendingByCurrency).length === 0 ? (
                      <span className="text-2xl">0</span>
                    ) : (
                      Object.entries(pendingByCurrency).map(([currency, amount]) => (
                        <div key={currency}>
                          <CurrencyDisplay amount={amount} currency={currency} />
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Pending Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{completedPayouts.length}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-sm font-bold space-y-1">
                    {Object.keys(completedByCurrency).length === 0 ? (
                      <span className="text-2xl">0</span>
                    ) : (
                      Object.entries(completedByCurrency).map(([currency, amount]) => (
                        <div key={currency}>
                          <CurrencyDisplay amount={amount} currency={currency} />
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payouts Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Payouts</CardTitle>
                <CardDescription>Review and process payout requests</CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedPayouts.size > 0 && (
                  <>
                    <Button 
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => {
                        setBulkActionType('approve');
                        setBulkActionDialogOpen(true);
                      }}
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Approve {selectedPayouts.size}
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        setBulkActionType('reject');
                        setBulkActionDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject {selectedPayouts.size}
                    </Button>
                  </>
                )}
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payouts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">
                  Pending ({pendingPayouts.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedPayouts.length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({rejectedPayouts.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-4">
                <PayoutTable payouts={filteredPayouts(pendingPayouts)} showCheckbox />
              </TabsContent>
              <TabsContent value="completed" className="mt-4">
                <PayoutTable payouts={filteredPayouts(completedPayouts)} />
              </TabsContent>
              <TabsContent value="rejected" className="mt-4">
                <PayoutTable payouts={filteredPayouts(rejectedPayouts)} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Payout</DialogTitle>
              <DialogDescription>
                Confirm the payment has been processed
              </DialogDescription>
            </DialogHeader>
            {selectedPayout && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Organization</p>
                      <p className="font-medium">{selectedPayout.organization?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-medium text-lg"><CurrencyDisplay amount={selectedPayout.amount} currency={selectedPayout.currency || 'USD'} /></p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <p className="font-medium capitalize">{selectedPayout.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account</p>
                      <p className="font-medium">
                        {selectedPayout.payment_method === 'bank' 
                          ? selectedPayout.account_number 
                          : selectedPayout.usdt_address?.slice(0, 20) + '...'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Payment Reference (optional)</Label>
                  <Input
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="Enter transaction reference..."
                    className="mt-2"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-green-500 hover:bg-green-600"
                onClick={handleApprove}
                disabled={approvePayout.isPending}
              >
                Confirm Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Action Dialog */}
        <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {bulkActionType === 'approve' ? 'Bulk Approve Payouts' : 'Bulk Reject Payouts'}
              </DialogTitle>
              <DialogDescription>
                {bulkActionType === 'approve' 
                  ? `You are about to approve ${selectedPayouts.size} payouts.`
                  : `You are about to reject ${selectedPayouts.size} payouts.`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Total amount: <span className="font-bold text-foreground">
                  <CurrencyDisplay 
                    amount={payouts?.filter(p => selectedPayouts.has(p.id)).reduce((sum, p) => sum + p.amount, 0) || 0} 
                    currency={platformCurrency} 
                  />
                </span>
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant={bulkActionType === 'approve' ? 'default' : 'destructive'}
                className={bulkActionType === 'approve' ? 'bg-green-500 hover:bg-green-600' : ''}
                onClick={handleBulkAction}
                disabled={bulkApprove.isPending || bulkReject.isPending}
              >
                {bulkActionType === 'approve' ? 'Approve All' : 'Reject All'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payout Details Dialog */}
        <PayoutDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          payout={detailsPayout}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminPayouts;
