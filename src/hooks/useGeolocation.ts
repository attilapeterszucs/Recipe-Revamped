import { useState, useEffect } from 'react';
import type { LocationData } from '../types/pricing';

// Re-export for convenience
export type { LocationData };

const countryData: Record<string, LocationData> = {
  'HU': {
    country: 'Hungary',
    countryCode: 'HU',
    currency: 'HUF',
    currencySymbol: 'Ft',
    vatRate: 27,
    isEU: true
  },
  'US': {
    country: 'United States',
    countryCode: 'US',
    currency: 'USD',
    currencySymbol: '$',
    vatRate: 0,
    isEU: false
  },
  'GB': {
    country: 'United Kingdom',
    countryCode: 'GB',
    currency: 'GBP',
    currencySymbol: '£',
    vatRate: 20,
    isEU: false
  },
  'DE': {
    country: 'Germany',
    countryCode: 'DE',
    currency: 'EUR',
    currencySymbol: '€',
    vatRate: 19,
    isEU: true
  },
  'FR': {
    country: 'France',
    countryCode: 'FR',
    currency: 'EUR',
    currencySymbol: '€',
    vatRate: 20,
    isEU: true
  },
  'IT': {
    country: 'Italy',
    countryCode: 'IT',
    currency: 'EUR',
    currencySymbol: '€',
    vatRate: 22,
    isEU: true
  },
  'ES': {
    country: 'Spain',
    countryCode: 'ES',
    currency: 'EUR',
    currencySymbol: '€',
    vatRate: 21,
    isEU: true
  },
  'NL': {
    country: 'Netherlands',
    countryCode: 'NL',
    currency: 'EUR',
    currencySymbol: '€',
    vatRate: 21,
    isEU: true
  },
  'CA': {
    country: 'Canada',
    countryCode: 'CA',
    currency: 'CAD',
    currencySymbol: '$',
    vatRate: 13,
    isEU: false
  },
  'AU': {
    country: 'Australia',
    countryCode: 'AU',
    currency: 'AUD',
    currencySymbol: '$',
    vatRate: 10,
    isEU: false
  },
  'JP': {
    country: 'Japan',
    countryCode: 'JP',
    currency: 'JPY',
    currencySymbol: '¥',
    vatRate: 10,
    isEU: false
  },
  'CH': {
    country: 'Switzerland',
    countryCode: 'CH',
    currency: 'CHF',
    currencySymbol: 'CHF',
    vatRate: 7.7,
    isEU: false
  },
  'NO': {
    country: 'Norway',
    countryCode: 'NO',
    currency: 'NOK',
    currencySymbol: 'kr',
    vatRate: 25,
    isEU: false
  },
  'SE': {
    country: 'Sweden',
    countryCode: 'SE',
    currency: 'SEK',
    currencySymbol: 'kr',
    vatRate: 25,
    isEU: true
  },
  'DK': {
    country: 'Denmark',
    countryCode: 'DK',
    currency: 'DKK',
    currencySymbol: 'kr',
    vatRate: 25,
    isEU: true
  },
  'PL': {
    country: 'Poland',
    countryCode: 'PL',
    currency: 'PLN',
    currencySymbol: 'zł',
    vatRate: 23,
    isEU: true
  },
  'CZ': {
    country: 'Czech Republic',
    countryCode: 'CZ',
    currency: 'CZK',
    currencySymbol: 'Kč',
    vatRate: 21,
    isEU: true
  }
};

// Default to US if location cannot be determined
const defaultLocation: LocationData = countryData['US'];

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationData>(defaultLocation);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectLocation = async () => {
      // Check if location is already cached
      const cachedLocation = localStorage.getItem('user-location');
      if (cachedLocation) {
        try {
          const parsed = JSON.parse(cachedLocation);
          setLocation(parsed);
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem('user-location');
        }
      }

      try {
        // Try multiple geolocation services with fallbacks
        await tryGeolocationServices();
      } catch (err) {
        // Silent fallback to default location
        setLocation(defaultLocation);
      } finally {
        setLoading(false);
      }
    };

    const tryGeolocationServices = async () => {
      // Use browser's navigator.language as primary detection method
      const browserLanguage = navigator.language || 'en-US';
      const langCountryCode = browserLanguage.split('-')[1];
      
      if (langCountryCode && countryData[langCountryCode]) {
        const locationData = countryData[langCountryCode];
        setLocation(locationData);
        localStorage.setItem('user-location', JSON.stringify(locationData));
      } else {
        setLocation(defaultLocation);
        localStorage.setItem('user-location', JSON.stringify(defaultLocation));
      }
    };

    detectLocation();
  }, []);

  return { location, loading, error };
};