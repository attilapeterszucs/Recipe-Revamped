import React, { useState, useRef, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User as UserIcon, Settings, LogOut, Crown, Check, X, Shield } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionPlan } from '../types/subscription';
import { useToast } from './ToastContainer';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { getUserInitials } from '../utils/profileUtils';

interface UserAccountDropdownProps {
  user: User;
  profilePictureUrl?: string | null;
  onShowSaved: () => void;
  onShowSettings: () => void;
  onSignOut: () => void;
  onShowUpgradeModal?: () => void;
}

const PLAN_COLORS = {
  free: { name: 'Free', color: 'text-gray-600' },
  chef: { name: 'Chef', color: 'text-blue-600' },
  'master-chef': { name: 'Master Chef', color: 'text-green-600' },
  enterprise: { name: 'Enterprise', color: 'text-gray-800' }
};

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

export const UserAccountDropdown: React.FC<UserAccountDropdownProps> = ({
  user,
  profilePictureUrl,
  onShowSaved,
  onShowSettings,
  onSignOut,
  onShowUpgradeModal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Use the cleaner subscription status hook
  const { subscription: userSubscription, isAdmin, loading, hasPermissions, refresh } = useSubscriptionStatus(
    user?.uid,
    user?.email || undefined
  );

  // Get the current profile picture URL (only use custom upload, show anagram otherwise)
  const currentProfilePicture = profilePictureUrl;


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset profile image error when user changes
  useEffect(() => {
    setProfileImageError(false);
  }, [user?.uid, user?.photoURL]);

  // Handle clicks on upgrade buttons throughout the app
  useEffect(() => {
    const handleUpgradeButtonClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-upgrade-plan]')) {
        event.preventDefault();
        event.stopPropagation();
        setShowUpgradeModal(true);
        if (onShowUpgradeModal) {
          onShowUpgradeModal();
        }
      }
    };

    document.addEventListener('click', handleUpgradeButtonClick, true); // Use capture phase
    return () => {
      document.removeEventListener('click', handleUpgradeButtonClick, true);
    };
  }, [onShowUpgradeModal]);

  // Expose upgrade modal function globally for debugging
  useEffect(() => {
    (window as any).showUpgradeModal = () => {
      setShowUpgradeModal(true);
    };
    return () => {
      delete (window as any).showUpgradeModal;
    };
  }, []);


  // Helper function to get price with yearly discount
  const getPrice = (planId: string): string => {
    const plan = SUBSCRIPTION_PLANS[planId as SubscriptionPlan];
    if (!plan || plan.basePrice === 0) return 'Free';
    
    if (isYearly && plan.yearlyDiscount > 0) {
      const yearlyPrice = plan.basePrice * 12 * (1 - plan.yearlyDiscount / 100);
      return `$${yearlyPrice.toFixed(0)}/year`;
    } else {
      return `$${plan.basePrice.toFixed(2)}${isYearly ? '/year' : '/month'}`;
    }
  };

  // Helper function to get savings info for a plan
  const getSavingsInfo = (planId: string) => {
    if (!isYearly || planId === 'free') {
      return null;
    }
    
    const plan = SUBSCRIPTION_PLANS[planId as SubscriptionPlan];
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

  // Helper function to get payment link for a plan
  const getPaymentLink = (planId: string): string | null => {
    if (planId === 'free' || planId === 'enterprise') {
      return null;
    }
    
    const links = STRIPE_PAYMENT_LINKS[planId as keyof typeof STRIPE_PAYMENT_LINKS];
    if (!links) return null;
    
    return isYearly ? links.yearly : links.monthly;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-full hover:bg-green-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 group"
      >
        {/* Profile Picture or Initials */}
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center ring-2 ring-white shadow-md group-hover:shadow-lg group-hover:ring-green-200 transition-all duration-200">
          {currentProfilePicture && !profileImageError ? (
            <img
              src={currentProfilePicture}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={() => setProfileImageError(true)}
            />
          ) : (
            <span className="text-sm font-black text-white">
              {getUserInitials(user)}
            </span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {/* Plan Badge - Hidden on mobile, shown on larger screens */}
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border transition-all duration-200 ${
            loading ? 'bg-gray-100 text-gray-400 border-gray-200' :
            !userSubscription || userSubscription.plan === 'free' ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300' :
            userSubscription.plan === 'chef' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300' :
            userSubscription.plan === 'master-chef' ? 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 border-green-300' :
            userSubscription.plan === 'enterprise' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border-purple-300' :
            'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300'
          }`}>
            {loading ? 'Loading...' :
             userSubscription ?
               (isAdmin ? `Admin • ${PLAN_COLORS[userSubscription.plan].name}` : PLAN_COLORS[userSubscription.plan].name) :
               'Free'
            }
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-600 transition-all duration-200 ${
              isOpen ? 'rotate-180 text-green-600' : ''
            }`}
          />
        </div>
        <ChevronDown
          className={`sm:hidden w-4 h-4 text-gray-600 transition-all duration-200 ${
            isOpen ? 'rotate-180 text-green-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-[340px] bg-white rounded-2xl shadow-2xl border-2 border-green-200 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200">
          {/* User Info Header */}
          <div className="relative px-6 py-5 bg-gradient-to-br from-green-500 to-emerald-600 overflow-hidden">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-white/20 ring-2 ring-white/30 flex items-center justify-center backdrop-blur-sm shadow-xl">
                {currentProfilePicture && !profileImageError ? (
                  <img
                    src={currentProfilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setProfileImageError(true)}
                  />
                ) : (
                  <span className="text-xl font-black text-white">
                    {getUserInitials(user)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-white truncate drop-shadow-sm">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-green-50 truncate font-semibold">
                  {user.email}
                </p>
                {/* Show plan badge */}
                <div className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg border ${
                  loading ? 'bg-white/90 text-gray-600 border-white/50' :
                  !userSubscription || userSubscription.plan === 'free' ? 'bg-white/90 text-gray-700 border-white/50' :
                  userSubscription.plan === 'chef' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  userSubscription.plan === 'master-chef' ? 'bg-white text-green-700 border-white/80' :
                  userSubscription.plan === 'enterprise' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  'bg-white/90 text-gray-700 border-white/50'
                }`}>
                  {userSubscription?.plan === 'master-chef' && <Crown className="w-3 h-3" />}
                  {loading ? 'Loading...' :
                   userSubscription ?
                     (isAdmin ? `Admin • ${PLAN_COLORS[userSubscription.plan].name}` : PLAN_COLORS[userSubscription.plan].name) :
                     'Free Plan'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {!isAdmin ? (
              <button
                data-upgrade-plan
                onClick={() => {
                  setShowUpgradeModal(true);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-5 py-3.5 text-sm font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 group border-b border-green-100"
              >
                <div className="bg-green-600 p-1.5 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <span className="flex-1 text-left">
                  {userSubscription?.plan === 'chef' ? 'Upgrade to Master Chef' : 'Upgrade Plan'}
                </span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            ) : (
              <div className="flex items-center w-full px-5 py-3.5 text-sm bg-red-50 border-b border-red-100">
                <div className="bg-red-500 p-1.5 rounded-lg mr-3">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-left font-bold text-red-900">Admin Access</div>
                  <div className="text-xs text-red-600 font-medium">Manage plans in Settings</div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                onShowSettings();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="bg-gray-100 p-1.5 rounded-lg mr-3 group-hover:bg-gray-200 transition-colors">
                <Settings className="w-4 h-4 text-gray-600 group-hover:rotate-90 transition-all duration-200" />
              </div>
              <span className="flex-1 text-left">Settings</span>
              <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="border-t-2 border-gray-100 mt-2 pt-2 px-3">
              <button
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl group"
              >
                <div className="bg-red-100 p-1.5 rounded-lg mr-3 group-hover:bg-red-200 transition-colors">
                  <LogOut className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <span className="flex-1 text-left">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal - Modern Green Design */}
      {showUpgradeModal && !isAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity"
              onClick={() => setShowUpgradeModal(false)}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 px-6 py-8 relative overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
                </div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                      <Crown className="h-8 w-8 text-yellow-300 drop-shadow-lg" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white drop-shadow-md">
                        {isAdmin ? 'Select Plan (Admin)' : 'Upgrade Your Plan'}
                      </h2>
                      <p className="text-green-50 mt-1 text-lg">
                        {isAdmin ? 'Choose any plan for testing' : 'Unlock unlimited recipes and premium features'}
                      </p>
                    </div>
                  </div>
                  {/* Close Button */}
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="text-white/90 hover:text-white transition-all p-2.5 rounded-xl hover:bg-white/20 backdrop-blur-sm"
                    aria-label="Close modal"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Billing Toggle */}
                <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-4 mt-6 border border-white/20">
                  <div className="flex items-center justify-center gap-4">
                    <span className={`text-base font-semibold transition-colors ${!isYearly ? 'text-white' : 'text-green-100'}`}>
                      Monthly
                    </span>
                    <button
                      onClick={() => setIsYearly(!isYearly)}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 ${
                        isYearly ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-white/40'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                          isYearly ? 'translate-x-9' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-semibold transition-colors ${isYearly ? 'text-white' : 'text-green-100'}`}>
                        Yearly
                      </span>
                      <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                        Save 20%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plans Content */}
              <div className="px-8 py-12 bg-gradient-to-b from-gray-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                  {Object.entries(SUBSCRIPTION_PLANS).filter(([planId]) => planId !== 'enterprise').map(([planId, plan]) => {
                    const typedPlanId = planId as SubscriptionPlan;
                    const isCurrentPlan = userSubscription?.plan === typedPlanId;
                    const isPopular = planId === 'chef';

                    return (
                      <div key={planId} className={`relative rounded-2xl border-2 p-6 transition-all duration-500 hover:scale-105 hover:shadow-2xl flex flex-col h-full group ${
                        isCurrentPlan
                          ? 'border-green-500 bg-gradient-to-b from-green-50 to-white shadow-lg'
                          : isPopular
                          ? 'border-green-400 bg-gradient-to-b from-green-50 via-emerald-50 to-white shadow-xl ring-4 ring-green-300 hover:ring-green-400 transform scale-105'
                          : 'border-gray-200 hover:border-green-300 bg-white hover:shadow-green-100'
                      }`}>
                        {/* Badge */}
                        {isCurrentPlan ? (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-green-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg border-2 border-white">
                              Current Plan
                            </span>
                          </div>
                        ) : isPopular ? (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-xl border-2 border-white flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              Most Popular
                            </span>
                          </div>
                        ) : null}

                        <div className="text-center mb-6">
                          <h3 className={`text-xl font-bold mb-4 ${
                            isPopular ? 'text-green-700' : 'text-gray-900'
                          }`}>
                            {plan.name}
                          </h3>

                          {/* Animated Price */}
                          <div className="relative h-24 flex flex-col items-center justify-center">
                            {planId === 'enterprise' ? (
                              <div className="text-2xl font-black text-gray-900">
                                Custom Pricing
                              </div>
                            ) : (
                              <>
                                <div className={`text-4xl font-black ${
                                  isPopular ? 'text-green-600' : 'text-gray-900'
                                } animate-price-change`}
                                  key={isYearly ? 'yearly' : 'monthly'}>
                                  {planId === 'free' ? '$0' :
                                   isYearly && plan.yearlyDiscount > 0 ?
                                     `$${(plan.basePrice * 12 * (1 - plan.yearlyDiscount / 100)).toFixed(0)}` :
                                     `$${plan.basePrice.toFixed(2)}`
                                  }
                                </div>
                                <div className="text-xs font-semibold text-gray-500 mt-1">
                                  {planId === 'free' ? '' : isYearly ? 'per year' : 'per month'}
                                </div>
                                {isYearly && getSavingsInfo(planId) && (
                                  <div className="mt-3 animate-fade-in">
                                    <div className="inline-flex items-center gap-1 bg-yellow-100 border-2 border-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                                      <Check className="w-3 h-3" />
                                      Save {getSavingsInfo(planId)?.savingsAmount} ({getSavingsInfo(planId)?.savingsPercentage}%)
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {/* Features */}
                        <ul className="space-y-2.5 flex-grow mb-6">
                          {plan.features.map((feature, index) => {
                            const isExcluded = feature.startsWith('✗');
                            const displayText = isExcluded ? feature.replace('✗ ', '') : feature;

                            return (
                              <li key={index} className="flex items-start gap-2 text-xs">
                                {isExcluded ? (
                                  <X className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                )}
                                <span className={isExcluded ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}>
                                  {displayText}
                                </span>
                              </li>
                            );
                          })}
                        </ul>

                        {/* CTA Button */}
                        {isCurrentPlan ? (
                          <button
                            disabled
                            className="w-full py-3.5 px-4 rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed font-bold text-sm"
                          >
                            Current Plan
                          </button>
                        ) : planId === 'free' ? (
                          <button
                            disabled
                            className="w-full py-3.5 px-4 rounded-xl bg-gray-200 text-gray-500 cursor-not-allowed font-bold text-sm"
                          >
                            Free Plan
                          </button>
                        ) : (
                          <button
                            disabled={planId === 'enterprise'}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                              planId === 'enterprise'
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : isPopular
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                            onClick={() => {
                              if (planId === 'enterprise') return;

                              const paymentLink = getPaymentLink(planId);
                              if (paymentLink) {
                                const successUrl = encodeURIComponent(`${window.location.origin}/app?success=true&session_id={CHECKOUT_SESSION_ID}`);
                                const cancelUrl = encodeURIComponent(`${window.location.origin}/app?canceled=true`);
                                const fullPaymentUrl = `${paymentLink}?success_url=${successUrl}&cancel_url=${cancelUrl}`;
                                window.location.href = fullPaymentUrl;
                                setShowUpgradeModal(false);
                              }
                            }}
                          >
                            {planId === 'enterprise' ? 'Coming Soon' : 'Upgrade Now'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};