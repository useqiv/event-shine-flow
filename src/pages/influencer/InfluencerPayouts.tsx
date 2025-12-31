import React, { useState, useEffect } from 'react';
import InfluencerLayout from '@/components/layout/InfluencerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInfluencerStats, useInfluencerPayouts, useRequestPayout, useInfluencerProfile, CurrencyBalance } from '@/hooks/useInfluencerPortal';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/components/ui/currency-selector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

const InfluencerPayouts = () => {
  const { data: stats, isLoading: statsLoading } = useInfluencerStats();
  const { data: payouts, isLoading: payoutsLoading } = useInfluencerPayouts();
  const { data: profile } = useInfluencerProfile();
  const requestPayout = useRequestPayout();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(profile?.payment_method || 'bank_transfer');
  const [bankName, setBankName] = useState(profile?.bank_name || '');
  const [accountNumber, setAccountNumber] = useState(profile?.account_number || '');
  const [accountName, setAccountName] = useState(profile?.account_name || '');
  const [usdtAddress, setUsdtAddress] = useState(profile?.usdt_address || '');

  // Get balances with available funds
  const availableBalances = stats?.balances_by_currency?.filter(b => b.available_balance > 0) || [];

  // Set default selected currency when data loads
  useEffect(() => {
    if (!selectedCurrency && availableBalances.length > 0) {
      setSelectedCurrency(availableBalances[0].currency);
    }
  }, [availableBalances, selectedCurrency]);

  const selectedBalance = availableBalances.find(b => b.currency === selectedCurrency);

  const handleRequestPayout = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    if (!selectedBalance || numAmount > selectedBalance.available_balance) return;

    await requestPayout.mutateAsync({
      amount: numAmount,
      currency: selectedCurrency,
      payment_method: paymentMethod,
      bank_name: paymentMethod === 'bank_transfer' ? bankName : undefined,
      account_number: paymentMethod === 'bank_transfer' ? accountNumber : undefined,
      account_name: paymentMethod === 'bank_transfer' ? accountName : undefined,
      usdt_address: paymentMethod === 'crypto' ? usdtAddress : undefined,
    });

    setAmount('');
    setDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600"><Clock className="h-3 w-3 mr-1" /> Processing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const hasAnyBalance = availableBalances.length > 0;

  return (
    <InfluencerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payouts</h1>
            <p className="text-muted-foreground">Request withdrawals and track payout history</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!hasAnyBalance}>
                <Wallet className="h-4 w-4 mr-2" />
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Currency Selection */}
                <div className="space-y-2">
                  <Label>Select Currency</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBalances.map((balance) => (
                        <SelectItem key={balance.currency} value={balance.currency}>
                          {balance.currency} - Available: {formatCurrency(balance.available_balance, balance.currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBalance && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Available Balance ({selectedCurrency})</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedBalance.available_balance, selectedCurrency)}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={selectedBalance?.available_balance}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="crypto">Crypto (USDT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentMethod === 'bank_transfer' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                    </div>
                  </>
                )}

                {paymentMethod === 'crypto' && (
                  <div className="space-y-2">
                    <Label htmlFor="usdtAddress">USDT Address (TRC20 or ERC20)</Label>
                    <Input id="usdtAddress" value={usdtAddress} onChange={(e) => setUsdtAddress(e.target.value)} />
                  </div>
                )}

                <Button
                  onClick={handleRequestPayout}
                  disabled={
                    !amount || 
                    parseFloat(amount) <= 0 || 
                    !selectedBalance ||
                    parseFloat(amount) > selectedBalance.available_balance || 
                    requestPayout.isPending
                  }
                  className="w-full"
                >
                  {requestPayout.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Balance Cards by Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsLoading ? (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : stats?.balances_by_currency && stats.balances_by_currency.length > 0 ? (
            stats.balances_by_currency.map((balance) => (
              <Card key={balance.currency}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">{balance.currency}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-bold text-green-600">{formatCurrency(balance.available_balance, balance.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="text-yellow-600">{formatCurrency(balance.pending_payout, balance.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span>{formatCurrency(balance.paid_earnings, balance.currency)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No earnings yet
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>Track the status of your withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            {payoutsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : payouts && payouts.length > 0 ? (
              <div className="space-y-4">
                {payouts.map((payout: any) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{formatCurrency(payout.amount, payout.currency || 'NGN')}</p>
                      <p className="text-sm text-muted-foreground">
                        {payout.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Crypto (USDT)'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payout.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(payout.status)}
                      {payout.rejection_reason && (
                        <p className="text-xs text-red-500 mt-1">{payout.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No payout history yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </InfluencerLayout>
  );
};

export default InfluencerPayouts;
