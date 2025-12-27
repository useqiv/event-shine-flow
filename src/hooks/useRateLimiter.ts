import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  action: string;
}

interface RateLimitState {
  attempts: number[];
}

const rateLimitStore: Record<string, RateLimitState> = {};

export const useRateLimiter = (config: RateLimitConfig) => {
  const [isLimited, setIsLimited] = useState(false);

  const checkRateLimit = useCallback((key: string): boolean => {
    const now = Date.now();
    const storeKey = `${config.action}:${key}`;
    
    if (!rateLimitStore[storeKey]) {
      rateLimitStore[storeKey] = { attempts: [] };
    }
    
    // Clean old attempts outside the window
    rateLimitStore[storeKey].attempts = rateLimitStore[storeKey].attempts.filter(
      timestamp => now - timestamp < config.windowMs
    );
    
    if (rateLimitStore[storeKey].attempts.length >= config.maxAttempts) {
      const oldestAttempt = rateLimitStore[storeKey].attempts[0];
      const waitTime = Math.ceil((config.windowMs - (now - oldestAttempt)) / 1000);
      
      toast({
        title: "Too many attempts",
        description: `Please wait ${waitTime} seconds before trying again.`,
        variant: "destructive",
      });
      
      setIsLimited(true);
      return false;
    }
    
    rateLimitStore[storeKey].attempts.push(now);
    setIsLimited(false);
    return true;
  }, [config]);

  const getRemainingAttempts = useCallback((key: string): number => {
    const now = Date.now();
    const storeKey = `${config.action}:${key}`;
    
    if (!rateLimitStore[storeKey]) {
      return config.maxAttempts;
    }
    
    const validAttempts = rateLimitStore[storeKey].attempts.filter(
      timestamp => now - timestamp < config.windowMs
    );
    
    return Math.max(0, config.maxAttempts - validAttempts.length);
  }, [config]);

  const getTimeUntilReset = useCallback((key: string): number => {
    const now = Date.now();
    const storeKey = `${config.action}:${key}`;
    
    if (!rateLimitStore[storeKey] || rateLimitStore[storeKey].attempts.length === 0) {
      return 0;
    }
    
    const oldestAttempt = rateLimitStore[storeKey].attempts[0];
    const timeRemaining = config.windowMs - (now - oldestAttempt);
    
    return Math.max(0, Math.ceil(timeRemaining / 1000));
  }, [config]);

  return {
    checkRateLimit,
    isLimited,
    getRemainingAttempts,
    getTimeUntilReset,
  };
};

// Pre-configured rate limiters for common actions
export const useVoteRateLimiter = () => useRateLimiter({
  maxAttempts: 10,
  windowMs: 60000, // 1 minute
  action: 'vote',
});

export const useDonationRateLimiter = () => useRateLimiter({
  maxAttempts: 5,
  windowMs: 60000, // 1 minute
  action: 'donation',
});

export const useTicketRateLimiter = () => useRateLimiter({
  maxAttempts: 10,
  windowMs: 60000, // 1 minute
  action: 'ticket',
});
