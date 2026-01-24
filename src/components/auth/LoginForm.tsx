import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Eye, EyeOff, Mail, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { emailSchema, passwordSchema } from '@/lib/validationSchemas';
import { z } from 'zod';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  isLoading: boolean;
  isLocked: boolean;
  remainingAttempts: number;
  formattedRemainingTime: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onGoogleLogin,
  isLoading,
  isLocked,
  remainingAttempts,
  formattedRemainingTime,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setValidationError(err.errors[0].message);
        return;
      }
    }
    
    await onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        <CardDescription className="text-center">
          Welcome back! Sign in to your account.
        </CardDescription>
        
        {isLocked && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Too many failed login attempts. Please try again in {formattedRemainingTime}.
            </AlertDescription>
          </Alert>
        )}
        
        {!isLocked && remainingAttempts < 5 && remainingAttempts > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {remainingAttempts} login attempt{remainingAttempts !== 1 ? 's' : ''} remaining before temporary lockout.
            </AlertDescription>
          </Alert>
        )}

        {validationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
              disabled={isLocked}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              required
              disabled={isLocked}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex justify-end">
            <ForgotPasswordDialog />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <Button type="submit" className="w-full" disabled={isLoading || isLocked}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : isLocked ? (
            `Locked (${formattedRemainingTime})`
          ) : (
            'Sign In'
          )}
        </Button>
        
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        
        <GoogleButton onClick={onGoogleLogin} isLoading={isLoading} />
      </CardFooter>
    </form>
  );
};

export default LoginForm;
