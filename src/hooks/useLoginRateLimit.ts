import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptData {
  count: number;
  firstAttemptTime: number;
  lockedUntil: number | null;
}

const getStoredData = (): AttemptData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Invalid data, reset
  }
  return { count: 0, firstAttemptTime: 0, lockedUntil: null };
};

const setStoredData = (data: AttemptData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const useLoginRateLimit = () => {
  const [attemptData, setAttemptData] = useState<AttemptData>(getStoredData);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Check if currently locked
  const isLocked = attemptData.lockedUntil !== null && Date.now() < attemptData.lockedUntil;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attemptData.count);

  // Update remaining time countdown
  useEffect(() => {
    if (!isLocked) {
      setRemainingTime(0);
      return;
    }

    const updateTime = () => {
      const remaining = Math.max(0, (attemptData.lockedUntil || 0) - Date.now());
      setRemainingTime(remaining);
      
      // Auto-unlock when time expires
      if (remaining === 0) {
        const newData: AttemptData = { count: 0, firstAttemptTime: 0, lockedUntil: null };
        setAttemptData(newData);
        setStoredData(newData);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isLocked, attemptData.lockedUntil]);

  // Record a failed attempt
  const recordFailedAttempt = useCallback(() => {
    const now = Date.now();
    const currentData = getStoredData();
    
    // Reset if first attempt was more than lockout duration ago
    const shouldReset = currentData.firstAttemptTime && 
      (now - currentData.firstAttemptTime) > LOCKOUT_DURATION_MS;
    
    const newCount = shouldReset ? 1 : currentData.count + 1;
    const newFirstAttemptTime = shouldReset ? now : (currentData.firstAttemptTime || now);
    
    const newData: AttemptData = {
      count: newCount,
      firstAttemptTime: newFirstAttemptTime,
      lockedUntil: newCount >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION_MS : null,
    };
    
    setAttemptData(newData);
    setStoredData(newData);
    
    return newData;
  }, []);

  // Reset on successful login
  const resetAttempts = useCallback(() => {
    const newData: AttemptData = { count: 0, firstAttemptTime: 0, lockedUntil: null };
    setAttemptData(newData);
    setStoredData(newData);
  }, []);

  // Format remaining time for display
  const formatRemainingTime = useCallback((ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    isLocked,
    remainingAttempts,
    remainingTime,
    formattedRemainingTime: formatRemainingTime(remainingTime),
    recordFailedAttempt,
    resetAttempts,
    maxAttempts: MAX_ATTEMPTS,
  };
};
