import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitState {
  isLocked: boolean;
  attempts: number;
  maxAttempts: number;
  remainingAttempts: number;
  lockoutUntil: string | null;
}

const DEFAULT_STATE: RateLimitState = {
  isLocked: false,
  attempts: 0,
  maxAttempts: 5,
  remainingAttempts: 5,
  lockoutUntil: null,
};

export const useLoginRateLimit = () => {
  const [state, setState] = useState<RateLimitState>(DEFAULT_STATE);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Update remaining time countdown
  useEffect(() => {
    if (!state.isLocked || !state.lockoutUntil) {
      setRemainingTime(0);
      return;
    }

    const updateTime = () => {
      const lockoutTime = new Date(state.lockoutUntil!).getTime();
      const remaining = Math.max(0, lockoutTime - Date.now());
      setRemainingTime(remaining);
      
      // Auto-unlock when time expires
      if (remaining === 0) {
        setState(DEFAULT_STATE);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [state.isLocked, state.lockoutUntil]);

  // Check rate limit status from server
  const checkRateLimit = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('check_login_rate_limit', {
        p_email: email,
        p_ip_hash: null, // Could hash IP client-side if needed
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return DEFAULT_STATE;
      }

      // Type guard for the response
      const jsonData = data as Record<string, unknown>;
      const result: RateLimitState = {
        isLocked: Boolean(jsonData?.is_locked),
        attempts: Number(jsonData?.attempts) || 0,
        maxAttempts: Number(jsonData?.max_attempts) || 5,
        remainingAttempts: Number(jsonData?.remaining_attempts) || 5,
        lockoutUntil: jsonData?.lockout_until as string | null,
      };

      setState(result);
      return result;
    } catch (err) {
      console.error('Rate limit check failed:', err);
      return DEFAULT_STATE;
    }
  }, []);

  // Record a failed attempt (server-side)
  const recordFailedAttempt = useCallback(async (email: string) => {
    try {
      await supabase.rpc('record_login_attempt', {
        p_email: email,
        p_success: false,
        p_ip_hash: null,
      });

      // Re-check the rate limit status
      return await checkRateLimit(email);
    } catch (err) {
      console.error('Failed to record attempt:', err);
      return state;
    }
  }, [checkRateLimit, state]);

  // Record successful login and clear attempts
  const resetAttempts = useCallback(async (email: string) => {
    try {
      await supabase.rpc('clear_login_attempts', {
        p_email: email,
      });
      setState(DEFAULT_STATE);
    } catch (err) {
      console.error('Failed to clear attempts:', err);
    }
  }, []);

  // Format remaining time for display
  const formatRemainingTime = useCallback((ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    isLocked: state.isLocked,
    remainingAttempts: state.remainingAttempts,
    remainingTime,
    formattedRemainingTime: formatRemainingTime(remainingTime),
    checkRateLimit,
    recordFailedAttempt,
    resetAttempts,
    maxAttempts: state.maxAttempts,
  };
};
