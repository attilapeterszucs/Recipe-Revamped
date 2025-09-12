interface ExchangeRateResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface CachedRates {
  rates: Record<string, number>;
  timestamp: number;
  expiry: number;
}

// Cache duration: 1 hour (3600000 ms)
const CACHE_DURATION = 3600000;
const STORAGE_KEY = 'exchange_rates_cache';

// Fallback rates (updated as of January 2025) - used if API fails
const fallbackRates: Record<string, number> = {
  'USD': 1.0,
  'EUR': 0.94,
  'GBP': 0.81,
  'HUF': 395.50,
  'CAD': 1.44,
  'AUD': 1.61,
  'JPY': 157.20,
  'CHF': 0.91,
  'NOK': 11.45,
  'SEK': 11.12,
  'DKK': 7.01,
  'PLN': 4.12,
  'CZK': 24.38
};

class ExchangeRateService {
  private cache: CachedRates | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.expiry > Date.now()) {
          this.cache = data;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to load exchange rates from storage:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private saveToStorage(rates: Record<string, number>): void {
    try {
      const data: CachedRates = {
        rates,
        timestamp: Date.now(),
        expiry: Date.now() + CACHE_DURATION
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.cache = data;
    } catch (error) {
      console.warn('Failed to save exchange rates to storage:', error);
    }
  }

  async getExchangeRates(): Promise<Record<string, number>> {
    // Return cached rates if still valid
    if (this.cache && this.cache.expiry > Date.now()) {
      return this.cache.rates;
    }

    try {
      // Try multiple free exchange rate APIs
      const rates = await this.fetchFromAPIs();
      this.saveToStorage(rates);
      return rates;
    } catch (error) {
      console.warn('Failed to fetch live exchange rates, using fallback:', error);
      
      // If we have expired cache, use it instead of fallback
      if (this.cache && this.cache.rates) {
        console.info('Using expired cached rates');
        return this.cache.rates;
      }
      
      // Last resort: use fallback rates
      console.info('Using fallback exchange rates');
      return fallbackRates;
    }
  }

  private async fetchFromAPIs(): Promise<Record<string, number>> {
    // Exchange rates functionality removed - using USD only for payments
    // Return fallback rates which are hardcoded USD-based rates
    console.info('Using hardcoded USD-based exchange rates (exchange rate API removed)');
    return fallbackRates;
  }

  // Get exchange rate for a specific currency
  async getRate(currency: string): Promise<number> {
    const rates = await this.getExchangeRates();
    return rates[currency.toUpperCase()] || rates[currency.toLowerCase()] || 1.0;
  }

  // Force refresh rates (useful for manual refresh)
  async refreshRates(): Promise<Record<string, number>> {
    this.cache = null;
    localStorage.removeItem(STORAGE_KEY);
    return await this.getExchangeRates();
  }

  // Get cache status
  getCacheInfo(): { cached: boolean; age?: number; expires?: number } {
    if (!this.cache) {
      return { cached: false };
    }

    return {
      cached: true,
      age: Date.now() - this.cache.timestamp,
      expires: this.cache.expiry
    };
  }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateService();

// Export helper function for easy use
export const getCurrentExchangeRates = () => exchangeRateService.getExchangeRates();
export const getExchangeRate = (currency: string) => exchangeRateService.getRate(currency);
export const refreshExchangeRates = () => exchangeRateService.refreshRates();