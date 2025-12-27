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
import { Search, CheckCircle, XCircle, Download, Clock, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import CurrencyDisplay from '@/components/ui/currency-display';

const AdminPayouts: React.FC = () => {
  const { data: payouts, isLoading } = useAdminPayouts();
  const approvePayout = useApprovePayout();
  const rejectPayout = useRejectPayout();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  const pendingPayouts = payouts?.filter(p => p.status === 'pending') || [];
  const completedPayouts = payouts?.filter(p => p.status === 'completed') || [];
  const rejectedPayouts = payouts?.filter(p => p.status === 'rejected') || [];

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
    setApproveDialogOpen(false);
    setReferenceId('');
    setSelectedPayout(null);
  };

  const handleReject = async (payoutId: string) => {
    await rejectPayout.mutateAsync(payoutId);
  };

  // Platform default currency
  const platformCurrency = 'NGN';

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

  const PayoutTable = ({ payouts }: { payouts: any[] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell>
                <div>
                  <p className="font-medium">{payout.organization?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{payout.organization?.email}</p>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <CurrencyDisplay amount={payout.amount} currency={platformCurrency} />
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
                {payout.status === 'pending' && (
                  <div className="flex justify-end gap-2">
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
                      onClick={() => handleReject(payout.id)}
                      disabled={rejectPayout.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
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
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                  <div className="text-2xl font-bold">
                    <CurrencyDisplay amount={pendingPayouts.reduce((sum, p) => sum + p.amount, 0)} currency={platformCurrency} size="lg" />
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
                  <div className="text-2xl font-bold">
                    <CurrencyDisplay amount={completedPayouts.reduce((sum, p) => sum + p.amount, 0)} currency={platformCurrency} size="lg" />
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
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
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
                <PayoutTable payouts={filteredPayouts(pendingPayouts)} />
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
                      <p className="font-medium text-lg"><CurrencyDisplay amount={selectedPayout.amount} currency={platformCurrency} /></p>
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
      </div>
    </AdminLayout>
  );
};

export default AdminPayouts;