import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFlutterwavePayment } from '@/hooks/usePayments';
import { usePaymentFees } from '@/hooks/usePaymentFees';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { usePromoCodeValidation } from '@/hooks/usePromoCode';
import CurrencySelector, {
  useConversionDisplay,
  formatCurrency,
  roundPaymentAmount,
  getFlutterwaveInternationalMinMessage,
} from '@/components/ui/currency-selector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LiveRatesIndicator from '@/components/ui/live-rates-indicator';
import { Loader2, CreditCard, Wallet, Tag, X, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCryptoSettings } from '@/hooks/useCryptoSettings';
import CryptoPaymentSection from '@/components/CryptoPaymentSection';
import { getOrCreateGuestUserId, isBelowCryptoMinimum, CRYPTO_MIN_AMOUNT, convertToUsd } from '@/lib/cryptoPayment';

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
  const { calculateFees } = usePaymentFees();
  const { data: cryptoSettings } = useCryptoSettings();
  const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'crypto'>('flutterwave');
  const [guestUserId, setGuestUserId] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const supportsPromo = type === 'ticket';

  useEffect(() => {
    if (open) {
      setSelectedCurrency(initialCurrency);
      setPaymentError(null);
      if (!user) {
        setGuestUserId(getOrCreateGuestUserId('guest'));
      }
    }
  }, [open, initialCurrency, user]);

  // Determine the base currency (original contest/event currency)
  const baseCurrency = originalCurrency || initialCurrency;
  
  // Calculate converted amount when currency changes
  const convertedAmount = useMemo(() => {
    if (selectedCurrency === baseCurrency) return amount;
    return convert(amount, baseCurrency, selectedCurrency);
  }, [amount, baseCurrency, selectedCurrency, rates]);
  const flutterwavePayment = useFlutterwavePayment({ showErrorToast: false });
  const {
    isValidating: isValidatingPromo,
    appliedPromo,
    discountAmount: baseDiscountAmount,
    validatePromoCode,
    recordPromoCodeUsage,
    clearAppliedPromo,
  } = usePromoCodeValidation();

  useEffect(() => {
    if (open && !supportsPromo) {
      clearAppliedPromo();
      setPromoCodeInput('');
    }
  }, [open, supportsPromo, clearAppliedPromo]);

  // Convert discount amount to selected currency (tickets only)
  const discountAmount = useMemo(() => {
    if (!supportsPromo) return 0;
    if (selectedCurrency === baseCurrency) return baseDiscountAmount;
    if (baseDiscountAmount === 0) return 0;
    return convert(baseDiscountAmount, baseCurrency, selectedCurrency);
  }, [supportsPromo, baseDiscountAmount, baseCurrency, selectedCurrency, rates, convert]);

  // Calculate final amount after discount (using converted amount)
  const amountAfterDiscount = Math.max(0, convertedAmount - discountAmount);
  
  // Calculate fees based on payment method
  const feeBreakdown = useMemo(() => {
    return calculateFees(amountAfterDiscount, paymentMethod);
  }, [amountAfterDiscount, paymentMethod, calculateFees]);
  
  const finalAmount = feeBreakdown.totalWithFees;
  const effectiveCurrency = selectedCurrency;
  const minimumPaymentMessage = useMemo(
    () => getFlutterwaveInternationalMinMessage(effectiveCurrency, finalAmount),
    [effectiveCurrency, finalAmount],
  );
  const inlinePaymentMessage = paymentError || minimumPaymentMessage;

  useEffect(() => {
    if (open) {
      setPaymentError(null);
    }
  }, [open]);

  useEffect(() => {
    setPaymentError(null);
  }, [effectiveCurrency, finalAmount, paymentMethod]);

  const cryptoAmountUsd = useMemo(() => {
    let amountUsd = finalAmount;
    if (effectiveCurrency !== 'USD' && rates) {
      amountUsd = convertToUsd(finalAmount, effectiveCurrency, rates);
    }
    return Math.round(amountUsd * 100) / 100;
  }, [finalAmount, effectiveCurrency, rates]);

  const cryptoMinimumMessage = useMemo(() => {
    if (paymentMethod !== 'crypto') return null;
    if (isBelowCryptoMinimum(cryptoAmountUsd)) {
      return `Minimum funding amount is ${CRYPTO_MIN_AMOUNT} USDT or ${CRYPTO_MIN_AMOUNT} USDC on Polygon.`;
    }
    return null;
  }, [paymentMethod, cryptoAmountUsd]);

  const isGuest = !user;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail);
  const isNameRequiredForTicket = type === 'ticket' && isGuest;
  const canProceed = !isGuest || (guestEmail && isValidEmail && (!isNameRequiredForTicket || guestName.trim()));

  const handleApplyPromoCode = async () => {
    if (!supportsPromo) return;

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
    const userId = user?.id || guestUserId || getOrCreateGuestUserId('guest');

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (type === 'ticket' && isGuest && !guestName.trim()) {
      toast.error('Please enter your full name for the ticket');
      return;
    }

    if (supportsPromo && appliedPromo) {
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

    if (minimumPaymentMessage) {
      setPaymentError(minimumPaymentMessage);
      return;
    }

    setPaymentError(null);

    flutterwavePayment.mutate(
      {
        type,
        amount: roundPaymentAmount(amountAfterDiscount, effectiveCurrency),
        currency: effectiveCurrency,
        email,
        name,
        user_id: userId,
        influencer_link_id: influencerLinkId,
        redirect_url: `${window.location.origin}/payment-callback?type=${type}${itemDetails.event_id ? `&event_id=${itemDetails.event_id}` : ''}${itemDetails.contest_id ? `&contest_id=${itemDetails.contest_id}` : ''}`,
        ...itemDetails,
      },
      {
        onError: (error) => {
          setPaymentError(error.message);
        },
      },
    );
  };

  const handleCryptoVerified = () => {
    onOpenChange(false);
  };

  const cryptoEnabled = cryptoSettings?.enabled ?? false;
  const showCryptoTab = cryptoEnabled;

  const cryptoUserId = user?.id || guestUserId || getOrCreateGuestUserId('guest');
  const cryptoEmail = user?.email || guestEmail;
  const cryptoName = isGuest
    ? guestName || 'Guest'
    : user?.user_metadata?.full_name || profile?.full_name || cryptoEmail?.split('@')[0] || 'Guest';
  const influencerLinkId = localStorage.getItem(REFERRAL_LINK_ID_KEY) || undefined;

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
            {supportsPromo && appliedPromo && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Discount ({appliedPromo.code})
                </span>
                <span>-{formatCurrency(discountAmount, effectiveCurrency)}</span>
              </div>
            )}
            {feeBreakdown.paymentMethodFee + feeBreakdown.convenienceFee > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processing Fee</span>
                <span>+{formatCurrency(feeBreakdown.paymentMethodFee + feeBreakdown.convenienceFee, effectiveCurrency)}</span>
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

          {inlinePaymentMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{inlinePaymentMessage}</AlertDescription>
            </Alert>
          )}

          {supportsPromo && (
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
          )}

          <Tabs
            value={showCryptoTab ? paymentMethod : 'flutterwave'}
            onValueChange={(v) => setPaymentMethod(v as 'flutterwave' | 'crypto')}
          >
            <TabsList className={`grid w-full ${showCryptoTab ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="flutterwave" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Card / Bank
              </TabsTrigger>
              {showCryptoTab && (
                <TabsTrigger value="crypto" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Pay with Crypto
                </TabsTrigger>
              )}
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
                      Pay with card, bank transfer, or mobile money
                    </p>
                    <Button 
                      onClick={handleFlutterwavePayment} 
                      className="w-full"
                      disabled={flutterwavePayment.isPending || !canProceed || !!minimumPaymentMessage}
                    >
                      {flutterwavePayment.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Make Payment'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {showCryptoTab && (
                <TabsContent value="crypto" className="space-y-4 mt-4">
                  {cryptoMinimumMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{cryptoMinimumMessage}</AlertDescription>
                    </Alert>
                  )}
                  {isGuest && type === 'ticket' && (
                    <div className="space-y-3 pb-3 border-b">
                      <div>
                        <Label htmlFor="guest-name-crypto">
                          Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="guest-name-crypto"
                          type="text"
                          placeholder="John Doe"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                  <CryptoPaymentSection
                    params={{
                      type,
                      user_id: cryptoUserId,
                      email: cryptoEmail,
                      name: cryptoName,
                      amountUsd: cryptoAmountUsd,
                      influencer_link_id: influencerLinkId,
                      ...itemDetails,
                    }}
                    disabled={!canProceed || !!cryptoMinimumMessage}
                    onVerified={handleCryptoVerified}
                    showGuestEmail={isGuest}
                    guestEmail={guestEmail}
                    onGuestEmailChange={setGuestEmail}
                  />
                </TabsContent>
              )}
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
