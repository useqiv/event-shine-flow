import React, { useState } from 'react';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  useOrganizationStats, 
  usePayouts, 
  useRequestPayout,
  useOrganizationSettings,
  useUpdateOrganizationSettings
} from '@/hooks/useOrganization';
import { CreditCard, Wallet, Building, Bitcoin, PlusCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Payouts = () => {
  const { data: stats, isLoading: statsLoading } = useOrganizationStats();
  const { data: payouts, isLoading: payoutsLoading } = usePayouts();
  const { data: settings, isLoading: settingsLoading } = useOrganizationSettings();
  const requestPayout = useRequestPayout();
  const updateSettings = useUpdateOrganizationSettings();

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isBankSettingsOpen, setIsBankSettingsOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank');

  const [bankDetails, setBankDetails] = useState({
    bank_name: settings?.bank_name || '',
    account_number: settings?.account_number || '',
    account_name: settings?.account_name || '',
    usdt_address: settings?.usdt_address || '',
  });

  const handleSaveBankDetails = async () => {
    await updateSettings.mutateAsync(bankDetails);
    setIsBankSettingsOpen(false);
  };

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > (stats?.availableBalance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    if (payoutMethod === 'bank' && (!settings?.bank_name || !settings?.account_number)) {
      toast.error('Please set up your bank details first');
      return;
    }

    if (payoutMethod === 'usdt' && !settings?.usdt_address) {
      toast.error('Please set up your USDT address first');
      return;
    }

    try {
      await requestPayout.mutateAsync({
        amount,
        payment_method: payoutMethod,
      });
      setIsRequestOpen(false);
      setPayoutAmount('');
    } catch (error) {
      console.error('Failed to request payout:', error);
    }
  };

  const hasBankSetup = settings?.bank_name && settings?.account_number;
  const hasUsdtSetup = settings?.usdt_address;

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payouts</h1>
            <p className="text-muted-foreground">Request payouts and manage your payment details.</p>
          </div>
          <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
            <DialogTrigger asChild>
              <Button disabled={(stats?.availableBalance || 0) <= 0}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold">₦{stats?.availableBalance?.toLocaleString() || '0'}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Amount (₦)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="usdt">USDT (Crypto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {payoutMethod === 'bank' && !hasBankSetup && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">Please set up your bank details first</p>
                  </div>
                )}

                {payoutMethod === 'usdt' && !hasUsdtSetup && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">Please set up your USDT address first</p>
                  </div>
                )}

                <Button 
                  onClick={handleRequestPayout} 
                  className="w-full" 
                  disabled={requestPayout.isPending || (payoutMethod === 'bank' && !hasBankSetup) || (payoutMethod === 'usdt' && !hasUsdtSetup)}
                >
                  {requestPayout.isPending ? 'Processing...' : 'Submit Request'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Balance Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Available Balance</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1 bg-primary-foreground/20" />
                  ) : (
                    <p className="text-2xl font-bold">
                      ₦{stats?.availableBalance?.toLocaleString() || '0.00'}
                    </p>
                  )}
                </div>
                <Wallet className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">
                      ₦{stats?.pendingPayouts?.toLocaleString() || '0.00'}
                    </p>
                  )}
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">
                      ₦{stats?.completedPayouts?.toLocaleString() || '0.00'}
                    </p>
                  )}
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Bank Account
              </CardTitle>
              <CardDescription>Your bank account for withdrawals</CardDescription>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <Skeleton className="h-24" />
              ) : hasBankSetup ? (
                <div className="space-y-2">
                  <p className="font-medium">{settings.bank_name}</p>
                  <p className="text-muted-foreground">{settings.account_number}</p>
                  <p className="text-sm text-muted-foreground">{settings.account_name}</p>
                  <Dialog open={isBankSettingsOpen} onOpenChange={setIsBankSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-2">Edit Details</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Bank Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Bank Name</Label>
                          <Input
                            value={bankDetails.bank_name}
                            onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Number</Label>
                          <Input
                            value={bankDetails.account_number}
                            onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Name</Label>
                          <Input
                            value={bankDetails.account_name}
                            onChange={(e) => setBankDetails(prev => ({ ...prev, account_name: e.target.value }))}
                          />
                        </div>
                        <Button onClick={handleSaveBankDetails} className="w-full" disabled={updateSettings.isPending}>
                          {updateSettings.isPending ? 'Saving...' : 'Save Details'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">No bank account set up</p>
                  <Dialog open={isBankSettingsOpen} onOpenChange={setIsBankSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Add Bank Account</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Bank Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Bank Name</Label>
                          <Input
                            placeholder="e.g., GTBank"
                            value={bankDetails.bank_name}
                            onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Number</Label>
                          <Input
                            placeholder="10-digit account number"
                            value={bankDetails.account_number}
                            onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Name</Label>
                          <Input
                            placeholder="Account holder name"
                            value={bankDetails.account_name}
                            onChange={(e) => setBankDetails(prev => ({ ...prev, account_name: e.target.value }))}
                          />
                        </div>
                        <Button onClick={handleSaveBankDetails} className="w-full" disabled={updateSettings.isPending}>
                          {updateSettings.isPending ? 'Saving...' : 'Save Details'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bitcoin className="h-5 w-5" />
                USDT Address
              </CardTitle>
              <CardDescription>Your crypto wallet for USDT withdrawals</CardDescription>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <Skeleton className="h-24" />
              ) : hasUsdtSetup ? (
                <div className="space-y-2">
                  <p className="font-mono text-sm break-all">{settings.usdt_address}</p>
                  <Button variant="outline" size="sm" className="mt-2">Edit Address</Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">No USDT address set up</p>
                  <Button variant="outline">Add USDT Address</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>All your payout requests</CardDescription>
          </CardHeader>
          <CardContent>
            {payoutsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : payouts && payouts.length > 0 ? (
              <div className="space-y-3">
                {payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      {payout.payment_method === 'bank' ? (
                        <Building className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <Bitcoin className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-semibold">₦{payout.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {payout.payment_method === 'bank' ? `${payout.bank_name} - ${payout.account_number}` : 'USDT'} 
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        payout.status === 'completed' ? 'default' :
                        payout.status === 'pending' ? 'secondary' :
                        'destructive'
                      }>
                        {payout.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(payout.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No payout history yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizationLayout>
  );
};

export default Payouts;
