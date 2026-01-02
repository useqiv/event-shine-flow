import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormPaymentSectionProps {
  amount: number;
  currency: string;
  onPay: () => void;
  isProcessing: boolean;
  paymentError?: string | null;
}

const FormPaymentSection = ({
  amount,
  currency,
  onPay,
  isProcessing,
  paymentError,
}: FormPaymentSectionProps) => {
  const formatCurrency = (value: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(value);
  };

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

        <Button 
          onClick={onPay} 
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
      </CardContent>
    </Card>
  );
};

export default FormPaymentSection;
