import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useFlutterwavePayment, useCryptoPayment, useVerifyCryptoPayment } from '@/hooks/usePayments';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CreditCard, Wallet, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'vote' | 'ticket';
  amount: number;
  currency: string;
  itemDetails: {
    contest_id?: string;
    contestant_id?: string;
    vote_quantity?: number;
    event_id?: string;
    ticket_type_id?: string;
    ticket_quantity?: number;
    name: string;
  };
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onOpenChange,
  type,
  amount,
  currency,
  itemDetails,
}) => {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'crypto'>('flutterwave');
  const [cryptoCurrency, setCryptoCurrency] = useState<'USDT' | 'USDC'>('USDT');
  const [network, setNetwork] = useState<'ethereum' | 'bsc' | 'polygon' | 'tron'>('bsc');
  const [cryptoPaymentData, setCryptoPaymentData] = useState<any>(null);
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);

  const flutterwavePayment = useFlutterwavePayment();
  const cryptoPayment = useCryptoPayment();
  const verifyCrypto = useVerifyCryptoPayment();

  const handleFlutterwavePayment = () => {
    if (!user) return;

    flutterwavePayment.mutate({
      type,
      amount,
      currency,
      email: user.email || '',
      name: user.user_metadata?.full_name || 'User',
      user_id: user.id,
      ...itemDetails,
    });
  };

  const handleCryptoPayment = () => {
    if (!user) return;

    // Convert NGN to USD (simplified - in production use real rates)
    const amountUsd = currency === 'NGN' ? amount / 1500 : amount;

    cryptoPayment.mutate(
      {
        type,
        crypto_currency: cryptoCurrency,
        network,
        amount_usd: amountUsd,
        user_id: user.id,
        ...itemDetails,
      },
      {
        onSuccess: (data) => {
          setCryptoPaymentData(data);
        },
      }
    );
  };

  const handleVerifyPayment = () => {
    if (!user || !cryptoPaymentData || !txHash) return;

    verifyCrypto.mutate({
      payment_ref: cryptoPaymentData.payment_ref,
      tx_hash: txHash,
      user_id: user.id,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setCryptoPaymentData(null);
        setTxHash('');
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            {type === 'vote' ? `Purchase ${itemDetails.vote_quantity} vote(s)` : `Purchase ${itemDetails.ticket_quantity} ticket(s)`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Amount to pay</p>
            <p className="text-2xl font-bold">{currency} {amount.toLocaleString()}</p>
          </div>

          {!cryptoPaymentData ? (
            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'flutterwave' | 'crypto')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="flutterwave" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Card / Bank
                </TabsTrigger>
                <TabsTrigger value="crypto" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Crypto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="flutterwave" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Pay with card, bank transfer, or mobile money via Flutterwave
                    </p>
                    <Button 
                      onClick={handleFlutterwavePayment} 
                      className="w-full"
                      disabled={flutterwavePayment.isPending}
                    >
                      {flutterwavePayment.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Pay with Flutterwave'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="crypto" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div>
                    <Label>Select Cryptocurrency</Label>
                    <Select value={cryptoCurrency} onValueChange={(v) => setCryptoCurrency(v as 'USDT' | 'USDC')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDT">USDT (Tether)</SelectItem>
                        <SelectItem value="USDC">USDC (USD Coin)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Select Network</Label>
                    <Select value={network} onValueChange={(v) => setNetwork(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bsc">BNB Smart Chain (BSC)</SelectItem>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                        <SelectItem value="tron">Tron (TRC20)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleCryptoPayment}
                    disabled={cryptoPayment.isPending}
                  >
                    {cryptoPayment.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Address...
                      </>
                    ) : (
                      'Get Payment Address'
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Send exactly</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold">{cryptoPaymentData.amount} {cryptoPaymentData.crypto_currency}</p>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(String(cryptoPaymentData.amount))}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">To this address ({cryptoPaymentData.network})</Label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted p-2 rounded break-all flex-1">
                        {cryptoPaymentData.wallet_address}
                      </code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(cryptoPaymentData.wallet_address)}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label>After sending, enter your transaction hash</Label>
                    <Input
                      placeholder="0x..."
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <Button 
                    onClick={handleVerifyPayment}
                    disabled={!txHash || verifyCrypto.isPending}
                    className="w-full"
                  >
                    {verifyCrypto.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Payment'
                    )}
                  </Button>

                  <Button 
                    variant="ghost" 
                    onClick={() => setCryptoPaymentData(null)}
                    className="w-full"
                  >
                    Back to payment options
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
