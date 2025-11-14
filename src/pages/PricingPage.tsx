import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Star, X, Zap, Crown, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { basePlans } from '../lib/pricing';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';
import { logger } from '../lib/logger';

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const { subscription } = useSubscriptionStatus();
  const { createPortalSession, loading: portalLoading } = useStripeCheckout();
  const [isYearly, setIsYearly] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Check if user has an existing subscription
  const hasActiveSubscription = subscription && subscription.plan !== 'free' && subscription.status === 'active';

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBillingToggle = (checked: boolean) => {
    setIsTransitioning(true);
    setIsYearly(checked);

    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

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

  const handleSubscribe = async (plan: 'chef' | 'master-chef', period: 'monthly' | 'yearly') => {
    if (!user) {
      // Redirect to sign in
      window.location.href = '/signin';
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
    const paymentLink = STRIPE_PAYMENT_LINKS[plan]?.[period];
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

  // Helper function to get savings info for a plan
  const getSavingsInfo = (planIndex: number) => {
    if (!isYearly || planIndex === 0) {
      return null; // No savings for free plan or monthly billing
    }

    const plan = basePlans[planIndex];
    if (!plan || plan.yearlyDiscount === 0) {
      return null;
    }

    const monthlyTotal = plan.basePrice * 12;
    const yearlyPrice = plan.basePrice * 12 * (1 - plan.yearlyDiscount / 100);
    const savingsAmount = monthlyTotal - yearlyPrice;

    return {
      savingsAmount: `$${savingsAmount.toFixed(0)}`,
      savingsPercentage: plan.yearlyDiscount
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Simple Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            <Star className="w-3 h-3 sm:w-4 sm:h-4" />
            Pricing Plans
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 sm:mb-4">Simple, Transparent Pricing</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-4">Choose the plan that works for you</p>

          {/* Free Plan Highlight */}
          <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 sm:mb-8">
            <Check className="w-4 h-4" />
            Free plan available forever • No credit card required • Upgrade anytime
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center">
            <div className="bg-white border-2 border-gray-200 p-1 sm:p-1.5 rounded-full flex items-center gap-2 sm:gap-3 shadow-md">
              <span className={cn("text-xs sm:text-sm font-medium px-2 sm:px-3 transition-colors",
                !isYearly ? 'text-gray-900' : 'text-gray-500'
              )}>
                Monthly
              </span>
              <button
                onClick={() => handleBillingToggle(!isYearly)}
                className={`relative inline-flex h-7 w-14 sm:h-8 sm:w-16 items-center rounded-full transition-all duration-300 ${
                  isYearly ? 'bg-green-600 shadow-lg shadow-green-500/50' : 'bg-gray-300'
                }`}
                aria-label={`Switch to ${isYearly ? 'monthly' : 'yearly'} billing`}
                role="switch"
                aria-checked={isYearly}
              >
                <span className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  isYearly ? 'translate-x-8 sm:translate-x-9' : 'translate-x-1'
                }`} />
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={cn("text-xs sm:text-sm font-medium transition-colors",
                  isYearly ? 'text-gray-900' : 'text-gray-500'
                )}>
                  Yearly
                </span>
                <span className="bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md">
                  Save 20%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className="relative rounded-2xl border-2 border-gray-200 hover:border-green-300 bg-white hover:shadow-green-100 transition-all duration-500 hover:scale-105 hover:shadow-2xl flex flex-col h-full group p-6">
            <CardHeader className="text-center p-0 mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-600 mb-4 mx-auto">
                <Star className="w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 mb-2">Free</CardTitle>
              <div className="mb-4">
                <div className="text-4xl font-black text-gray-900 transition-all duration-300" key={isYearly ? 'yearly' : 'monthly'}>
                  $0
                </div>
                <div className="text-xs font-semibold text-gray-500 mt-1">per month</div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <ul className="space-y-2.5">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">5 recipes in Recipe Book</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">3 recipe conversions per day</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Basic diet filters</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Secure cloud processing</span>
                </li>
                <li className="flex items-start">
                  <X className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-500 line-through">Meal planning</span>
                </li>
                <li className="flex items-start">
                  <X className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-500 line-through">Default preferences</span>
                </li>
                <li className="flex items-start">
                  <X className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-500 line-through">Cloud backup/restore</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="p-0 mt-6">
              <Button
                disabled
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gray-300 text-gray-600 cursor-not-allowed"
              >
                {subscription?.plan === 'free' ? 'Current Plan' : 'Free Forever'}
              </Button>
            </CardFooter>
          </Card>

          {/* Chef Plan - Most Popular */}
          <Card className="relative rounded-2xl border-2 border-green-400 bg-gradient-to-b from-green-50 via-emerald-50 to-white shadow-xl ring-4 ring-green-300 hover:ring-green-400 hover:shadow-2xl transition-all duration-500 transform scale-105 flex flex-col h-full p-6">
            {/* Most Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-xl border-2 border-white flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Most Popular
              </span>
            </div>

            <CardHeader className="text-center p-0 mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-4 mx-auto">
                <Zap className="w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 mb-2">Chef</CardTitle>
              <div className="mb-4">
                <div className="text-4xl font-black text-green-600 transition-all duration-300" key={isYearly ? 'yearly' : 'monthly'}>
                  {isYearly && basePlans[1].yearlyDiscount > 0 ?
                    `$${(basePlans[1].basePrice * 12 * (1 - basePlans[1].yearlyDiscount / 100)).toFixed(0)}` :
                    `$${basePlans[1].basePrice.toFixed(2)}`
                  }
                </div>
                <div className="text-xs font-semibold text-gray-500 mt-1">
                  {isYearly ? 'per year' : 'per month'}
                </div>
                {isYearly && getSavingsInfo(1) && (
                  <div className="mt-3 animate-fade-in">
                    <div className="inline-flex items-center gap-1 bg-yellow-100 border-2 border-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                      <Check className="w-3 h-3" />
                      Save {getSavingsInfo(1)?.savingsAmount} ({getSavingsInfo(1)?.savingsPercentage}%)
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Everything in Free</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">100 recipes in Recipe Book</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">100 conversions per day</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Unlock up to 12 dietary filters</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Meal planning calendar</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Default recipe preferences</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Custom profile pictures</span>
                </li>
                <li className="flex items-start">
                  <X className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-500 line-through">Backup & restore recipes</span>
                </li>
                <li className="flex items-start">
                  <X className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-500 line-through">Health Conditions</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="p-0">
              <Button
                onClick={() => handleSubscribe('chef', isYearly ? 'yearly' : 'monthly')}
                disabled={portalLoading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {portalLoading ? (
                  'Loading...'
                ) : hasActiveSubscription ? (
                  <>
                    Manage Plan
                    <ExternalLink className="w-4 h-4" />
                  </>
                ) : (
                  'Upgrade Now'
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Master Chef Plan */}
          <Card className="relative rounded-2xl border-2 border-gray-200 hover:border-green-300 bg-white hover:shadow-green-100 transition-all duration-500 hover:scale-105 hover:shadow-2xl flex flex-col h-full group p-6">
            <CardHeader className="text-center p-0 mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 text-purple-600 mb-4 mx-auto">
                <Crown className="w-8 h-8" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 mb-2">Master Chef</CardTitle>
              <div className="mb-4">
                <div className="text-4xl font-black text-gray-900 transition-all duration-300" key={isYearly ? 'yearly' : 'monthly'}>
                  {isYearly && basePlans[2].yearlyDiscount > 0 ?
                    `$${(basePlans[2].basePrice * 12 * (1 - basePlans[2].yearlyDiscount / 100)).toFixed(0)}` :
                    `$${basePlans[2].basePrice.toFixed(2)}`
                  }
                </div>
                <div className="text-xs font-semibold text-gray-500 mt-1">
                  {isYearly ? 'per year' : 'per month'}
                </div>
                {isYearly && getSavingsInfo(2) && (
                  <div className="mt-3 animate-fade-in">
                    <div className="inline-flex items-center gap-1 bg-yellow-100 border-2 border-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                      <Check className="w-3 h-3" />
                      Save {getSavingsInfo(2)?.savingsAmount} ({getSavingsInfo(2)?.savingsPercentage}%)
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Everything in Chef plan</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">1,000 recipes in Recipe Book</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Advanced nutrition analysis</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Recipe collections & tags</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">All dietary filters (24+ options)</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Health Conditions</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Backup & restore recipes</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="p-0">
              <Button
                onClick={() => handleSubscribe('master-chef', isYearly ? 'yearly' : 'monthly')}
                disabled={portalLoading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {portalLoading ? (
                  'Loading...'
                ) : hasActiveSubscription ? (
                  <>
                    Manage Plan
                    <ExternalLink className="w-4 h-4" />
                  </>
                ) : (
                  'Upgrade Now'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Questions? <Link to="/contact" className="text-green-600 hover:text-green-700 font-bold hover:underline">Contact us</Link>
          </p>
          <p className="text-xs text-gray-500">
            All plans include our core AI recipe conversion technology and secure cloud processing
          </p>
        </div>
      </div>
    </div>
  );
};
