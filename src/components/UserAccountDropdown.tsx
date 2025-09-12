import React, { useState, useRef, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User as UserIcon, Settings, LogOut, Crown, Check, X, Shield } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionPlan } from '../types/subscription';
import { useToast } from './ToastContainer';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';

interface UserAccountDropdownProps {
  user: User;
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
    monthly: 'https://buy.stripe.com/test_9B6fZj1IFeMTgZg2KueEo04',
    yearly: 'https://buy.stripe.com/test_4gM9AVafb207fVc2KueEo03'
  },
  'master-chef': {
    monthly: 'https://buy.stripe.com/test_9B6dRb4UR0W310i70KeEo00',
    yearly: 'https://buy.stripe.com/test_bJebJ3bjfcELcJ0dp8eEo02'
  }
};

export const UserAccountDropdown: React.FC<UserAccountDropdownProps> = ({
  user,
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


  // Get user initials from email or display name
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

  const getUserInitials = (user: User): string => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return 'U';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {/* Profile Picture or Initials */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-green-600 flex items-center justify-center">
          {user.photoURL && !profileImageError ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={() => setProfileImageError(true)}
            />
          ) : (
            <span className="text-sm font-semibold text-white">
              {getUserInitials(user)}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Plan Badge - Hidden on mobile, shown on larger screens */}
          <div className={`hidden sm:block px-2.5 py-1 rounded-md text-xs font-semibold ${
            loading ? 'bg-gray-100 text-gray-400' :
            !userSubscription || userSubscription.plan === 'free' ? 'bg-gray-100 text-gray-600' :
            userSubscription.plan === 'chef' ? 'bg-blue-100 text-blue-700' :
            userSubscription.plan === 'master-chef' ? 'bg-green-100 text-green-700' :
            userSubscription.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' : 
            'bg-gray-100 text-gray-600'
          }`}>
            {loading ? 'Loading...' : 
             userSubscription ? 
               (isAdmin ? `Admin • ${PLAN_COLORS[userSubscription.plan].name}` : PLAN_COLORS[userSubscription.plan].name) : 
               'Free'
            }
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* User Info */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-green-600 flex items-center justify-center">
                {user.photoURL && !profileImageError ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setProfileImageError(true)}
                  />
                ) : (
                  <span className="text-sm sm:text-lg font-semibold text-white">
                    {getUserInitials(user)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {user.email}
                </p>
                {/* Show plan badge on mobile in user info section */}
                <div className={`sm:hidden mt-1 inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                  loading ? 'bg-gray-100 text-gray-400' :
                  !userSubscription || userSubscription.plan === 'free' ? 'bg-gray-100 text-gray-600' :
                  userSubscription.plan === 'chef' ? 'bg-blue-100 text-blue-700' :
                  userSubscription.plan === 'master-chef' ? 'bg-green-100 text-green-700' :
                  userSubscription.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' : 
                  'bg-gray-100 text-gray-600'
                }`}>
                  {loading ? 'Loading...' : 
                   userSubscription ? 
                     (isAdmin ? `Admin • ${PLAN_COLORS[userSubscription.plan].name}` : PLAN_COLORS[userSubscription.plan].name) : 
                     'Free'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {!isAdmin ? (
              <button
                data-upgrade-plan
                onClick={() => {
                  setShowUpgradeModal(true);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-blue-500" />
                <span className="flex-1 text-left">
                  {userSubscription?.plan === 'chef' ? 'Upgrade to Master Chef' : 'Upgrade Plan'}
                </span>
                <span className={`hidden sm:inline text-xs px-2 py-1 rounded-full bg-blue-100 ${
                  userSubscription ? PLAN_COLORS[userSubscription.plan].color : 'text-gray-600'
                }`}>
                  {userSubscription ? PLAN_COLORS[userSubscription.plan].name : 'Free'}
                  {!hasPermissions && !loading && (
                    <span className="ml-1 text-xs text-orange-500" title="Limited functionality - subscription data unavailable">
                      •
                    </span>
                  )}
                </span>
              </button>
            ) : (
              <div className="flex items-center w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-red-500" />
                <div className="flex-1">
                  <div className="text-left font-medium">Admin Plan Management</div>
                  <div className="text-xs text-gray-500 hidden sm:block">Use Settings → Admin Panel to change plans</div>
                </div>
                <span className={`hidden sm:inline text-xs px-2 py-1 rounded-full bg-red-100 ${
                  userSubscription ? PLAN_COLORS[userSubscription.plan].color : 'text-gray-600'
                }`}>
                  {userSubscription ? PLAN_COLORS[userSubscription.plan].name : 'Free'}
                </span>
              </div>
            )}
            
            <button
              onClick={() => {
                onShowSettings();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-gray-400" />
              Settings
            </button>
            
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-red-500" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && !isAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              onClick={() => setShowUpgradeModal(false)}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Crown className="h-8 w-8 text-yellow-300" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {isAdmin ? 'Select Plan (Admin)' : 'Upgrade Your Plan'}
                      </h2>
                      <p className="text-blue-100">
                        {isAdmin ? 'Choose any plan for testing' : 'Unlock more features and capabilities'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Billing Toggle */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 mt-4">
                  <div className="flex items-center justify-center">
                    <span className={`text-sm font-medium mr-3 ${!isYearly ? 'text-white' : 'text-blue-200'}`}>
                      Monthly
                    </span>
                    <button
                      onClick={() => setIsYearly(!isYearly)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 ${
                        isYearly ? 'bg-green-500' : 'bg-white/30'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isYearly ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ml-3 ${isYearly ? 'text-white' : 'text-blue-200'}`}>
                      Yearly
                    </span>
                  </div>
                </div>
              </div>

              {/* Plans Content */}
              <div className="px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
                  {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => {
                    const typedPlanId = planId as SubscriptionPlan;
                    const isCurrentPlan = userSubscription?.plan === typedPlanId;
                    
                    return (
                      <div key={planId} className={`relative rounded-lg border-2 p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg flex flex-col h-full ${
                        isCurrentPlan ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      } ${planId === 'master-chef' && !isCurrentPlan ? 'shadow-xl ring-4 ring-green-300 bg-gradient-to-b from-green-50 to-white hover:ring-green-400' : ''}`}>
                        <div className="text-center">
                          <h3 className={`text-lg font-semibold ${
                            planId === 'free' ? 'text-gray-900' :
                            planId === 'chef' ? 'text-blue-900' :
                            planId === 'master-chef' ? 'text-green-900' :
                            'text-gray-900'
                          }`}>{plan.name}</h3>
                          <div className="mt-4">
                            {planId === 'enterprise' ? (
                              <div className="text-xl font-bold text-gray-900">
                                Custom Pricing
                              </div>
                            ) : (
                              <>
                                <span className={`text-3xl font-bold ${
                                  planId === 'free' ? 'text-gray-900' :
                                  planId === 'chef' ? 'text-blue-900' :
                                  planId === 'master-chef' ? 'text-green-900' :
                                  'text-gray-900'
                                }`}>
                                  {planId === 'free' ? '$0' : 
                                   isYearly && plan.yearlyDiscount > 0 ? 
                                     `$${(plan.basePrice * 12 * (1 - plan.yearlyDiscount / 100)).toFixed(0)}` :
                                     `$${plan.basePrice.toFixed(2)}`
                                  }
                                </span>
                                <span className={`${
                                  planId === 'free' ? 'text-gray-600' :
                                  planId === 'chef' ? 'text-blue-600' :
                                  planId === 'master-chef' ? 'text-green-600' :
                                  'text-gray-600'
                                }`}>
                                  {planId === 'free' ? '' : isYearly ? '/year' : '/month'}
                                </span>
                              </>
                            )}
                            {isYearly && getSavingsInfo(planId) && (
                              <div className="mt-2 text-sm">
                                <span className="text-green-600 font-medium">
                                  Save {getSavingsInfo(planId)?.savingsAmount}
                                </span>
                                <span className="text-gray-500"> ({getSavingsInfo(planId)?.savingsPercentage}% off)</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isCurrentPlan ? (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                              planId === 'free' ? 'bg-gray-500' :
                              planId === 'chef' ? 'bg-blue-500' :
                              planId === 'master-chef' ? 'bg-green-500' :
                              'bg-gray-800'
                            }`}>
                              Current Plan
                            </span>
                          </div>
                        ) : planId === 'master-chef' ? (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg border-2 border-white whitespace-nowrap">
                              Most Popular
                            </span>
                          </div>
                        ) : null}
                        
                        <ul className="mt-6 space-y-3 flex-grow">
                          {plan.features.map((feature, index) => {
                            const isExcluded = feature.startsWith('✗');
                            const displayText = isExcluded ? feature.replace('✗ ', '') : feature;
                            
                            return (
                              <li key={index} className="flex items-start">
                                {isExcluded ? (
                                  <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                )}
                                <span className="text-sm text-gray-600">{displayText}</span>
                              </li>
                            );
                          })}
                        </ul>
                        
                        {isCurrentPlan ? (
                          <button 
                            disabled
                            className="w-full mt-6 py-3 px-4 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed font-semibold"
                          >
                            Current Plan
                          </button>
                        ) : planId !== 'free' && (
                          <button 
                            disabled={planId === 'enterprise'}
                            className={`w-full mt-6 py-3 px-4 rounded-lg transition-colors font-semibold ${
                              planId === 'enterprise' 
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                : planId === 'chef' 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                            onClick={() => {
                              if (planId === 'enterprise') {
                                // Disabled - do nothing
                                return;
                              }
                              
                              const paymentLink = getPaymentLink(planId);
                              if (paymentLink) {
                                // Add success and cancel URLs with session ID
                                const successUrl = encodeURIComponent(`${window.location.origin}/app?success=true&session_id={CHECKOUT_SESSION_ID}`);
                                const cancelUrl = encodeURIComponent(`${window.location.origin}/app?canceled=true`);
                                
                                // Build the full URL with return parameters
                                const fullPaymentUrl = `${paymentLink}?success_url=${successUrl}&cancel_url=${cancelUrl}`;
                                
                                // Redirect in the same window instead of opening new tab
                                window.location.href = fullPaymentUrl;
                                
                                // Close the modal
                                setShowUpgradeModal(false);
                              }
                            }}
                          >
                            {planId === 'enterprise' 
                              ? 'Coming Soon' 
                              : 'Upgrade'}
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