import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRequestPayout, useOrganizationSettings } from '@/hooks/useOrganization';
import { formatCurrency } from '@/components/ui/currency-selector';
import { Wallet, AlertCircle, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface EventPayoutRequestProps {
  netRevenue: number;
  currency: string;
  itemType: 'event' | 'contest';
  itemTitle: string;
}

const EventPayoutRequest: React.FC<EventPayoutRequestProps> = ({
  netRevenue,
  currency,
  itemType,
  itemTitle,
}) => {
  const { data: settings, isLoading: settingsLoading } = useOrganizationSettings();
  const requestPayout = useRequestPayout();

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank');

  const hasBankSetup = settings?.bank_name && settings?.account_number;
  const hasUsdtSetup = settings?.usdt_address;

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > netRevenue) {
      toast.error('Amount exceeds available revenue from this ' + itemType);
      return;
    }

    if (payoutMethod === 'bank' && !hasBankSetup) {
      toast.error('Please set up your bank details in Payouts settings first');
      return;
    }

    if (payoutMethod === 'usdt' && !hasUsdtSetup) {
      toast.error('Please set up your USDT address in Payouts settings first');
      return;
    }

    try {
      await requestPayout.mutateAsync({
        amount,
        payment_method: payoutMethod,
      });
      setIsRequestOpen(false);
      setPayoutAmount('');
      toast.success(`Payout request for ${formatCurrency(amount, currency)} submitted successfully`);
    } catch (error) {
      console.error('Failed to request payout:', error);
    }
  };

  const handleMaxAmount = () => {
    setPayoutAmount(netRevenue.toString());
  };

  if (netRevenue <= 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Request Payout
        </CardTitle>
        <CardDescription>
          Request a payout from this {itemType}'s earnings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-primary/10">
          <p className="text-sm text-muted-foreground">Available Net Revenue</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(netRevenue, currency)}</p>
          <p className="text-xs text-muted-foreground mt-1">From: {itemTitle}</p>
        </div>

        <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={netRevenue <= 0}>
              <Wallet className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout from {itemTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-sm text-muted-foreground">Available from this {itemType}</p>
                <p className="text-2xl font-bold">{formatCurrency(netRevenue, currency)}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Amount</Label>
                  <Button variant="ghost" size="sm" onClick={handleMaxAmount}>
                    Max
                  </Button>
                </div>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  max={netRevenue}
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
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">Please set up your bank details first</p>
                    <Link to="/org/payouts" className="text-xs underline">
                      Go to Payouts settings
                    </Link>
                  </div>
                </div>
              )}

              {payoutMethod === 'usdt' && !hasUsdtSetup && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">Please set up your USDT address first</p>
                    <Link to="/org/payouts" className="text-xs underline">
                      Go to Payouts settings
                    </Link>
                  </div>
                </div>
              )}

              {payoutMethod === 'bank' && hasBankSetup && (
                <div className="p-3 rounded-lg bg-muted text-sm">
                  <p className="font-medium">{settings.bank_name}</p>
                  <p className="text-muted-foreground">{settings.account_number} - {settings.account_name}</p>
                </div>
              )}

              {payoutMethod === 'usdt' && hasUsdtSetup && (
                <div className="p-3 rounded-lg bg-muted text-sm">
                  <p className="font-medium">USDT (TRC20)</p>
                  <p className="text-muted-foreground font-mono text-xs break-all">{settings.usdt_address}</p>
                </div>
              )}

              <Button 
                onClick={handleRequestPayout} 
                className="w-full" 
                disabled={
                  requestPayout.isPending || 
                  (payoutMethod === 'bank' && !hasBankSetup) || 
                  (payoutMethod === 'usdt' && !hasUsdtSetup) ||
                  !payoutAmount ||
                  Number(payoutAmount) <= 0 ||
                  Number(payoutAmount) > netRevenue
                }
              >
                {requestPayout.isPending ? 'Processing...' : 'Submit Payout Request'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <p className="text-xs text-muted-foreground text-center">
          Payouts are processed within 1-3 business days
        </p>
      </CardContent>
    </Card>
  );
};

export default EventPayoutRequest;
