import React from 'react';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield } from 'lucide-react';

const PIN_LENGTH = 6;

export const isValidPayoutPin = (pin: string) => /^\d{6}$/.test(pin);

interface PayoutPinFieldsProps {
  mode: 'setup' | 'verify' | 'change';
  pin: string;
  confirmPin: string;
  onPinChange: (value: string) => void;
  onConfirmPinChange: (value: string) => void;
  currentPin?: string;
  onCurrentPinChange?: (value: string) => void;
}

const PinInputField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ id, label, value, onChange }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="flex justify-center">
      <InputOTP
        id={id}
        maxLength={PIN_LENGTH}
        value={value}
        onChange={onChange}
        inputMode="numeric"
        pattern="[0-9]*"
      >
        <InputOTPGroup>
          {Array.from({ length: PIN_LENGTH }, (_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  </div>
);

const PayoutPinFields: React.FC<PayoutPinFieldsProps> = ({
  mode,
  pin,
  confirmPin,
  onPinChange,
  onConfirmPinChange,
  currentPin = '',
  onCurrentPinChange,
}) => {
  const pinsMismatch =
    (mode === 'setup' || mode === 'change') &&
    confirmPin.length === PIN_LENGTH &&
    pin.length === PIN_LENGTH &&
    pin !== confirmPin;

  const title =
    mode === 'setup'
      ? 'Set your payout security PIN'
      : mode === 'change'
        ? 'Change your payout PIN'
        : 'Verify your payout PIN';

  const description =
    mode === 'setup'
      ? 'This is your first payout request. Create a 6-digit PIN you will enter for every future payout.'
      : mode === 'change'
        ? 'Enter your current PIN, then choose a new 6-digit PIN for future payout requests.'
        : 'Enter the 6-digit PIN you created to authorize this payout request.';

  return (
    <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/30">
      <div className="flex items-start gap-2">
        <Shield className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      {mode === 'change' && onCurrentPinChange && (
        <PinInputField
          id="payout-pin-current"
          label="Current payout PIN"
          value={currentPin}
          onChange={onCurrentPinChange}
        />
      )}

      <PinInputField
        id="payout-pin"
        label={
          mode === 'setup'
            ? 'Create 6-digit payout PIN'
            : mode === 'change'
              ? 'New payout PIN'
              : 'Enter payout PIN'
        }
        value={pin}
        onChange={onPinChange}
      />

      {(mode === 'setup' || mode === 'change') && (
        <PinInputField
          id="payout-pin-confirm"
          label={mode === 'change' ? 'Confirm new payout PIN' : 'Confirm payout PIN'}
          value={confirmPin}
          onChange={onConfirmPinChange}
        />
      )}

      {pinsMismatch && (
        <p className="text-sm text-destructive text-center">PINs do not match</p>
      )}
    </div>
  );
};

export default PayoutPinFields;
