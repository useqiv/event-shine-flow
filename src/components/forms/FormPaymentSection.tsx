import { useState, useMemo } from 'react';
import { CreditCard, Loader2, AlertCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CryptoPaymentSection from '@/components/CryptoPaymentSection';
import { useCryptoSettings } from '@/hooks/useCryptoSettings';
import { usePaymentFees } from '@/hooks/usePaymentFees';
import { useConversionDisplay } from '@/components/ui/currency-selector';
import { convertToUsd } from '@/lib/cryptoPayment';
import { CRYPTO_MIN_AMOUNT, isBelowCryptoMinimum } from '@/lib/cryptoPayment';

interface FormPaymentSectionProps {
  amount: number;
  currency: string;
  formId: string;
  userId: string;
  email: string;
  name: string;
  responseData: Record<string, unknown>;
  onPayFlutterwave: () => void;
  onCryptoVerified: () => void;
  isProcessing: boolean;
  paymentError?: string | null;
}

const FormPaymentSection = ({
  amount,
  currency,
  formId,
  userId,
  email,
  name,
  responseData,
  onPayFlutterwave,
  onCryptoVerified,
  isProcessing,
  paymentError,
}: FormPaymentSectionProps) => {
  const { data: cryptoSettings } = useCryptoSettings();
  const { calculateFees } = usePaymentFees();
  const { rates } = useConversionDisplay();
  const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'crypto'>('flutterwave');

  const formatCurrency = (value: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(value);
  };

  const cryptoAmountUsd = useMemo(() => {
    const fees = calculateFees(amount, 'crypto');
    const total = fees.totalWithFees;
    return convertToUsd(total, currency, rates);
  }, [amount, currency, rates, calculateFees]);

  const cryptoMinimumMessage = useMemo(() => {
    if (paymentMethod !== 'crypto') return null;
    if (isBelowCryptoMinimum(cryptoAmountUsd)) {
      return `Minimum funding amount is ${CRYPTO_MIN_AMOUNT} USDT or ${CRYPTO_MIN_AMOUNT} USDC on Polygon.`;
    }
    return null;
  }, [paymentMethod, cryptoAmountUsd]);

  const showCryptoTab = cryptoSettings?.enabled ?? false;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Payment Required</h3>
            <p className="text-sm text-muted-foreground">
              This form requires a payment to submit
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
          <span className="text-muted-foreground">Amount</span>
          <span className="text-2xl font-bold">{formatCurrency(amount, currency)}</span>
        </div>

        {paymentError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
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
            <Button
              onClick={onPayFlutterwave}
              disabled={isProcessing}
              className="w-full h-12 text-base font-semibold gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Pay {formatCurrency(amount, currency)} & Submit
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Flutterwave
            </p>
          </TabsContent>

          {showCryptoTab && (
            <TabsContent value="crypto" className="space-y-4 mt-4">
              {cryptoMinimumMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{cryptoMinimumMessage}</AlertDescription>
                </Alert>
              )}
              <CryptoPaymentSection
                params={{
                  type: 'form',
                  user_id: userId,
                  email,
                  name,
                  amountUsd: cryptoAmountUsd,
                  form_id: formId,
                  response_data: responseData,
                }}
                disabled={!!cryptoMinimumMessage}
                onVerified={onCryptoVerified}
              />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FormPaymentSection;
