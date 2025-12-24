import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useWallet, useWalletTransactions, useFundWallet, useRedeemVoucher } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, Plus, Gift, ArrowUpRight, ArrowDownLeft, Vote, Ticket } from 'lucide-react';
import { format } from 'date-fns';

const WalletPage = () => {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions();
  const fundWallet = useFundWallet();
  const redeemVoucher = useRedeemVoucher();
  const { toast } = useToast();

  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [voucherCode, setVoucherCode] = useState('');

  const handleFund = async () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    try {
      await fundWallet.mutateAsync({ amount, paymentMethod: 'card' });
      toast({ title: 'Wallet funded successfully!' });
      setIsFundModalOpen(false);
      setFundAmount('');
    } catch (error: any) {
      toast({ title: 'Failed to fund wallet', description: error.message, variant: 'destructive' });
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
      default: return <ArrowUpRight className="h-4 w-4 text-muted-foreground" />;
    }
  };

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

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Referral Code</p>
              <p className="text-xl font-bold font-mono">{wallet?.referral_code || '...'}</p>
              <p className="text-sm text-muted-foreground mt-2">Referral Earnings</p>
              <p className="text-lg font-semibold">₦{wallet?.referral_earnings?.toLocaleString() || '0.00'}</p>
            </CardContent>
          </Card>
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
                      <p className={`font-medium ${tx.amount >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {tx.amount >= 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
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
        <DialogContent>
          <DialogHeader><DialogTitle>Fund Wallet</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label>Amount (₦)</Label>
            <Input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="1000" className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFundModalOpen(false)}>Cancel</Button>
            <Button onClick={handleFund} disabled={fundWallet.isPending}>{fundWallet.isPending ? 'Processing...' : 'Fund'}</Button>
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
