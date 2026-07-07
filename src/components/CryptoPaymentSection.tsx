import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Copy, Check, Wallet, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useCryptoPayment, useVerifyCryptoPayment } from '@/hooks/usePayments';
import {
  CRYPTO_NETWORK,
  CRYPTO_NETWORK_LABEL,
  CRYPTO_MIN_AMOUNT,
  type CryptoCurrency,
  convertToUsd,
  isBelowCryptoMinimum,
} from '@/lib/cryptoPayment';

export interface CryptoPaymentParams {
  type: 'vote' | 'ticket' | 'donation' | 'form';
  user_id: string;
  email?: string;
  name?: string;
  amountUsd: number;
  amount?: number;
  currency?: string;
  contest_id?: string;
  contestant_id?: string;
  vote_quantity?: number;
  event_id?: string;
  ticket_type_id?: string;
  ticket_quantity?: number;
  campaign_id?: string;
  is_anonymous?: boolean;
  donor_message?: string;
  form_id?: string;
  response_data?: Record<string, unknown>;
  influencer_link_id?: string;
}

interface CryptoPaymentSectionProps {
  params: CryptoPaymentParams;
  disabled?: boolean;
  onVerified?: () => void;
  showGuestEmail?: boolean;
  guestEmail?: string;
  onGuestEmailChange?: (email: string) => void;
}

const CryptoPaymentSection: React.FC<CryptoPaymentSectionProps> = ({
  params,
  disabled = false,
  onVerified,
  showGuestEmail = false,
  guestEmail = '',
  onGuestEmailChange,
}) => {
  const [cryptoCurrency, setCryptoCurrency] = useState<CryptoCurrency>('USDT');
  const [cryptoPaymentData, setCryptoPaymentData] = useState<{
    payment_ref: string;
    wallet_address: string;
    amount: number;
    crypto_currency: string;
    network: string;
    user_id: string;
  } | null>(null);
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);

  const cryptoPayment = useCryptoPayment();
  const verifyCrypto = useVerifyCryptoPayment();

  const minimumMessage = useMemo(() => {
    if (isBelowCryptoMinimum(params.amountUsd)) {
      return `Minimum funding amount is ${CRYPTO_MIN_AMOUNT} ${cryptoCurrency} on ${CRYPTO_NETWORK_LABEL}. Your total is ${params.amountUsd.toFixed(2)} USD.`;
    }
    return null;
  }, [params.amountUsd, cryptoCurrency]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInitiatePayment = () => {
    if (showGuestEmail && !guestEmail) {
      toast.error('Please enter your email address');
      return;
    }
    if (minimumMessage) {
      toast.error(minimumMessage);
      return;
    }

    cryptoPayment.mutate(
      {
        type: params.type,
        crypto_currency: cryptoCurrency,
        network: CRYPTO_NETWORK,
        amount_usd: params.amountUsd,
        amount: params.amount,
        currency: params.currency,
        user_id: params.user_id,
        email: params.email || guestEmail,
        name: params.name,
        contest_id: params.contest_id,
        contestant_id: params.contestant_id,
        vote_quantity: params.vote_quantity,
        event_id: params.event_id,
        ticket_type_id: params.ticket_type_id,
        ticket_quantity: params.ticket_quantity,
        campaign_id: params.campaign_id,
        is_anonymous: params.is_anonymous,
        donor_message: params.donor_message,
        form_id: params.form_id,
        response_data: params.response_data,
        influencer_link_id: params.influencer_link_id,
      },
      {
        onSuccess: (data) => {
          setCryptoPaymentData({
            payment_ref: data.payment_ref,
            wallet_address: data.wallet_address,
            amount: data.amount,
            crypto_currency: data.crypto_currency,
            network: data.network,
            user_id: data.user_id || params.user_id,
          });
        },
      },
    );
  };

  const handleVerifyPayment = () => {
    if (!cryptoPaymentData || !txHash) return;

    verifyCrypto.mutate(
      {
        payment_ref: cryptoPaymentData.payment_ref,
        tx_hash: txHash.trim(),
        user_id: cryptoPaymentData.user_id,
      },
      {
        onSuccess: (data) => {
          if (data.status === 'completed') {
            toast.success('Payment verified successfully!');
            setCryptoPaymentData(null);
            setTxHash('');
            onVerified?.();
          } else {
            toast.info(data.message || 'Payment submitted for manual review');
          }
        },
      },
    );
  };

  if (!cryptoPaymentData) {
    return (
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Pay with {cryptoCurrency} on <strong>{CRYPTO_NETWORK_LABEL}</strong>. Minimum funding amount is{' '}
            <strong>{CRYPTO_MIN_AMOUNT} USDT</strong> or <strong>{CRYPTO_MIN_AMOUNT} USDC</strong>.
          </AlertDescription>
        </Alert>

        {minimumMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{minimumMessage}</AlertDescription>
          </Alert>
        )}

        {showGuestEmail && onGuestEmailChange && (
          <div>
            <Label htmlFor="crypto-guest-email">Email Address *</Label>
            <Input
              id="crypto-guest-email"
              type="email"
              placeholder="your@email.com"
              value={guestEmail}
              onChange={(e) => onGuestEmailChange(e.target.value)}
              className="mt-1"
            />
          </div>
        )}

        <div>
          <Label>Select Wallet</Label>
          <Select value={cryptoCurrency} onValueChange={(v) => setCryptoCurrency(v as CryptoCurrency)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USDT">USDT Wallet (Polygon)</SelectItem>
              <SelectItem value="USDC">USDC Wallet (Polygon)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 bg-muted rounded-lg text-sm">
          <p className="text-muted-foreground">Network</p>
          <p className="font-medium">{CRYPTO_NETWORK_LABEL}</p>
        </div>

        <div className="p-3 bg-muted rounded-lg text-sm flex justify-between">
          <span className="text-muted-foreground">You will send</span>
          <span className="font-bold">{params.amountUsd.toFixed(2)} {cryptoCurrency}</span>
        </div>

        <Button
          onClick={handleInitiatePayment}
          disabled={cryptoPayment.isPending || disabled || !!minimumMessage}
          className="w-full"
        >
          {cryptoPayment.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Address...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Get Payment Address
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Send exactly <strong>{cryptoPaymentData.amount} {cryptoPaymentData.crypto_currency}</strong> on{' '}
            <strong>{CRYPTO_NETWORK_LABEL}</strong> network.
          </AlertDescription>
        </Alert>

        <div>
          <Label className="text-muted-foreground">Send exactly</Label>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold">
              {cryptoPaymentData.amount} {cryptoPaymentData.crypto_currency}
            </p>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(String(cryptoPaymentData.amount))}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground">To this address (Polygon)</Label>
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

        <Button onClick={handleVerifyPayment} disabled={!txHash.trim() || verifyCrypto.isPending} className="w-full">
          {verifyCrypto.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Payment'
          )}
        </Button>

        <Button variant="ghost" onClick={() => setCryptoPaymentData(null)} className="w-full">
          Back to payment options
        </Button>
      </CardContent>
    </Card>
  );
};


export default CryptoPaymentSection;
