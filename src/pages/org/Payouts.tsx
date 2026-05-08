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
import { formatCurrency, getCurrencySymbol } from '@/components/ui/currency-selector';
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
  const [isUsdtSettingsOpen, setIsUsdtSettingsOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank');
  const [payoutCurrency, setPayoutCurrency] = useState('');
  const [viewCurrency, setViewCurrency] = useState('');

  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    usdt_address: '',
  });

  // Pre-populate bank details when settings load
  React.useEffect(() => {
    if (settings) {
      setBankDetails({
        bank_name: settings.bank_name || '',
        account_number: settings.account_number || '',
        account_name: settings.account_name || '',
        usdt_address: settings.usdt_address || '',
      });
    }
  }, [settings]);

  const handleSaveBankDetails = async () => {
    await updateSettings.mutateAsync(bankDetails);
    setIsBankSettingsOpen(false);
  };

  const handleSaveUsdtAddress = async () => {
    await updateSettings.mutateAsync({ usdt_address: bankDetails.usdt_address });
    setIsUsdtSettingsOpen(false);
  };

  // Get all currencies that have revenue (for view selector)
  const allCurrenciesWithRevenue = React.useMemo(() => {
    if (!stats?.netRevenueByCurrency) return [];
    return Object.keys(stats.netRevenueByCurrency).filter(
      currency => (stats.netRevenueByCurrency?.[currency] || 0) > 0
    );
  }, [stats?.netRevenueByCurrency]);

  // Get available currencies with positive available balance (for payout request)
  const availableCurrencies = React.useMemo(() => {
    if (!stats?.requestableBalanceByCurrency) return [];
    return Object.entries(stats.requestableBalanceByCurrency)
      .filter(([_, amount]) => (amount as number) > 0)
      .map(([currency, amount]) => ({ currency, availableBalance: amount as number }));
  }, [stats?.requestableBalanceByCurrency]);

  // Set default view currency when available currencies load
  React.useEffect(() => {
    if (allCurrenciesWithRevenue.length > 0 && !viewCurrency) {
      setViewCurrency(allCurrenciesWithRevenue[0]);
    }
  }, [allCurrenciesWithRevenue, viewCurrency]);

  // Set default payout currency when available currencies load
  React.useEffect(() => {
    if (availableCurrencies.length > 0 && !payoutCurrency) {
      setPayoutCurrency(availableCurrencies[0].currency);
    }
  }, [availableCurrencies, payoutCurrency]);

  // View currency stats - use centralized stats from hook
  const viewCurrencyNetRevenue = stats?.netRevenueByCurrency?.[viewCurrency] || 0;
  const viewCurrencyPending = stats?.pendingPayoutsByCurrency?.[viewCurrency] || 0;
  const viewCurrencyPaid = stats?.completedPayoutsByCurrency?.[viewCurrency] || 0;
  const viewCurrencyAvailable = stats?.availableBalanceByCurrency?.[viewCurrency] || 0;

  // Get available balance for selected payout currency
  const selectedCurrencyAvailable = stats?.requestableBalanceByCurrency?.[payoutCurrency] || 0;

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount);
    
    if (!payoutCurrency) {
      toast.error('Please select a currency');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > selectedCurrencyAvailable) {
      toast.error('Insufficient available balance for this currency');
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
        currency: payoutCurrency,
      });
      setIsRequestOpen(false);
      setPayoutAmount('');
    } catch (error) {
      console.error('Failed to request payout:', error);
    }
  };

  const hasBankSetup = settings?.bank_name && settings?.account_number;
  const hasUsdtSetup = settings?.usdt_address;
  
  const defaultCurrency = settings?.default_currency || 'USD';

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
              <Button disabled={availableCurrencies.length === 0}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Currency</Label>
                  <Select value={payoutCurrency} onValueChange={setPayoutCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {availableCurrencies.map(({ currency, availableBalance }) => (
                        <SelectItem key={currency} value={currency}>
                          {currency} - Available: {formatCurrency(availableBalance, currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {payoutCurrency && (
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">Available Balance ({payoutCurrency})</p>
                    <p className="text-2xl font-bold">{formatCurrency(selectedCurrencyAvailable, payoutCurrency)}</p>
                    <p className="text-xs text-muted-foreground mt-1">After commission and existing payouts</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Amount ({payoutCurrency ? getCurrencySymbol(payoutCurrency) : ''})</Label>
                    {payoutCurrency && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setPayoutAmount(Math.max(0, selectedCurrencyAvailable).toString())}
                      >
                        Max
                      </Button>
                    )}
                  </div>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    max={selectedCurrencyAvailable}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
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
                  disabled={
                    requestPayout.isPending || 
                    !payoutCurrency ||
                    (payoutMethod === 'bank' && !hasBankSetup) || 
                    (payoutMethod === 'usdt' && !hasUsdtSetup)
                  }
                >
                  {requestPayout.isPending ? 'Processing...' : 'Submit Request'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Currency Selector and Balance Cards */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">View currency:</span>
          <Select value={viewCurrency} onValueChange={setViewCurrency}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {allCurrenciesWithRevenue.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {getCurrencySymbol(currency)} {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Net Revenue ({viewCurrency})</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1 bg-primary-foreground/20" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatCurrency(viewCurrencyNetRevenue, viewCurrency)}
                    </p>
                  )}
                  <p className="text-xs opacity-75 mt-1">After platform commission</p>
                </div>
                <Wallet className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payouts ({viewCurrency})</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatCurrency(viewCurrencyPending, viewCurrency)}
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
                  <p className="text-sm text-muted-foreground">Total Paid ({viewCurrency})</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatCurrency(viewCurrencyPaid, viewCurrency)}
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
                  <Dialog open={isUsdtSettingsOpen} onOpenChange={setIsUsdtSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-2">Edit Address</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit USDT Address</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>USDT Address (TRC20)</Label>
                          <Input
                            placeholder="T..."
                            value={bankDetails.usdt_address}
                            onChange={(e) => setBankDetails(prev => ({ ...prev, usdt_address: e.target.value }))}
                          />
                        </div>
                        <Button onClick={handleSaveUsdtAddress} className="w-full" disabled={updateSettings.isPending}>
                          {updateSettings.isPending ? 'Saving...' : 'Save Address'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">No USDT address set up</p>
                  <Dialog open={isUsdtSettingsOpen} onOpenChange={setIsUsdtSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Add USDT Address</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add USDT Address</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>USDT Address (TRC20)</Label>
                          <Input
                            placeholder="T..."
                            value={bankDetails.usdt_address}
                            onChange={(e) => setBankDetails(prev => ({ ...prev, usdt_address: e.target.value }))}
                          />
                        </div>
                        <Button onClick={handleSaveUsdtAddress} className="w-full" disabled={updateSettings.isPending}>
                          {updateSettings.isPending ? 'Saving...' : 'Save Address'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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
