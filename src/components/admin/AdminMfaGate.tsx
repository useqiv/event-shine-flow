import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, ShieldAlert, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import TwoFactorEnforcement from '@/components/auth/TwoFactorEnforcement';

const AdminMfaGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'needs_setup' | 'needs_verify' | 'verified'>('loading');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkMfaLevel();
  }, []);

  const checkMfaLevel = async () => {
    try {
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalError) {
        console.error('AAL check error:', aalError);
        setStatus('needs_setup');
        return;
      }

      // Already at AAL2 - admin is fully verified
      if (aalData.currentLevel === 'aal2') {
        setStatus('verified');
        return;
      }

      // At AAL1, check if MFA is set up
      if (aalData.nextLevel === 'aal2') {
        // MFA is enrolled, need to verify
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const totpFactor = factorsData?.totp?.find(f => f.status === 'verified');
        
        if (totpFactor) {
          setFactorId(totpFactor.id);
          setStatus('needs_verify');
        } else {
          setStatus('needs_setup');
        }
      } else {
        // No MFA enrolled at all
        setStatus('needs_setup');
      }
    } catch (err) {
      console.error('MFA check error:', err);
      setStatus('needs_setup');
    }
  };

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return;

    setIsVerifying(true);
    setError(null);

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        setError(challengeError.message);
        setIsVerifying(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        setError('Invalid verification code. Please try again.');
        setCode('');
        setIsVerifying(false);
        return;
      }

      setStatus('verified');
      toast.success('Admin access verified');
    } catch (err: any) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (status === 'verified') {
    return <>{children}</>;
  }

  if (status === 'needs_setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Two-Factor Authentication Required</AlertTitle>
            <AlertDescription>
              Admin accounts must have 2FA enabled to access the Admin Dashboard. 
              Please set up two-factor authentication to continue.
            </AlertDescription>
          </Alert>

          <TwoFactorEnforcement 
            isRequired={true} 
            onComplete={() => checkMfaLevel()} 
          />

          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // needs_verify - show OTP input
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-destructive/10">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle>Admin Verification Required</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to access the Admin Dashboard.
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
            <InputOTP maxLength={6} value={code} onChange={setCode}>
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
            disabled={code.length !== 6 || isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Access Dashboard'
            )}
          </Button>

          <Button 
            variant="ghost" 
            onClick={handleSignOut}
            className="w-full text-muted-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMfaGate;
