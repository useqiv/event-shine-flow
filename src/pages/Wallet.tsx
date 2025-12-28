import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import CurrencySelector, { getCurrencySymbol, getCurrencyMinAmount, useConversionDisplay, currencies } from '@/components/ui/currency-selector';
import { useWallet, useWalletTransactions, useRedeemVoucher, useUpdateLowBalanceThreshold } from '@/hooks/useWallet';
import { useFlutterwavePayment } from '@/hooks/usePayments';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, Plus, Gift, ArrowUpRight, ArrowDownLeft, Vote, Ticket, CreditCard, Loader2, Filter, CalendarIcon, Bell, Settings, X } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import ReferralCard from '@/components/ReferralCard';
import { cn } from '@/lib/utils';
import LiveRatesIndicator from '@/components/ui/live-rates-indicator';
import CurrencyCalculator from '@/components/ui/currency-calculator';

type TransactionType = 'all' | 'deposit' | 'vote' | 'ticket' | 'referral' | 'voucher' | 'withdrawal';

const WalletPage = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions();
  const flutterwavePayment = useFlutterwavePayment();
  const redeemVoucher = useRedeemVoucher();
  const updateThreshold = useUpdateLowBalanceThreshold();
  const { toast } = useToast();
  const { getConversion, isLive, lastUpdated } = useConversionDisplay();

  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [fundCurrency, setFundCurrency] = useState('USD');
  const [voucherCode, setVoucherCode] = useState('');
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<TransactionType>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Threshold settings
  const [thresholdEnabled, setThresholdEnabled] = useState(!!wallet?.low_balance_threshold);
  const [thresholdAmount, setThresholdAmount] = useState(wallet?.low_balance_threshold?.toString() || '500');

  // Update threshold states when wallet data loads
  React.useEffect(() => {
    if (wallet) {
      setThresholdEnabled(wallet.low_balance_threshold !== null);
      setThresholdAmount(wallet.low_balance_threshold?.toString() || '500');
    }
  }, [wallet]);

  // Check for low balance and show alert
  const isLowBalance = wallet && wallet.low_balance_threshold !== null && wallet.balance < wallet.low_balance_threshold;

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter(tx => {
      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      
      // Date range filter
      const txDate = new Date(tx.created_at);
      if (dateFrom && txDate < startOfDay(dateFrom)) return false;
      if (dateTo && txDate > endOfDay(dateTo)) return false;
      
      return true;
    });
  }, [transactions, typeFilter, dateFrom, dateTo]);

  const hasActiveFilters = typeFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setTypeFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleFund = async () => {
    const amount = parseFloat(fundAmount);
    const minAmount = getCurrencyMinAmount(fundCurrency);
    const currencySymbol = getCurrencySymbol(fundCurrency);
    
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }
    
    if (amount < minAmount) {
      toast({ title: 'Minimum amount', description: `Minimum funding amount is ${currencySymbol}${minAmount}`, variant: 'destructive' });
      return;
    }

    if (!user?.id || !user?.email) {
      toast({ title: 'Not authenticated', description: 'Please login to fund your wallet', variant: 'destructive' });
      return;
    }

    try {
      await flutterwavePayment.mutateAsync({
        type: 'wallet',
        amount,
        currency: fundCurrency,
        email: user.email,
        name: profile?.full_name || user.email,
        user_id: user.id,
        redirect_url: `${window.location.origin}/wallet?funding=complete`,
      });
      
      setIsFundModalOpen(false);
      setFundAmount('');
      setFundCurrency('USD');
    } catch (error: any) {
      toast({ 
        title: 'Failed to initiate payment', 
        description: error.message || 'Please try again', 
        variant: 'destructive' 
      });
    }
  };

  const handleRedeem = async () => {
    if (!voucherCode.trim()) return;
    try {
      await redeemVoucher.mutateAsync(voucherCode);
      toast({ title: 'Voucher redeemed successfully!' });
      setIsVoucherModalOpen(false);
      setVoucherCode('');
    } catch (error: any) {
      toast({ title: 'Failed to redeem voucher', description: error.message, variant: 'destructive' });
    }
  };

  const handleSaveThreshold = async () => {
    try {
      const threshold = thresholdEnabled ? parseFloat(thresholdAmount) : null;
      if (thresholdEnabled && (isNaN(threshold!) || threshold! <= 0)) {
        toast({ title: 'Invalid threshold', description: 'Please enter a valid amount', variant: 'destructive' });
        return;
      }
      
      await updateThreshold.mutateAsync(threshold);
      toast({ title: 'Settings saved', description: 'Low balance alert settings updated' });
      setIsSettingsModalOpen(false);
    } catch (error: any) {
      toast({ title: 'Failed to save settings', description: error.message, variant: 'destructive' });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'vote': return <Vote className="h-4 w-4 text-primary" />;
      case 'ticket': return <Ticket className="h-4 w-4 text-accent" />;
      case 'voucher': return <Gift className="h-4 w-4 text-green-500" />;
      case 'referral': return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      default: return <ArrowUpRight className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const quickAmounts = fundCurrency === 'USD' 
    ? [10, 25, 50, 100] 
    : fundCurrency === 'NGN' 
      ? [1000, 2000, 5000, 10000] 
      : [10, 50, 100, 200];

  const currencySymbol = getCurrencySymbol(fundCurrency);

  const transactionTypes: { value: TransactionType; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'vote', label: 'Votes' },
    { value: 'ticket', label: 'Tickets' },
    { value: 'referral', label: 'Referrals' },
    { value: 'voucher', label: 'Vouchers' },
    { value: 'withdrawal', label: 'Withdrawals' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">Wallet</h1>
          <Button variant="outline" size="sm" onClick={() => setIsSettingsModalOpen(true)}>
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>

        {/* Low Balance Alert */}
        {isLowBalance && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-3 py-3">
              <Bell className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Low Balance Alert</p>
                <p className="text-sm text-muted-foreground">
                  Your balance (₦{wallet?.balance.toLocaleString()}) is below your threshold of ₦{wallet?.low_balance_threshold?.toLocaleString()}
                </p>
              </div>
              <Button size="sm" onClick={() => setIsFundModalOpen(true)}>
                Fund Now
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="pt-6">
              <p className="text-sm opacity-80">Balance</p>
              {walletLoading ? <Skeleton className="h-10 w-32 bg-primary-foreground/20" /> : (
                <p className="text-3xl font-bold">₦{wallet?.balance?.toLocaleString() || '0.00'}</p>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={() => setIsFundModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Fund
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setIsVoucherModalOpen(true)}>
                  <Gift className="h-4 w-4 mr-1" /> Redeem
                </Button>
              </div>
            </CardContent>
          </Card>

          <ReferralCard />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Transaction History</CardTitle>
              
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionType)}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM d") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MMM d") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                  </PopoverContent>
                </Popover>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
            
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">Showing:</span>
                {typeFilter !== 'all' && (
                  <Badge variant="secondary">{transactionTypes.find(t => t.value === typeFilter)?.label}</Badge>
                )}
                {dateFrom && (
                  <Badge variant="secondary">From {format(dateFrom, "MMM d, yyyy")}</Badge>
                )}
                {dateTo && (
                  <Badge variant="secondary">To {format(dateTo, "MMM d, yyyy")}</Badge>
                )}
                <Badge variant="outline">{filteredTransactions.length} results</Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                      {getIcon(tx.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{tx.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${tx.type === 'deposit' || tx.type === 'voucher' || tx.type === 'referral' ? 'text-green-500' : 'text-destructive'}`}>
                        {tx.type === 'deposit' || tx.type === 'voucher' || tx.type === 'referral' ? '+' : '-'}{getCurrencySymbol(tx.currency || 'NGN')}{Math.abs(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), 'MMM d, HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <WalletIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {hasActiveFilters ? 'No transactions match your filters' : 'No transactions yet'}
                </p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Currency Calculator */}
        <CurrencyCalculator />
      </div>

      {/* Fund Wallet Modal */}
      <Dialog open={isFundModalOpen} onOpenChange={setIsFundModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Fund Wallet
            </DialogTitle>
            <DialogDescription>
              Add funds to your wallet using Flutterwave. You can pay with card, bank transfer, or USSD.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-2">
                <Label>Currency</Label>
                <CurrencySelector
                  value={fundCurrency}
                  onValueChange={setFundCurrency}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Amount ({currencySymbol})</Label>
                <Input 
                  type="number" 
                  value={fundAmount} 
                  onChange={e => setFundAmount(e.target.value)} 
                  placeholder="Enter amount" 
                  min={getCurrencyMinAmount(fundCurrency)}
                  step={fundCurrency === 'USD' || fundCurrency === 'EUR' || fundCurrency === 'GBP' ? 0.01 : 1}
                />
                {fundAmount && fundCurrency !== 'USD' && parseFloat(fundAmount) > 0 && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {getConversion(parseFloat(fundAmount), fundCurrency, 'USD')}
                    </p>
                    <LiveRatesIndicator isLive={isLive} lastUpdated={lastUpdated} />
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Minimum: {currencySymbol}{getCurrencyMinAmount(fundCurrency).toLocaleString()}
            </p>
            
            <div>
              <Label className="text-sm text-muted-foreground">Quick select</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {quickAmounts.map(amount => (
                  <Button
                    key={amount}
                    type="button"
                    variant={fundAmount === String(amount) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFundAmount(String(amount))}
                  >
                    {currencySymbol}{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Payment Methods Available:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Card (Visa, Mastercard)</li>
                <li>• Bank Transfer</li>
                <li>• USSD</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsFundModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleFund} 
              disabled={flutterwavePayment.isPending || !fundAmount}
            >
              {flutterwavePayment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {currencySymbol}{parseFloat(fundAmount || '0').toLocaleString()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redeem Voucher Modal */}
      <Dialog open={isVoucherModalOpen} onOpenChange={setIsVoucherModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Redeem Voucher</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label>Voucher Code</Label>
            <Input value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX" className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVoucherModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRedeem} disabled={redeemVoucher.isPending}>{redeemVoucher.isPending ? 'Redeeming...' : 'Redeem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Wallet Settings
            </DialogTitle>
            <DialogDescription>
              Configure your wallet preferences and notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Low Balance Alert</Label>
                  <p className="text-sm text-muted-foreground">Get notified when your balance falls below a threshold</p>
                </div>
                <Switch 
                  checked={thresholdEnabled} 
                  onCheckedChange={setThresholdEnabled}
                />
              </div>
              
              {thresholdEnabled && (
                <div>
                  <Label>Alert Threshold (₦)</Label>
                  <Input 
                    type="number" 
                    value={thresholdAmount} 
                    onChange={e => setThresholdAmount(e.target.value)} 
                    placeholder="500" 
                    className="mt-2"
                    min={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll see an alert when your balance drops below this amount
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveThreshold} disabled={updateThreshold.isPending}>
              {updateThreshold.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default WalletPage;
