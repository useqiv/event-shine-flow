import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFlutterwavePayment, useCryptoPayment, useVerifyCryptoPayment } from '@/hooks/usePayments';
import { useAuth } from '@/contexts/AuthContext';
import { usePromoCodeValidation } from '@/hooks/usePromoCode';
import { Loader2, CreditCard, Wallet, Copy, Check, Tag, X } from 'lucide-react';
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
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');

  const flutterwavePayment = useFlutterwavePayment();
  const { 
    isValidating: isValidatingPromo, 
    appliedPromo, 
    discountAmount, 
    validatePromoCode, 
    recordPromoCodeUsage,
    clearAppliedPromo 
  } = usePromoCodeValidation();

  // Calculate final amount after discount
  const finalAmount = Math.max(0, amount - discountAmount);
  const cryptoPayment = useCryptoPayment();
  const verifyCrypto = useVerifyCryptoPayment();

  const isGuest = !user;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail);
  const canProceed = !isGuest || (guestEmail && isValidEmail);

  const handleApplyPromoCode = async () => {
    const result = await validatePromoCode(
      promoCodeInput,
      type,
      amount,
      itemDetails.event_id,
      itemDetails.contest_id,
      itemDetails.ticket_type_id
    );

    if (result.isValid) {
      toast.success(`Promo code applied! You save ${currency} ${result.discountAmount.toLocaleString()}`);
    } else {
      toast.error(result.errorMessage || 'Invalid promo code');
    }
  };

  const handleRemovePromoCode = () => {
    clearAppliedPromo();
    setPromoCodeInput('');
    toast.info('Promo code removed');
  };

  const handleFlutterwavePayment = async () => {
    const email = user?.email || guestEmail;
    const name = user?.user_metadata?.full_name || guestName || 'Guest';
    const userId = user?.id || `guest_${Date.now()}`;

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Record promo code usage if applied
    if (appliedPromo) {
      await recordPromoCodeUsage(appliedPromo.id, {
        userId,
        email,
        orderType: type,
        orderAmount: amount,
        discountAmount,
        finalAmount,
        eventId: itemDetails.event_id,
        contestId: itemDetails.contest_id,
        ticketTypeId: itemDetails.ticket_type_id,
      });
    }

    flutterwavePayment.mutate({
      type,
      amount: finalAmount,
      currency,
      email,
      name,
      user_id: userId,
      ...itemDetails,
    });
  };

  const handleCryptoPayment = () => {
    const userId = user?.id || `guest_${Date.now()}`;
    
    if (isGuest && !guestEmail) {
      toast.error('Please enter your email address');
      return;
    }

    // Convert NGN to USD (simplified - in production use real rates)
    const amountUsd = currency === 'NGN' ? amount / 1500 : amount;

    cryptoPayment.mutate(
      {
        type,
        crypto_currency: cryptoCurrency,
        network,
        amount_usd: amountUsd,
        user_id: userId,
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
    if (!cryptoPaymentData || !txHash) return;
    
    const userId = user?.id || `guest_${Date.now()}`;

    verifyCrypto.mutate({
      payment_ref: cryptoPaymentData.payment_ref,
      tx_hash: txHash,
      user_id: userId,
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
          {/* Price Summary */}
          <div className="mb-4 p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{currency} {amount.toLocaleString()}</span>
            </div>
            {appliedPromo && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Discount ({appliedPromo.code})
                </span>
                <span>-{currency} {discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold">{currency} {finalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Promo Code Input */}
          <div className="mb-4">
            {!appliedPromo ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleApplyPromoCode}
                  disabled={isValidatingPromo || !promoCodeInput}
                >
                  {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">
                    <Tag className="h-3 w-3 mr-1" />
                    {appliedPromo.code}
                  </Badge>
                  <span className="text-sm text-green-700 dark:text-green-300">
                    {appliedPromo.discount_type === 'percentage' 
                      ? `${appliedPromo.discount_value}% off` 
                      : `${currency} ${appliedPromo.discount_value} off`}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleRemovePromoCode}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
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
                  <CardContent className="pt-4 space-y-4">
                    {isGuest && (
                      <div className="space-y-3 pb-3 border-b">
                        <div>
                          <Label htmlFor="guest-email">Email Address *</Label>
                          <Input
                            id="guest-email"
                            type="email"
                            placeholder="your@email.com"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            We'll send your receipt to this email
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="guest-name">Full Name (optional)</Label>
                          <Input
                            id="guest-name"
                            type="text"
                            placeholder="John Doe"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Pay with card, bank transfer, or mobile money via Flutterwave
                    </p>
                    <Button 
                      onClick={handleFlutterwavePayment} 
                      className="w-full"
                      disabled={flutterwavePayment.isPending || !canProceed}
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
                  {isGuest && (
                    <div className="space-y-3 pb-3 border-b">
                      <div>
                        <Label htmlFor="guest-email-crypto">Email Address *</Label>
                        <Input
                          id="guest-email-crypto"
                          type="email"
                          placeholder="your@email.com"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          We'll send your receipt to this email
                        </p>
                      </div>
                    </div>
                  )}
                  
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
                    disabled={cryptoPayment.isPending || !canProceed}
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
