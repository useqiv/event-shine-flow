import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFlutterwavePayment, useCryptoPayment, useVerifyCryptoPayment } from '@/hooks/usePayments';
import { usePaymentFees } from '@/hooks/usePaymentFees';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { usePromoCodeValidation } from '@/hooks/usePromoCode';
import CurrencySelector, { useConversionDisplay, formatCurrency, getCurrencySymbol } from '@/components/ui/currency-selector';
import LiveRatesIndicator from '@/components/ui/live-rates-indicator';
import { Loader2, CreditCard, Wallet, Copy, Check, Tag, X, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

const REFERRAL_LINK_ID_KEY = 'influencer_link_id';
interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'vote' | 'ticket';
  amount: number;
  currency: string;
  originalCurrency?: string; // The original currency of the contest/event
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
  currency: initialCurrency,
  originalCurrency,
  itemDetails,
}) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { convert, isLive, rates, lastUpdated } = useConversionDisplay();
  
  const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'crypto'>('flutterwave');
  const [cryptoCurrency, setCryptoCurrency] = useState<'USDT' | 'USDC'>('USDT');
  const [network, setNetwork] = useState<'ethereum' | 'bsc' | 'polygon' | 'tron'>('bsc');
  const [cryptoPaymentData, setCryptoPaymentData] = useState<any>(null);
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);
  
  // Determine the base currency (original contest/event currency)
  const baseCurrency = originalCurrency || initialCurrency;
  
  // Calculate converted amount when currency changes
  const convertedAmount = useMemo(() => {
    if (selectedCurrency === baseCurrency) return amount;
    return convert(amount, baseCurrency, selectedCurrency);
  }, [amount, baseCurrency, selectedCurrency, rates]);
  const flutterwavePayment = useFlutterwavePayment();
  const { 
    isValidating: isValidatingPromo, 
    appliedPromo, 
    discountAmount: baseDiscountAmount, 
    validatePromoCode, 
    recordPromoCodeUsage,
    clearAppliedPromo 
  } = usePromoCodeValidation();

  // Convert discount amount to selected currency (if currency changed)
  const discountAmount = useMemo(() => {
    if (selectedCurrency === baseCurrency) return baseDiscountAmount;
    if (baseDiscountAmount === 0) return 0;
    return convert(baseDiscountAmount, baseCurrency, selectedCurrency);
  }, [baseDiscountAmount, baseCurrency, selectedCurrency, rates]);

  // Calculate final amount after discount (using converted amount)
  const finalAmount = Math.max(0, convertedAmount - discountAmount);
  const effectiveCurrency = selectedCurrency;
  const cryptoPayment = useCryptoPayment();
  const verifyCrypto = useVerifyCryptoPayment();

  const isGuest = !user;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail);
  const isNameRequiredForTicket = type === 'ticket' && isGuest;
  const canProceed = !isGuest || (guestEmail && isValidEmail && (!isNameRequiredForTicket || guestName.trim()));

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
      toast.success(`Promo code applied! You save ${effectiveCurrency} ${result.discountAmount.toLocaleString()}`);
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
    const name = isGuest
      ? (guestName || 'Guest')
      : (user?.user_metadata?.full_name || profile?.full_name || (email ? email.split('@')[0] : 'Guest'));
    const userId = user?.id || `guest_${Date.now()}`;

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (type === 'ticket' && isGuest && !guestName.trim()) {
      toast.error('Please enter your full name for the ticket');
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

    // Get influencer link ID from localStorage for conversion tracking
    const influencerLinkId = localStorage.getItem(REFERRAL_LINK_ID_KEY) || undefined;

    flutterwavePayment.mutate({
      type,
      amount: finalAmount,
      currency: effectiveCurrency,
      email,
      name,
      user_id: userId,
      influencer_link_id: influencerLinkId,
      redirect_url: `${window.location.origin}/payment-callback?type=${type}${itemDetails.event_id ? `&event_id=${itemDetails.event_id}` : ''}${itemDetails.contest_id ? `&contest_id=${itemDetails.contest_id}` : ''}`,
      ...itemDetails,
    });
  };

  const handleCryptoPayment = () => {
    const userId = user?.id || `guest_${Date.now()}`;
    
    if (isGuest && !guestEmail) {
      toast.error('Please enter your email address');
      return;
    }

    // Convert to USD using live exchange rates instead of hardcoded value
    let amountUsd = finalAmount;
    if (effectiveCurrency !== 'USD' && rates) {
      const usdRate = rates['USD'] || 1;
      const sourceRate = rates[effectiveCurrency] || 1;
      amountUsd = (finalAmount * usdRate) / sourceRate;
    }
    amountUsd = Math.round(amountUsd * 100) / 100;

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
          {/* Currency Selection */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Pay in different currency
              </label>
              <LiveRatesIndicator isLive={isLive} lastUpdated={lastUpdated} />
            </div>
            <CurrencySelector
              value={effectiveCurrency}
              onValueChange={(value) => setSelectedCurrency(value)}
            />
          </div>

          {/* Price Summary */}
          <div className="mb-4 p-4 bg-muted rounded-lg space-y-2">
            {selectedCurrency !== baseCurrency && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Original ({baseCurrency})</span>
                <span>{formatCurrency(amount, baseCurrency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(convertedAmount, effectiveCurrency)}</span>
            </div>
            {appliedPromo && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Discount ({appliedPromo.code})
                </span>
                <span>-{formatCurrency(discountAmount, effectiveCurrency)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">You Pay</span>
              <span className="text-xl font-bold">{formatCurrency(finalAmount, effectiveCurrency)}</span>
            </div>
            {selectedCurrency !== baseCurrency && (
              <p className="text-xs text-muted-foreground text-right">
                Converted rate (includes fees)
              </p>
            )}
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
                      : `${effectiveCurrency} ${appliedPromo.discount_value} off`}
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
                          <Label htmlFor="guest-name">
                            Full Name {type === 'ticket' ? <span className="text-destructive">*</span> : '(optional)'}
                          </Label>
                          <Input
                            id="guest-name"
                            type="text"
                            placeholder="John Doe"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="mt-1"
                            required={type === 'ticket'}
                          />
                          {type === 'ticket' && (
                            <p className="text-xs text-muted-foreground mt-1">
                              This name will appear on your ticket
                            </p>
                          )}
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
