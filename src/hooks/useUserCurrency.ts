import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'user_preferred_currency';
const DISPLAY_PREF_KEY = 'user_show_converted_default';
const DEFAULT_CURRENCY = 'USD';

export const useUserCurrency = () => {
  const [preferredCurrency, setPreferredCurrency] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY;
    }
    return DEFAULT_CURRENCY;
  });

  const [showConvertedByDefault, setShowConvertedByDefault] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(DISPLAY_PREF_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, preferredCurrency);
  }, [preferredCurrency]);

  useEffect(() => {
    localStorage.setItem(DISPLAY_PREF_KEY, showConvertedByDefault.toString());
  }, [showConvertedByDefault]);

  const updatePreferredCurrency = useCallback((currency: string) => {
    setPreferredCurrency(currency);
  }, []);

  const updateShowConvertedByDefault = useCallback((show: boolean) => {
    setShowConvertedByDefault(show);
  }, []);

  return {
    preferredCurrency,
    updatePreferredCurrency,
    showConvertedByDefault,
    updateShowConvertedByDefault,
  };
};
