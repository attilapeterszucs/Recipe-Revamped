import { useState, useEffect } from 'react';
import type { LocationData } from '../types/pricing';

interface CurrencyOverrideData {
  code: string;
  symbol: string;
  vatRate: number;
  isEU: boolean;
}

// Extended currency override data - will use detected location data where possible
const CURRENCY_OVERRIDES: Record<string, CurrencyOverrideData> = {
  'USD': {
    code: 'USD',
    symbol: '$',
    vatRate: 0,
    isEU: false
  },
  'EUR': {
    code: 'EUR',
    symbol: '€',
    vatRate: 20, // Average EU VAT rate
    isEU: true
  },
  'GBP': {
    code: 'GBP',
    symbol: '£',
    vatRate: 20,
    isEU: false
  },
  'HUF': {
    code: 'HUF',
    symbol: 'Ft',
    vatRate: 27,
    isEU: true
  },
  'CAD': {
    code: 'CAD',
    symbol: '$',
    vatRate: 13,
    isEU: false
  },
  'AUD': {
    code: 'AUD',
    symbol: '$',
    vatRate: 10,
    isEU: false
  },
  'JPY': {
    code: 'JPY',
    symbol: '¥',
    vatRate: 10,
    isEU: false
  },
  'CHF': {
    code: 'CHF',
    symbol: 'CHF',
    vatRate: 7.7,
    isEU: false
  },
  'NOK': {
    code: 'NOK',
    symbol: 'kr',
    vatRate: 25,
    isEU: false
  },
  'SEK': {
    code: 'SEK',
    symbol: 'kr',
    vatRate: 25,
    isEU: true
  },
  'DKK': {
    code: 'DKK',
    symbol: 'kr',
    vatRate: 25,
    isEU: true
  },
  'PLN': {
    code: 'PLN',
    symbol: 'zł',
    vatRate: 23,
    isEU: true
  },
  'CZK': {
    code: 'CZK',
    symbol: 'Kč',
    vatRate: 21,
    isEU: true
  }
};

export const useCurrencyOverride = (detectedLocation: LocationData) => {
  // Initialize with detected currency directly, fallback to USD if not supported
  const getInitialCurrency = (location: LocationData): string => {
    return CURRENCY_OVERRIDES[location.currency] ? location.currency : 'USD';
  };

  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => getInitialCurrency(detectedLocation));
  const [overrideLocation, setOverrideLocation] = useState<LocationData>(detectedLocation);

  // Update selected currency when detected location changes
  useEffect(() => {
    const newCurrency = getInitialCurrency(detectedLocation);
    setSelectedCurrency(newCurrency);
  }, [detectedLocation]);

  // Update override location when currency selection changes
  useEffect(() => {
    const currencyData = CURRENCY_OVERRIDES[selectedCurrency];
    if (currencyData) {
      // If selected currency matches detected currency, use original location data for accuracy
      if (selectedCurrency === detectedLocation.currency) {
        setOverrideLocation(detectedLocation);
      } else {
        // Override with currency data for different currency selection
        setOverrideLocation({
          ...detectedLocation,
          currency: currencyData.code,
          currencySymbol: currencyData.symbol,
          vatRate: currencyData.vatRate,
          isEU: currencyData.isEU
        });
      }
    }
  }, [selectedCurrency, detectedLocation]);

  const handleCurrencyChange = (newCurrency: string) => {
    if (CURRENCY_OVERRIDES[newCurrency]) {
      setSelectedCurrency(newCurrency);
    }
  };

  const resetToDetected = () => {
    const newCurrency = getInitialCurrency(detectedLocation);
    setSelectedCurrency(newCurrency);
  };

  return {
    selectedCurrency,
    overrideLocation,
    handleCurrencyChange,
    resetToDetected,
    isOverridden: selectedCurrency !== detectedLocation.currency,
    supportedCurrencies: Object.keys(CURRENCY_OVERRIDES)
  };
};