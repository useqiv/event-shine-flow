import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError, Factor } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { resetAdminVerification } from '@/components/admin/AdminMfaGate';

interface MfaState {
  required: boolean;
  factorId: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mfaState: MfaState;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; mfaRequired?: boolean; factorId?: string }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  verifyMfa: (factorId: string, code: string) => Promise<{ error: Error | null }>;
  clearMfaState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaState, setMfaState] = useState<MfaState>({ required: false, factorId: null });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Clear MFA state on sign out
        if (event === 'SIGNED_OUT') {
          setMfaState({ required: false, factorId: null });
          resetAdminVerification();
          return;
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    // Use production URL for email redirects, fallback to current origin for local dev
    const productionUrl = 'https://www.useqiv.com';
    const redirectUrl = import.meta.env.PROD 
      ? `${productionUrl}/account-setup`
      : `${window.location.origin}/account-setup`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
        }
      }
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { error: error as Error | null };
    }

    return { error: null };
  };

  const verifyMfa = async (factorId: string, code: string) => {
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        return { error: challengeError as Error };
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        return { error: verifyError as Error };
      }

      setMfaState({ required: false, factorId: null });
      return { error: null };
    } catch (error: any) {
      return { error: error as Error };
    }
  };

  const clearMfaState = () => {
    setMfaState({ required: false, factorId: null });
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setMfaState({ required: false, factorId: null });
      resetAdminVerification();
      
      // Sign out from Supabase (this clears tokens from storage)
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Sign out error:', error.message);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, ensure local state is cleared
      setUser(null);
      setSession(null);
      setMfaState({ required: false, factorId: null });
      resetAdminVerification();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, mfaState, signUp, signIn, signInWithGoogle, signOut, verifyMfa, clearMfaState }}>
      {children}
    </AuthContext.Provider>
  );
};
