import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { QRCodeSVG } from 'qrcode.react';

interface TwoFactorEnforcementProps {
  onComplete?: () => void;
  isRequired?: boolean;
}

const TwoFactorEnforcement: React.FC<TwoFactorEnforcementProps> = ({ 
  onComplete,
  isRequired = false 
}) => {
  const [step, setStep] = useState<'check' | 'setup' | 'verify' | 'complete'>('check');
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    try {
      const { data: factorsData, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('Error checking MFA status:', error);
        setIsLoading(false);
        return;
      }

      const hasVerifiedFactor = factorsData?.totp?.some(f => f.status === 'verified');
      setIs2FAEnabled(!!hasVerifiedFactor);
      setStep(hasVerifiedFactor ? 'complete' : 'check');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'VotePass Authenticator',
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data) {
        setFactorId(data.id);
        setQrCode(data.totp.uri);
        setSecret(data.totp.secret);
        setStep('setup');
      }
    } catch (error: any) {
      toast.error('Failed to start 2FA setup');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId || verifyCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsEnrolling(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        toast.error(challengeError.message);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) {
        toast.error('Invalid verification code. Please try again.');
        return;
      }

      setIs2FAEnabled(true);
      setStep('complete');
      toast.success('Two-factor authentication enabled successfully!');
      onComplete?.();
    } catch (error: any) {
      toast.error('Verification failed');
    } finally {
      setIsEnrolling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copied to clipboard');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete' || is2FAEnabled) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              Two-Factor Authentication
            </CardTitle>
            <Badge className="bg-green-500">Enabled</Badge>
          </div>
          <CardDescription>Your account is protected with 2FA</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Two-factor authentication is enabled on your account. You'll be asked for a verification code
            from your authenticator app each time you sign in.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'setup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Set Up Two-Factor Authentication
          </CardTitle>
          <CardDescription>Scan the QR code with your authenticator app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <QRCodeSVG value={qrCode} size={200} />
          </div>

          {/* Manual Entry */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Or enter this code manually in your authenticator app:
            </p>
            <div className="flex items-center gap-2">
              <Input 
                value={secret} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={copySecret}>
                Copy
              </Button>
            </div>
          </div>

          {/* Verification */}
          <div className="space-y-4">
            <p className="text-sm font-medium">Enter the 6-digit code from your app:</p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={verifyCode} onChange={setVerifyCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button 
              onClick={handleVerify} 
              className="w-full"
              disabled={verifyCode.length !== 6 || isEnrolling}
            >
              {isEnrolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify and Enable 2FA'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Initial check state
  return (
    <Card className={isRequired ? 'border-destructive' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className={`h-5 w-5 ${isRequired ? 'text-destructive' : 'text-muted-foreground'}`} />
            Two-Factor Authentication
          </CardTitle>
          <Badge variant="outline">Not Enabled</Badge>
        </div>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRequired && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>2FA Required</AlertTitle>
            <AlertDescription>
              Two-factor authentication is required for your account type. Please enable it to continue using all features.
            </AlertDescription>
          </Alert>
        )}
        
        <p className="text-sm text-muted-foreground">
          Two-factor authentication adds an extra layer of security to your account by requiring a code from your 
          authenticator app in addition to your password.
        </p>

        <Button onClick={handleEnroll} disabled={isEnrolling} className="w-full">
          {isEnrolling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Enable Two-Factor Authentication
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TwoFactorEnforcement;
