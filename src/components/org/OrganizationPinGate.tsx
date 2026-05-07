import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, ShieldAlert, Loader2, LogOut, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

let organizationPinVerifiedInMemory = false;
export const resetOrganizationPinVerification = () => {
  organizationPinVerifiedInMemory = false;
};
export const isOrganizationPinVerificationComplete = () => organizationPinVerifiedInMemory;

const OrganizationPinGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'sending' | 'verify' | 'verified'>('loading');
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (organizationPinVerifiedInMemory) {
      setStatus('verified');
    } else {
      sendVerificationCode();
    }
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const [domainName, tld] = domain.split('.');
    const maskedLocal = local[0] + '***';
    const maskedDomain = domainName ? domainName[0] + '***' : '***';
    const maskedTld = tld ? tld[0] + '**' : '';
    return `${maskedLocal}@${maskedDomain}.${maskedTld}`;
  };

  const sendVerificationCode = async () => {
    if (!user?.email) {
      setError('No email found. Please sign in again.');
      setStatus('verify');
      return;
    }

    setIsSending(true);
    setError(null);
    setStatus('sending');

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) {
        setError(otpError.message || 'Failed to send verification code');
        setStatus('verify');
        return;
      }

      setMaskedEmail(maskEmail(user.email));
      setStatus('verify');
      setCooldown(60);
      toast.success('Organization verification code sent');
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
      setStatus('verify');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 8 || !user?.email) return;

    setIsVerifying(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: user.email,
        token: code,
        type: 'email',
      });

      if (verifyError) {
        setError('Invalid or expired code. Please try again.');
        setCode('');
        organizationPinVerifiedInMemory = false;
        return;
      }

      organizationPinVerifiedInMemory = true;
      setStatus('verified');
      toast.success('Organization access verified');
    } catch (err) {
      setError('Verification failed. Please try again.');
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setCode('');
    sendVerificationCode();
  };

  const handleSignOut = async () => {
    organizationPinVerifiedInMemory = false;
    await signOut();
    navigate('/auth');
  };

  if (status === 'loading' || status === 'sending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {status === 'sending' ? 'Sending verification code...' : 'Preparing secure organization access...'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'verified') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>Organization PIN Verification</CardTitle>
          <CardDescription className="space-y-1">
            <span className="block">An organization access code has been sent to</span>
            <span className="block font-medium text-foreground">
              <Mail className="inline h-4 w-4 mr-1" />
              {maskedEmail}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center">
            <InputOTP maxLength={8} value={code} onChange={setCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
                <InputOTPSlot index={6} />
                <InputOTPSlot index={7} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button onClick={handleVerify} className="w-full" disabled={code.length !== 8 || isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Access Organization Dashboard'
            )}
          </Button>

          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={cooldown > 0 || isSending}
              className="text-muted-foreground"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </Button>
          </div>

          <Button variant="ghost" onClick={handleSignOut} className="w-full text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationPinGate;
