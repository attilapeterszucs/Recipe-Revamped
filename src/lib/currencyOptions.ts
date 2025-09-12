import { DollarSign, Euro, Banknote } from 'lucide-react';
import type React from 'react';
import type { LocationData } from '../types/pricing';

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Currency names mapping
const CURRENCY_NAMES: Record<string, string> = {
  'USD': 'US Dollar',
  'EUR': 'Euro',
  'GBP': 'British Pound',
  'HUF': 'Hungarian Forint',
  'CAD': 'Canadian Dollar',
  'AUD': 'Australian Dollar',
  'JPY': 'Japanese Yen',
  'CHF': 'Swiss Franc',
  'NOK': 'Norwegian Krone',
  'SEK': 'Swedish Krona',
  'DKK': 'Danish Krone',
  'PLN': 'Polish Złoty',
  'CZK': 'Czech Koruna'
};

// Base currencies always shown
export const BASE_CURRENCIES: CurrencyOption[] = [
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    icon: DollarSign
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    icon: Euro
  }
];

// Create currency option from location data
export const createCurrencyOption = (location: LocationData): CurrencyOption => {
  return {
    code: location.currency,
    symbol: location.currencySymbol,
    name: CURRENCY_NAMES[location.currency] || location.currency,
    icon: getCurrencyIcon(location.currency)
  };
};

// Get icon for currency
const getCurrencyIcon = (currency: string): React.ComponentType<{ className?: string }> => {
  switch (currency) {
    case 'USD':
      return DollarSign;
    case 'EUR':
      return Euro;
    default:
      return Banknote;
  }
};

// Helper function to get ordered currencies with detected currency first
export const getOrderedCurrencies = (detectedLocation: LocationData): CurrencyOption[] => {
  const detectedCurrency = detectedLocation.currency;
  
  // Create currency option for detected location
  const detectedOption = createCurrencyOption(detectedLocation);
  
  // Get base currencies excluding the detected one (if it's already in base currencies)
  const otherBaseCurrencies = BASE_CURRENCIES.filter(c => c.code !== detectedCurrency);
  
  // If detected currency is already USD or EUR, just reorder
  if (detectedCurrency === 'USD' || detectedCurrency === 'EUR') {
    return [detectedOption, ...otherBaseCurrencies];
  }
  
  // If detected currency is different, show: [Detected, USD, EUR]
  return [detectedOption, ...BASE_CURRENCIES];
};