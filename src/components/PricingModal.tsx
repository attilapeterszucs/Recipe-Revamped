import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Star, Zap, Crown, Building, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGeolocation } from '../hooks/useGeolocation';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { calculateLocalizedPrice } from '../lib/pricing';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import { logger } from '../lib/logger';
import type { SubscriptionPlan } from '../types/subscription';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: SubscriptionPlan;
  source?: string;
}

// Stripe Payment Links - Live Production
const STRIPE_PAYMENT_LINKS = {
  chef: {
    monthly: 'https://buy.stripe.com/28E00k5wp0IOdby84yawo08',
    yearly: 'https://buy.stripe.com/eVq00k7Ex0IO8VigB4awo09'
  },
  'master-chef': {
    monthly: 'https://buy.stripe.com/8x26oI1g9ajognK1Gaawo0a',
    yearly: 'https://buy.stripe.com/9B6bJ26At2QWdby84yawo0b'
  }
};


export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  defaultPlan = 'chef',
  source = 'modal'
}) => {
  const { user } = useAuth();
  const { subscription } = useSubscriptionStatus();
  const { location, loading: locationLoading } = useGeolocation();
  const { createPortalSession, loading: portalLoading } = useStripeCheckout();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(defaultPlan);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [localizedPrices, setLocalizedPrices] = useState<Record<string, any>>({});

  // Lock body scroll when pricing modal is open
  useBodyScrollLock(isOpen);

  // Check if user has an existing subscription
  const hasActiveSubscription = subscription && subscription.plan !== 'free' && subscription.status === 'active';

  // Calculate localized prices
  useEffect(() => {
    const calculatePrices = async () => {
      if (!location) return;

      const prices: Record<string, any> = {};

      for (const [planId, planDetails] of Object.entries(SUBSCRIPTION_PLANS)) {
        if (planId === 'free') continue;

        const monthlyPrice = await calculateLocalizedPrice(
          planDetails.basePrice,
          location,
          false,
          planDetails.yearlyDiscount
        );

        const yearlyPrice = await calculateLocalizedPrice(
          planDetails.basePrice,
          location,
          true,
          planDetails.yearlyDiscount
        );

        prices[planId] = {
          monthly: monthlyPrice,
          yearly: yearlyPrice,
          savings: yearlyPrice ? {
            amount: (monthlyPrice.gross * 12 - yearlyPrice.gross).toFixed(2),
            percentage: planDetails.yearlyDiscount
          } : null
        };
      }

      setLocalizedPrices(prices);
    };

    calculatePrices();
  }, [location]);

  const handleSubscribe = async (plan: SubscriptionPlan, period: 'monthly' | 'yearly') => {
    if (!user) {
      // Redirect to sign in
      window.location.href = '/signin';
      return;
    }

    if (plan === 'enterprise') {
      // For enterprise, redirect to contact
      window.location.href = '/contact?subject=Enterprise%20Plan';
      return;
    }

    // If user has active subscription, open customer portal for upgrades
    if (hasActiveSubscription) {
      try {
        const portalUrl = await createPortalSession();
        window.open(portalUrl, '_blank');
      } catch (error) {
        logger.error('Failed to open customer portal:', { error });
        alert('Failed to open billing portal. Please try again.');
      }
      return;
    }

    // For new subscriptions, use payment links
    const paymentLink = STRIPE_PAYMENT_LINKS[plan as keyof typeof STRIPE_PAYMENT_LINKS]?.[period];
    if (!paymentLink) {
      logger.error('Payment link not found for plan:', { plan, period });
      return;
    }

    // Add user email as prefill parameter
    const url = new URL(paymentLink);
    if (user.email) {
      url.searchParams.set('prefilled_email', user.email);
    }

    // Open payment link in same window
    window.location.href = url.toString();
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'chef': return <Zap className="w-8 h-8" />;
      case 'master-chef': return <Crown className="w-8 h-8" />;
      case 'enterprise': return <Building className="w-8 h-8" />;
      default: return <Star className="w-8 h-8" />;
    }
  };

  const getPlanColor = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'chef': return 'text-blue-600 bg-blue-50';
      case 'master-chef': return 'text-purple-600 bg-purple-50';
      case 'enterprise': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPlanBorderColor = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'chef': return 'border-blue-200';
      case 'master-chef': return 'border-purple-200';
      case 'enterprise': return 'border-indigo-200';
      default: return 'border-gray-200';
    }
  };

  if (!isOpen) return null;

  const paidPlans = Object.entries(SUBSCRIPTION_PLANS).filter(([id]) => id !== 'free' && id !== 'enterprise');

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="text-gray-600 mt-1">Upgrade to unlock advanced features</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Billing Period Toggle */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="px-6 pb-6">
          <div className="grid md:grid-cols-3 gap-6">
            {paidPlans.map(([planId, planDetails]) => {
              const plan = planId as SubscriptionPlan;
              const isSelected = selectedPlan === plan;
              const priceInfo = localizedPrices[plan];
              const currentPrice = priceInfo?.[billingPeriod];
              const isPopular = plan === 'chef';

              return (
                <div
                  key={plan}
                  className={`relative rounded-xl border-2 p-6 ${
                    isSelected
                      ? getPlanBorderColor(plan)
                      : 'border-gray-200'
                  } ${isPopular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getPlanColor(plan)} mb-4`}>
                      {getPlanIcon(plan)}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {planDetails.name}
                    </h3>

                    {/* Pricing */}
                    <div className="mb-4">
                      {locationLoading ? (
                        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                      ) : currentPrice ? (
                        <div>
                          <div className="text-3xl font-bold text-gray-900">
                            {currentPrice.formatted}
                          </div>
                          <div className="text-sm text-gray-600">
                            per {billingPeriod === 'yearly' ? 'year' : 'month'}
                          </div>
                          {billingPeriod === 'yearly' && priceInfo.savings && (
                            <div className="text-sm text-green-600 font-medium mt-1">
                              Save {currentPrice.currencySymbol}{priceInfo.savings.amount} per year
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="text-3xl font-bold text-gray-900">
                            ${planDetails.basePrice}
                          </div>
                          <div className="text-sm text-gray-600">
                            per {billingPeriod === 'yearly' ? 'year' : 'month'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Subscribe Button */}
                    <button
                      onClick={() => handleSubscribe(plan, billingPeriod)}
                      disabled={portalLoading}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                        isPopular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {portalLoading ? (
                        <span>Loading...</span>
                      ) : hasActiveSubscription ? (
                        <>
                          <span>Manage Plan</span>
                          <ExternalLink className="w-4 h-4" />
                        </>
                      ) : (
                        <span>Start {planDetails.name} Plan</span>
                      )}
                    </button>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3">
                    {planDetails.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        {feature.includes('✗') ? (
                          <X className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${
                          feature.includes('✗') ? 'text-gray-500 line-through' : 'text-gray-700'
                        }`}>
                          {feature.replace('✗ ', '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>All plans include a 14-day free trial. Cancel anytime.</p>
            <p className="mt-2">
              Questions? <a href="/contact" className="text-blue-600 hover:underline">Contact us</a>
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Global function to show pricing modal (used by upgrade buttons throughout the app)
declare global {
  interface Window {
    showUpgradeModal?: (plan?: SubscriptionPlan, source?: string) => void;
  }
}

export const initializePricingModal = () => {
  let modalContainer: HTMLDivElement | null = null;

  window.showUpgradeModal = (plan: SubscriptionPlan = 'chef', source: string = 'global') => {
    // Remove existing modal if any
    if (modalContainer) {
      document.body.removeChild(modalContainer);
    }

    // Create modal container
    modalContainer = document.createElement('div');
    document.body.appendChild(modalContainer);

    // Import React and ReactDOM dynamically to avoid bundling issues
    import('react').then(React => {
      import('react-dom/client').then(ReactDOM => {
        const root = ReactDOM.createRoot(modalContainer!);

        const closeModal = () => {
          if (modalContainer) {
            root.unmount();
            document.body.removeChild(modalContainer);
            modalContainer = null;
          }
        };

        root.render(
          React.createElement(PricingModal, {
            isOpen: true,
            onClose: closeModal,
            defaultPlan: plan,
            source
          })
        );
      });
    });
  };
};