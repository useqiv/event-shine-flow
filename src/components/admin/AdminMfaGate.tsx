import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, ShieldAlert, Loader2, LogOut, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AdminMfaGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    // Check if already verified this session
    const verified = sessionStorage.getItem('admin_verified');
    if (verified === 'true') {
      setStatus('verified');
    } else {
      sendVerificationCode();
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${local[1]}${'*'.repeat(Math.min(local.length - 2, 5))}@${domain}`;
  };

  const sendVerificationCode = async () => {
    setIsSending(true);
    setError(null);
    setStatus('sending');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expired. Please sign in again.');
        setIsSending(false);
        return;
      }

      const response = await supabase.functions.invoke('send-admin-verification', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        const errorMsg = response.error.message || 'Failed to send verification code';
        setError(errorMsg);
        setStatus('verify');
        setIsSending(false);
        return;
      }

      const data = response.data;
      if (data?.error) {
        setError(data.error);
        setStatus('verify');
        setIsSending(false);
        return;
      }

      setMaskedEmail(maskEmail(data?.email || user?.email || ''));
      setStatus('verify');
      setCooldown(60);
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      setError('Failed to send verification code. Please try again.');
      setStatus('verify');
      console.error('Send verification error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setIsVerifying(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expired. Please sign in again.');
        setIsVerifying(false);
        return;
      }

      const response = await supabase.functions.invoke('verify-admin-code', {
        body: { code },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        setError('Invalid or expired code. Please try again.');
        setCode('');
        setIsVerifying(false);
        return;
      }

      const data = response.data;
      if (data?.error) {
        setError(data.error);
        setCode('');
        setIsVerifying(false);
        return;
      }

      // Mark as verified for this session
      sessionStorage.setItem('admin_verified', 'true');
      setStatus('verified');
      toast.success('Admin access verified');
    } catch (err: any) {
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
    sessionStorage.removeItem('admin_verified');
    await signOut();
    navigate('/auth');
  };

  if (status === 'loading' || status === 'sending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {status === 'sending' ? 'Sending verification code...' : 'Verifying admin access...'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'verified') {
    return <>{children}</>;
  }

  // verify - show OTP input
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>Admin Verification Required</CardTitle>
          <CardDescription className="space-y-1">
            <span className="block">
              A 6-digit verification code has been sent to
            </span>
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
