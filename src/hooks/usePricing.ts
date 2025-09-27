import { useState, useEffect } from 'react';
import type { LocationData, LocalizedPrice } from '../types/pricing';
import { calculateLocalizedPrice, basePlans } from '../lib/pricing';
import { logger } from '../lib/logger';

interface UsePricingOptions {
  location: LocationData;
  isYearly: boolean;
  loading?: boolean;
}

interface PricingState {
  prices: (LocalizedPrice | null)[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export const usePricing = ({ location, isYearly, loading: locationLoading = false }: UsePricingOptions) => {
  const [state, setState] = useState<PricingState>({
    prices: [null, null, null, null],
    loading: true,
    error: null,
    lastUpdated: null
  });

  useEffect(() => {
    if (locationLoading) {
      setState(prev => ({ ...prev, loading: true }));
      return;
    }

    const calculatePrices = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const pricePromises = basePlans.map(async (plan, index) => {
          if (index === 0) {
            // Free plan - return a mock LocalizedPrice with 0 values
            return {
              gross: 0,
              net: 0,
              vat: 0,
              currency: location.currency,
              currencySymbol: location.currencySymbol,
              formatted: '0'
            };
          }
          
          return await calculateLocalizedPrice(
            plan.basePrice,
            location,
            isYearly,
            plan.yearlyDiscount
          );
        });

        const prices = await Promise.all(pricePromises);
        
        setState({
          prices,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        });
      } catch (error) {
        logger.error('Failed to calculate prices:', { error });
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load pricing'
        }));
      }
    };

    calculatePrices();
  }, [location, isYearly, locationLoading]);

  const refreshPrices = async () => {
    if (locationLoading) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const pricePromises = basePlans.map(async (plan, index) => {
        if (index === 0) {
          return {
            gross: 0,
            net: 0,
            vat: 0,
            currency: location.currency,
            currencySymbol: location.currencySymbol,
            formatted: '0'
          };
        }
        
        return await calculateLocalizedPrice(
          plan.basePrice,
          location,
          isYearly,
          plan.yearlyDiscount
        );
      });

      const prices = await Promise.all(pricePromises);
      
      setState({
        prices,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      });
    } catch (error) {
      logger.error('Failed to refresh prices:', { error });
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh pricing'
      }));
    }
  };

  return {
    ...state,
    refreshPrices,
    getPrice: (planIndex: number) => state.prices[planIndex],
    isLoading: state.loading || locationLoading
  };
};