import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'user_preferred_currency';
const DEFAULT_CURRENCY = 'USD';

export const useUserCurrency = () => {
  const [preferredCurrency, setPreferredCurrency] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY;
    }
    return DEFAULT_CURRENCY;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, preferredCurrency);
  }, [preferredCurrency]);

  const updatePreferredCurrency = useCallback((currency: string) => {
    setPreferredCurrency(currency);
  }, []);

  return {
    preferredCurrency,
    updatePreferredCurrency,
  };
};
