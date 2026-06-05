import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { useLoginRateLimit } from '@/hooks/useLoginRateLimit';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import MfaVerificationForm from '@/components/auth/MfaVerificationForm';
import appLogo from '@/assets/logo.png';

const Auth = () => {
  const { signIn, signUp, signInWithGoogle, mfaState, verifyMfa, clearMfaState } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isLocked,
    remainingAttempts,
    formattedRemainingTime,
    checkRateLimit,
    recordFailedAttempt,
    resetAttempts,
  } = useLoginRateLimit();

  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');

  const handleLogin = async (email: string, password: string) => {
    setLoginEmail(email);

    // Check server-side rate limit
    const rateLimitStatus = await checkRateLimit(email);
    if (rateLimitStatus.isLocked) {
      toast({
        title: 'Account Temporarily Locked',
        description: `Too many failed attempts. Please try again in ${formattedRemainingTime}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error, mfaRequired } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      const attemptData = await recordFailedAttempt(email);
      toast({
        title: 'Login Failed',
        description: attemptData.isLocked
          ? 'Too many failed attempts. Your account is temporarily locked for 15 minutes.'
          : `${error.message}${attemptData.remainingAttempts > 0 ? ` (${attemptData.remainingAttempts} attempts remaining)` : ''}`,
        variant: 'destructive',
      });
    } else if (mfaRequired) {
      toast({
        title: 'Verification Required',
        description: 'Please enter your 2FA code to continue.',
      });
    } else {
      await resetAttempts(email);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/dashboard');
    }
  };

  const handleMfaVerify = async (code: string) => {
    if (!mfaState.factorId) return;

    setIsLoading(true);
    const { error } = await verifyMfa(mfaState.factorId, code);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Verification Failed',
        description: 'Invalid code. Please try again.',
        variant: 'destructive',
      });
    } else {
      await resetAttempts(loginEmail);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/dashboard');
    }
  };

  const handleMfaCancel = () => {
    clearMfaState();
  };

  const handleSignup = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Signup Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account Created!',
        description: 'Please check your email to verify your account, then complete your account setup.',
      });
      navigate('/account-setup');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Show MFA verification screen if required
  if (mfaState.required && mfaState.factorId) {
    return (
      <MfaVerificationForm
        onVerify={handleMfaVerify}
        onCancel={handleMfaCancel}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <Link to="/" className="flex items-center justify-center">
            <img
              alt="USEQIV"
              className="h-12 w-auto"
              src={appLogo}
            />
          </Link>
        </div>

        <Card className="border-border/50">
          <Tabs defaultValue="login">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="login">
              <LoginForm
                onSubmit={handleLogin}
                onGoogleLogin={handleGoogleLogin}
                isLoading={isLoading}
                isLocked={isLocked}
                remainingAttempts={remainingAttempts}
                formattedRemainingTime={formattedRemainingTime}
              />
            </TabsContent>

            <TabsContent value="signup">
              <SignupForm
                onSubmit={handleSignup}
                onGoogleLogin={handleGoogleLogin}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
