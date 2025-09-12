import type { LocationData, PricingPlan, LocalizedPrice } from '../types/pricing';
import { getCurrentExchangeRates } from './exchangeRates';

export const basePlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    basePrice: 0,
    yearlyDiscount: 0,
    features: [
      '5 recipes in Recipe Book',
      '10 recipe conversions per day',
      'Basic diet filters (Vegan, Gluten-Free, Vegetarian, Dairy-Free)',
      'Local processing only',
      'No meal planning',
      'No default preferences',
      'No backup/restore'
    ]
  },
  {
    id: 'chef',
    name: 'Chef',
    basePrice: 14.99,
    yearlyDiscount: 20,
    features: [
      '100 recipes in Recipe Book',
      'Unlimited conversions',
      'All diet filters (16 options)',
      'Meal planning calendar',
      'Default recipe preferences',
      'Backup & restore recipes',
      'Cloud storage',
      'Export to PDF',
      'Email support'
    ]
  },
  {
    id: 'master-chef',
    name: 'Master Chef',
    basePrice: 19.99,
    yearlyDiscount: 20,
    features: [
      '1,000 recipes in Recipe Book',
      'Everything in Chef plan',
      'Advanced nutrition analysis',
      'Recipe collections & tags',
      'Advanced meal planning',
      'Custom default preferences',
      'Advanced backup/restore',
      'Priority support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    basePrice: 39.95,
    yearlyDiscount: 25,
    features: [
      '2,500 recipes per user',
      'Everything in Master Chef',
      'Team meal planning',
      'Organization-wide preferences',
      'Enterprise backup/restore',
      'Unlimited cloud storage',
      'Team collaboration',
      'API access',
      '24/7 phone support'
    ]
  }
];

// Real-time exchange rates are now fetched from API


export const calculateLocalizedPrice = async (
  basePriceUSD: number,
  location: LocationData,
  isYearly: boolean = false,
  yearlyDiscount: number = 0
): Promise<LocalizedPrice> => {
  // Apply yearly discount first
  let finalPriceUSD = basePriceUSD;
  if (isYearly) {
    finalPriceUSD = basePriceUSD * 12 * (1 - yearlyDiscount / 100);
  }

  // Get real-time exchange rates
  const exchangeRates = await getCurrentExchangeRates();
  const exchangeRate = exchangeRates[location.currency] || 1;
  const priceInLocalCurrency = finalPriceUSD * exchangeRate;

  // Calculate VAT
  const vatMultiplier = 1 + (location.vatRate / 100);
  const netPrice = priceInLocalCurrency;
  const grossPrice = netPrice * vatMultiplier;
  const vatAmount = grossPrice - netPrice;

  // Format the price
  let formatted: string;
  if (location.currency === 'HUF') {
    formatted = `${Math.round(grossPrice).toLocaleString('hu-HU')} ${location.currencySymbol}`;
  } else if (location.currency === 'JPY') {
    // Japanese Yen doesn't use decimals
    formatted = `${location.currencySymbol}${Math.round(grossPrice).toLocaleString('ja-JP')}`;
  } else {
    formatted = `${location.currencySymbol}${grossPrice.toFixed(2)}`;
  }

  return {
    gross: grossPrice,
    net: netPrice,
    vat: vatAmount,
    currency: location.currency,
    currencySymbol: location.currencySymbol,
    formatted
  };
};

export const formatPrice = (price: number, currency: string, currencySymbol: string): string => {
  if (currency === 'HUF') {
    return `${Math.round(price).toLocaleString('hu-HU')} ${currencySymbol}`;
  } else {
    return `${currencySymbol}${price.toFixed(2)}`;
  }
};

export const getPlanByIndex = (index: number): PricingPlan | null => {
  return basePlans[index] || null;
};

// Calculate yearly savings for a plan
export const calculateYearlySavings = (
  basePriceUSD: number,
  yearlyDiscount: number,
  exchangeRate: number = 1,
  currencySymbol: string = '$'
): { savingsAmount: string; savingsPercentage: number } => {
  const monthlyTotal = basePriceUSD * 12 * exchangeRate;
  const yearlyPrice = basePriceUSD * 12 * (1 - yearlyDiscount / 100) * exchangeRate;
  const savingsAmount = monthlyTotal - yearlyPrice;
  
  // Format savings amount
  let formattedSavings: string;
  if (currencySymbol === 'Ft') {
    // Hungarian Forint - no decimals
    formattedSavings = `${Math.round(savingsAmount).toLocaleString('hu-HU')} ${currencySymbol}`;
  } else if (currencySymbol === '¥') {
    // Japanese Yen - no decimals
    formattedSavings = `${currencySymbol}${Math.round(savingsAmount).toLocaleString('ja-JP')}`;
  } else {
    formattedSavings = `${currencySymbol}${savingsAmount.toFixed(2)}`;
  }
  
  return {
    savingsAmount: formattedSavings,
    savingsPercentage: yearlyDiscount
  };
};