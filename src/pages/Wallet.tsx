import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useWallet, useWalletTransactions, useRedeemVoucher } from '@/hooks/useWallet';
import { useFlutterwavePayment } from '@/hooks/usePayments';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, Plus, Gift, ArrowUpRight, ArrowDownLeft, Vote, Ticket, CreditCard, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import ReferralCard from '@/components/ReferralCard';

const WalletPage = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions();
  const flutterwavePayment = useFlutterwavePayment();
  const redeemVoucher = useRedeemVoucher();
  const { toast } = useToast();

  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [voucherCode, setVoucherCode] = useState('');

  const handleFund = async () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }
    
    if (amount < 100) {
      toast({ title: 'Minimum amount', description: 'Minimum funding amount is ₦100', variant: 'destructive' });
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
        currency: 'NGN',
        email: user.email,
        name: profile?.full_name || user.email,
        user_id: user.id,
        redirect_url: `${window.location.origin}/wallet?funding=complete`,
      });
      
      // Payment initiated - user will be redirected to Flutterwave
      setIsFundModalOpen(false);
      setFundAmount('');
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

  const quickAmounts = [1000, 2000, 5000, 10000];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Wallet</h1>

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
          <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map(tx => (
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
                        {tx.type === 'deposit' || tx.type === 'voucher' || tx.type === 'referral' ? '+' : '-'}₦{Math.abs(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), 'MMM d, HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <WalletIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
            <div>
              <Label>Amount (₦)</Label>
              <Input 
                type="number" 
                value={fundAmount} 
                onChange={e => setFundAmount(e.target.value)} 
                placeholder="Enter amount" 
                className="mt-2"
                min={100}
              />
            </div>
            
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
                    ₦{amount.toLocaleString()}
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
                  Pay ₦{parseFloat(fundAmount || '0').toLocaleString()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </DashboardLayout>
  );
};

export default WalletPage;
