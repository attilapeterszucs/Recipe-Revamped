export interface LocationData {
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  vatRate: number;
  isEU: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  basePrice: number; // Base price in USD
  yearlyDiscount: number; // Percentage discount for yearly
  features: string[];
}

export interface LocalizedPrice {
  gross: number; // Price including VAT
  net: number;   // Price excluding VAT
  vat: number;   // VAT amount
  currency: string;
  currencySymbol: string;
  formatted: string; // Formatted price string
}