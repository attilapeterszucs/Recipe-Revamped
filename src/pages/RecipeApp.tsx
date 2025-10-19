import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Zap, BookOpen, Calendar, Menu, X, Crown, Check } from 'lucide-react';
import { auth, logOut, db } from '../lib/firebase';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { SignIn } from '../components/Auth/SignIn';
import { SignUp } from '../components/Auth/SignUp';
import { EmailVerificationPrompt } from '../components/Auth/EmailVerificationPrompt';
import { RecipeInput } from '../components/RecipeInput';
import { StructuredRecipeDisplay } from '../components/StructuredRecipeDisplay';
import { SavedRecipes } from '../components/SavedRecipes';
import { convertRecipeLocal } from '../lib/ai';
import { saveRecipe, getUserRecipeLimitInfo } from '../lib/firestore';
import type { SavedRecipe } from '../lib/validation';
import { UserAccountDropdown } from '../components/UserAccountDropdown';
import { NotificationBell } from '../components/NotificationBell';
import { NotificationPopup } from '../components/NotificationPopup';
import type { Notification } from '../types/notifications';
import { Settings } from './Settings';
import { getUserSettings } from '../lib/userSettings';
import type { UserSettings } from '../types/userSettings';
import { useToast } from '../components/ToastContainer';
import { RecipeViewer } from '../components/RecipeViewer';
import { RecipeEditor } from '../components/RecipeEditor';
import { MealPlannerCalendar } from '../components/MealPlannerCalendar';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useOpenAIConsent } from '../hooks/useOpenAIConsent';
import { initializeAdminSystem } from '../utils/adminUtils';
import { createOrUpdateUserProfile } from '../lib/userService';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { startSessionTracking, stopSessionTracking } from '../lib/sessionTracking';
import { AppFooter } from '../components/AppFooter';
import { DailyConversionService } from '../lib/dailyConversionService';
import { trackRecipeConversion, trackPageView } from '../lib/analytics';
import { consentStorage } from '../lib/consentStorage';
import { ReactivationModal } from '../components/ReactivationModal';
import { PaymentSuccessPopup } from '../components/PaymentSuccessPopup';
import { usePaymentSuccess } from '../hooks/usePaymentSuccess';
import { SEOHead } from '../components/SEOHead';
import { SubscriptionSyncService } from '../lib/subscriptionSyncService';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionPlan } from '../types/subscription';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';

// Stripe Payment Links for upgrade modal
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

export function RecipeApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');
  const [recipeSaved, setRecipeSaved] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<{ original: string; filters: string[] } | null>(null);
  const [selectedSavedRecipe, setSelectedSavedRecipe] = useState<SavedRecipe | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMealPlanner, setShowMealPlanner] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [userSettingsLoading, setUserSettingsLoading] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<SavedRecipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<SavedRecipe | null>(null);
  const [recipeLimitInfo, setRecipeLimitInfo] = useState<{
    currentCount: number;
    limit: number;
    plan: string;
    canSave: boolean;
  } | null>(null);
  const [showReactivationModal, setShowReactivationModal] = useState(false);
  const [isCheckingAccountStatus, setIsCheckingAccountStatus] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();

  // Lock body scroll when upgrade modal is open
  useBodyScrollLock(showUpgradeModal);

  // Payment success popup management
  const { showSuccessPopup, closeSuccessPopup } = usePaymentSuccess();

  // OpenAI consent management
  const {
    checkConsentBeforeAI,
    hasValidConsent
  } = useOpenAIConsent();
  
  // Feature access control
  const featureAccess = useFeatureAccess(
    user?.uid,
    user?.email || undefined,
    recipeLimitInfo?.currentCount || 0
  );

  // Subscription status for upgrade modal
  const { subscription: userSubscription, isAdmin } = useSubscriptionStatus(
    user?.uid,
    user?.email || undefined
  );

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scroll to top when switching between pages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [showSaved, showSettings, showMealPlanner]);

  // Check for URL search params to show settings with specific section
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const section = searchParams.get('section');
    if (section) {
      console.log('URL section parameter detected:', section);
      setShowSettings(true);
      setShowSaved(false);
      setShowMealPlanner(false);
    }
  }, [location.search]);

  // Refresh recipe limit info when subscription changes
  useEffect(() => {
    const refreshLimitInfo = async () => {
      if (user?.uid) {
        try {
          const limitInfo = await getUserRecipeLimitInfo(user.uid);
          setRecipeLimitInfo(limitInfo);
        } catch (error) {
        }
      }
    };

    refreshLimitInfo();
  }, [user?.uid, featureAccess.currentPlan]);

  // Reset restricted views when feature access changes
  useEffect(() => {
    if (!featureAccess.canUseMealPlanning && showMealPlanner) {
      setShowMealPlanner(false);
    }
  }, [featureAccess.canUseMealPlanning, showMealPlanner]);

  // Check account status for deactivated accounts
  const checkAccountStatus = async (user: User) => {
    try {
      setIsCheckingAccountStatus(true);
      
      // Import Firestore functions
      // Using static imports now
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if account is deactivated
        if (userData.accountStatus === 'deactivated') {
          setShowReactivationModal(true);
          return false; // Don't proceed with normal login
        }
      }
      
      return true; // Normal login can proceed
    } catch (error) {
      console.error('Failed to check account status:', error);
      return true; // On error, allow normal login
    } finally {
      setIsCheckingAccountStatus(false);
    }
  };

  // Handle reactivation success
  const handleReactivationSuccess = () => {
    setShowReactivationModal(false);
    // Set the user after successful reactivation
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
    }
    showSuccess('Account Reactivated', 'Welcome back! Your account has been successfully reactivated.');
  };

  // Handle reactivation decline
  const handleReactivationDecline = async () => {
    setShowReactivationModal(false);
    // Sign out the user
    try {
      await logOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if account is deactivated before proceeding
        const canProceed = await checkAccountStatus(user);

        if (canProceed) {
          // Only set user if email is verified OR they're a Google user
          const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
          const shouldAllowAccess = user.emailVerified || isGoogleUser;

          if (shouldAllowAccess) {
            setUser(user);
          } else {
            // User exists but email is not verified - keep them in verification state
            setUser(user); // We need to set the user so we can show the verification prompt
          }
        }
        // If account is deactivated, reactivation modal will be shown
        // and user will only be set after reactivation
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Load user settings and recipe limits when user changes
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        // Only proceed with data loading if email is verified OR they're a Google user
        const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
        const shouldLoadFullApp = user.emailVerified || isGoogleUser;

        if (shouldLoadFullApp) {
          try {
            setUserSettingsLoading(true);

            // Create/update user profile in Firestore for verified users only
            await createOrUpdateUserProfile(
              user.uid,
              user.email || '',
              user.displayName || undefined,
              user.photoURL || undefined
            );

            // Start session tracking - marks user as online
            await startSessionTracking(
              user.uid,
              user.email || undefined,
              user.displayName || undefined
            );

            // Initialize admin system if this is the designated admin
            await initializeAdminSystem(user);

            // Check for pending subscription sync (for users who paid and then signed in later)
            if (user.email) {
              SubscriptionSyncService.forceSyncCheck(user.email, 3).catch(error => {
                // Don't block app loading if sync fails
                console.log('Background subscription sync check completed');
              });
            }

            const [settings, limitInfo] = await Promise.all([
              getUserSettings(user.uid),
              getUserRecipeLimitInfo(user.uid)
            ]);
            setUserSettings(settings);
            setRecipeLimitInfo(limitInfo);
          } catch (error) {
            console.error('Error loading user data:', error);
          } finally {
            setUserSettingsLoading(false);
          }
        } else {
          // User exists but hasn't verified email - clear all app data
          setUserSettings(null);
          setRecipeLimitInfo(null);
          setUserSettingsLoading(false);
        }
      } else {
        setUserSettings(null);
        setRecipeLimitInfo(null);
        setUserSettingsLoading(false);
      }
    };

    loadUserData();

    // Cleanup: Stop session tracking when user logs out or component unmounts
    return () => {
      if (user?.uid) {
        stopSessionTracking(user.uid);
      }
    };
  }, [user]);


  const handleRecipeSubmit = async (recipe: string, filters: string[], mustUseIngredients?: string[], avoidIngredients?: string[]) => {
    // Scroll to top when conversion starts
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Check OpenAI consent first
    if (!checkConsentBeforeAI()) {
      return; // Consent modal will be shown by the hook
    }

    // Check daily conversion limits
    const conversionCheck = await DailyConversionService.canUserConvert(user!.uid);
    if (!conversionCheck.canConvert) {
      const resetTime = DailyConversionService.getTimeUntilReset();
      showError(
        'Daily Conversion Limit Reached', 
        `${conversionCheck.reason} Your limit resets in ${resetTime.hours}h ${resetTime.minutes}m.`,
        'limit-reached'
      );
      return;
    }


    setConverting(true);
    setResult('');
    setRecipeSaved(false);
    setCurrentRecipe({ original: recipe, filters });
    setSelectedSavedRecipe(null);

    try {
      // Record the conversion for usage tracking when API call is made
      // Recording conversion
      const conversionRecorded = await featureAccess.recordConversion();
      // Conversion recorded
      
      const convertedRecipe = await convertRecipeLocal(recipe, filters, undefined, userSettings || undefined, hasValidConsent, mustUseIngredients, avoidIngredients);
      
      // Track conversion with consent-based analytics
      trackRecipeConversion('convert', filters);
      
      if (convertedRecipe) {
        setResult(convertedRecipe);
        
        // Auto-save if enabled
        if (userSettings?.autoSaveRecipes) {
          try {
            // Extract imageUrl from the generated recipe JSON if available
            let existingImageUrl: string | undefined;
            try {
              const recipeData = JSON.parse(convertedRecipe);
              existingImageUrl = recipeData.imageUrl;
            } catch (error) {
              // Not JSON or no imageUrl, continue without
            }

            await saveRecipe(user!.uid, recipe, convertedRecipe, filters, undefined, existingImageUrl);
            setRecipeSaved(true); // Mark as saved when auto-save succeeds
            showSuccess('Recipe Auto-Saved', 'Your converted recipe has been automatically saved', 'auto-save');

            // Refresh recipe limit info
            const limitInfo = await getUserRecipeLimitInfo(user!.uid);
            setRecipeLimitInfo(limitInfo);
          } catch (error) {
            if (error instanceof Error && error.message.includes('Recipe limit reached')) {
              showError('Auto-Save Failed - Limit Reached', error.message, 'auto-save');
            } else {
              showError('Auto-Save Failed', 'Could not automatically save the recipe', 'auto-save');
            }
          }
        }
      }
    } catch (error) {
      setResult('Failed to convert recipe. Please try again.');
      showError('Conversion Failed', 'Unable to convert the recipe. Please check your input and try again.');
    } finally {
      setConverting(false);
    }
  };

  const handleSurpriseMe = async (filters: string[], mustUseIngredients?: string[], avoidIngredients?: string[]) => {
    // Scroll to top when surprise me starts
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Check OpenAI consent first
    if (!checkConsentBeforeAI()) {
      return; // Consent modal will be shown by the hook
    }

    // Check daily conversion limits
    const conversionCheck = await DailyConversionService.canUserConvert(user!.uid);
    if (!conversionCheck.canConvert) {
      const resetTime = DailyConversionService.getTimeUntilReset();
      showError(
        'Daily Conversion Limit Reached', 
        `${conversionCheck.reason} Your limit resets in ${resetTime.hours}h ${resetTime.minutes}m.`,
        'limit-reached'
      );
      return;
    }

    setConverting(true);
    setResult('');
    setRecipeSaved(false);
    
    // Generate a random recipe prompt
    let surprisePrompt = `Generate a complete, delicious recipe that follows these dietary requirements: ${filters.join(', ')}. Create something creative and unique.`;
    
    if (mustUseIngredients && mustUseIngredients.length > 0) {
      surprisePrompt += ` Make sure to include these ingredients: ${mustUseIngredients.join(', ')}.`;
    }
    
    if (avoidIngredients && avoidIngredients.length > 0) {
      surprisePrompt += ` Do not use any of these ingredients: ${avoidIngredients.join(', ')}.`;
    }
    setCurrentRecipe({ original: surprisePrompt, filters });
    setSelectedSavedRecipe(null);

    try {
      // Record the conversion for usage tracking when API call is made
      const conversionRecorded = await featureAccess.recordConversion();
      // Surprise conversion recorded
      
      const generatedRecipe = await convertRecipeLocal(surprisePrompt, filters, undefined, userSettings || undefined, hasValidConsent, mustUseIngredients, avoidIngredients);
      
      // Track surprise recipe generation with consent-based analytics
      trackRecipeConversion('surprise', filters);
      
      if (generatedRecipe) {
        setResult(generatedRecipe);
        
        // Auto-save if enabled
        if (userSettings?.autoSaveRecipes) {
          try {
            // Extract imageUrl from the generated recipe JSON if available
            let existingImageUrl: string | undefined;
            try {
              const recipeData = JSON.parse(generatedRecipe);
              existingImageUrl = recipeData.imageUrl;
            } catch (error) {
              // Not JSON or no imageUrl, continue without
            }

            await saveRecipe(user!.uid, surprisePrompt, generatedRecipe, filters, undefined, existingImageUrl);
            setRecipeSaved(true); // Mark as saved when auto-save succeeds
            showSuccess('Surprise Recipe Auto-Saved', 'Your creative recipe has been automatically saved', 'auto-save');

            // Refresh recipe limit info
            const limitInfo = await getUserRecipeLimitInfo(user!.uid);
            setRecipeLimitInfo(limitInfo);
          } catch (error) {
            if (error instanceof Error && error.message.includes('Recipe limit reached')) {
              showError('Auto-Save Failed - Limit Reached', error.message, 'auto-save');
            } else {
              showError('Auto-Save Failed', 'Could not automatically save the surprise recipe', 'auto-save');
            }
          }
        }
      }
    } catch (error) {
      setResult('Failed to generate surprise recipe. Please try again.');
      showError('Recipe Generation Failed', 'Unable to create a surprise recipe. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!user || !currentRecipe || !result) return;

    // Check if recipe is already saved
    if (recipeSaved) {
      showInfo('Already Saved', 'This recipe has already been saved to your collection.', 'save');
      return;
    }

    setSaving(true);
    try {
      // Extract imageUrl from the generated recipe JSON if available
      let existingImageUrl: string | undefined;
      try {
        const recipeData = JSON.parse(result);
        existingImageUrl = recipeData.imageUrl;
      } catch (error) {
        // Not JSON or no imageUrl, continue without
      }

      await saveRecipe(
        user.uid,
        currentRecipe.original,
        result,
        currentRecipe.filters,
        undefined, // title
        existingImageUrl // pass the existing image URL
      );
      setRecipeSaved(true);
      showSuccess('Recipe Saved', 'Your recipe has been successfully saved to your collection', 'save');
      
      // Refresh recipe limit info
      const limitInfo = await getUserRecipeLimitInfo(user.uid);
      setRecipeLimitInfo(limitInfo);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Recipe limit reached')) {
        showError('Recipe Limit Reached', error.message, 'save');
      } else {
        showError('Save Failed', 'Could not save the recipe. Please try again.', 'save');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSelectSavedRecipe = (recipe: SavedRecipe) => {
    setSelectedSavedRecipe(recipe);
    setResult(recipe.convertedRecipe);
    setShowSaved(false);
  };

  const handleViewRecipe = (recipe: SavedRecipe) => {
    setViewingRecipe(recipe);
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
      setResult('');
      setCurrentRecipe(null);
      setSelectedSavedRecipe(null);
      navigate('/signin');
    } catch (error) {
    }
  };

  // Helper functions for upgrade modal
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

  const getPaymentLink = (planId: string): string | null => {
    if (planId === 'free' || planId === 'enterprise') {
      return null;
    }

    const links = STRIPE_PAYMENT_LINKS[planId as keyof typeof STRIPE_PAYMENT_LINKS];
    if (!links) return null;

    return isYearly ? links.yearly : links.monthly;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading Recipe Revamp...</p>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionProvider>
      <div className="min-h-screen bg-gradient-to-b from-green-50/30 via-emerald-50/20 to-white">
      <SEOHead pageKey="app" />
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <button
              onClick={() => {
                setShowSaved(false);
                setShowSettings(false);
              }}
              className="flex items-center gap-3 group"
            >
              <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Recipe Revamped</span>
            </button>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Desktop Navigation */}
                  <nav className="hidden md:flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!showSaved && !showSettings && !showMealPlanner) return;
                        setShowSaved(false);
                        setShowSettings(false);
                        setShowMealPlanner(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                        !showSaved && !showSettings && !showMealPlanner
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                          : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Convert</span>
                    </button>

                    <button
                      onClick={() => {
                        if (showSaved) return;
                        setShowSaved(true);
                        setShowSettings(false);
                        setShowMealPlanner(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                        showSaved
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                          : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Recipe Book</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!featureAccess.canUseMealPlanning) {
                          showError(
                            'Upgrade Required',
                            'Meal planning calendar is available for Chef plan and higher. Upgrade to access this feature!'
                          );
                          const upgradeButton = document.querySelector('[data-upgrade-plan]') as HTMLButtonElement;
                          if (upgradeButton) {
                            upgradeButton.click();
                          }
                          return;
                        }
                        if (showMealPlanner) return;
                        setShowMealPlanner(true);
                        setShowSaved(false);
                        setShowSettings(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                        !featureAccess.canUseMealPlanning
                          ? 'text-gray-400 cursor-not-allowed opacity-60'
                          : showMealPlanner
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                            : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                      }`}
                      disabled={!featureAccess.canUseMealPlanning}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Meal Planning</span>
                      {!featureAccess.canUseMealPlanning && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                          Chef+
                        </span>
                      )}
                    </button>
                  </nav>

                  <div className="flex items-center gap-3 ml-4">
                    <NotificationBell
                      userId={user.uid}
                      onNotificationClick={(notification) => setSelectedNotification(notification)}
                    />
                    <UserAccountDropdown
                      user={user}
                      profilePictureUrl={userSettings?.profilePictureUrl}
                      onShowSaved={() => {
                        setShowSaved(!showSaved);
                        setShowSettings(false);
                        setShowMealPlanner(false);
                      }}
                      onShowSettings={() => {
                        setShowSettings(!showSettings);
                        setShowSaved(false);
                        setShowMealPlanner(false);
                      }}
                      onSignOut={handleSignOut}
                      onShowUpgradeModal={() => setShowUpgradeModal(true)}
                    />

                    {/* Mobile Menu Button */}
                    <button
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      className="md:hidden p-2 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                      aria-label="Toggle mobile menu"
                    >
                      {showMobileMenu ? (
                        <X className="w-6 h-6" />
                      ) : (
                        <Menu className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 pt-2 pb-4 space-y-2">
              <button
                onClick={() => {
                  if (!showSaved && !showSettings && !showMealPlanner) {
                    setShowMobileMenu(false);
                    return;
                  }
                  setShowSaved(false);
                  setShowSettings(false);
                  setShowMealPlanner(false);
                  setShowMobileMenu(false);
                }}
                className={`w-full justify-start flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  !showSaved && !showSettings && !showMealPlanner
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Convert</span>
              </button>

              <button
                onClick={() => {
                  if (showSaved) {
                    setShowMobileMenu(false);
                    return;
                  }
                  setShowSaved(true);
                  setShowSettings(false);
                  setShowMealPlanner(false);
                  setShowMobileMenu(false);
                }}
                className={`w-full justify-start flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  showSaved
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Recipe Book</span>
              </button>

              <button
                onClick={() => {
                  if (!featureAccess.canUseMealPlanning) {
                    showError(
                      'Upgrade Required',
                      'Meal planning calendar is available for Chef plan and higher. Upgrade to access this feature!'
                    );
                    const upgradeButton = document.querySelector('[data-upgrade-plan]') as HTMLButtonElement;
                    if (upgradeButton) {
                      upgradeButton.click();
                    }
                    setShowMobileMenu(false);
                    return;
                  }
                  if (showMealPlanner) {
                    setShowMobileMenu(false);
                    return;
                  }
                  setShowMealPlanner(true);
                  setShowSaved(false);
                  setShowSettings(false);
                  setShowMobileMenu(false);
                }}
                className={`w-full justify-start flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  !featureAccess.canUseMealPlanning
                    ? 'text-gray-400 cursor-not-allowed opacity-60'
                    : showMealPlanner
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
                disabled={!featureAccess.canUseMealPlanning}
              >
                <Calendar className="w-4 h-4" />
                <span>Meal Planning</span>
                {!featureAccess.canUseMealPlanning && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold ml-auto">
                    Chef+
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={`relative px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 z-0 ${
        !showSaved && !showSettings && !showMealPlanner
          ? 'w-full'
          : 'max-w-7xl mx-auto'
      }`}>
        {/* Decorative Background Elements for Convert Page */}
        {!showSaved && !showSettings && !showMealPlanner && (
          <>
            <div className="absolute top-0 left-0 w-64 h-64 bg-green-200/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute top-32 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
            <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-green-100/30 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
          </>
        )}

        {/* Decorative Background Elements for Recipe Book Page */}
        {showSaved && !showSettings && !showMealPlanner && (
          <>
            <div className="absolute top-10 right-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '5s' }} />
            <div className="absolute top-40 left-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '7s', animationDelay: '1.5s' }} />
            <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '6s', animationDelay: '3s' }} />
          </>
        )}
        {!user ? (
          <div className="flex justify-center py-6 sm:py-8 lg:py-12">
            {authMode === 'signin' ? (
              <SignIn
                onSignIn={() => setUser(auth.currentUser)}
                onSwitchToSignUp={() => setAuthMode('signup')}
              />
            ) : (
              <SignUp
                onSignUp={() => setAuthMode('signin')}
                onSwitchToSignIn={() => setAuthMode('signin')}
              />
            )}
          </div>
        ) : !user.emailVerified && !user.providerData.some(provider => provider.providerId === 'google.com') ? (
          <div className="flex justify-center py-6 sm:py-8 lg:py-12">
            <EmailVerificationPrompt
              user={user}
              onBackToSignIn={() => setAuthMode('signin')}
            />
          </div>
        ) : (
          <>
            {/* Model Loading Status */}


            {showSettings ? (
              <Settings
                user={user}
                onBack={() => setShowSettings(false)}
                onSettingsUpdate={(updatedSettings) => setUserSettings(updatedSettings)}
                onShowUpgradeModal={() => setShowUpgradeModal(true)}
                initialActiveSection={new URLSearchParams(location.search).get('section') || undefined}
                featureAccess={{
                  canSetDefaultPreferences: featureAccess.canSetDefaultPreferences,
                  canBackupRestore: featureAccess.canBackupRestore,
                  canUploadProfilePicture: featureAccess.canUploadProfilePicture,
                  canUseHealthConditions: featureAccess.canUseHealthConditions,
                  canUseHealthGoals: featureAccess.canUseHealthGoals,
                  availableDietaryFilters: featureAccess.availableDietaryFilters,
                  currentPlan: featureAccess.currentPlan
                }}
              />
            ) : showSaved ? (
              <SavedRecipes 
                userId={user.uid} 
                onSelect={handleSelectSavedRecipe}
                onViewRecipe={handleViewRecipe}
                userSettings={userSettings || undefined}
                featureAccess={{
                  recipeLimit: featureAccess.recipeLimit,
                  currentRecipeCount: featureAccess.currentRecipeCount,
                  currentPlan: featureAccess.currentPlan,
                  canSaveRecipes: featureAccess.canSaveRecipes,
                  canUseAdvancedFilters: featureAccess.canUseAdvancedFilters,
                  canUseHealthConditions: featureAccess.canUseHealthConditions
                }}
              />
            ) : showMealPlanner ? (
              featureAccess.canUseMealPlanning ? (
                <MealPlannerCalendar
                  userId={user.uid}
                  userSettings={userSettings || undefined}
                  canUseNutritionAnalysis={featureAccess.canUseNutritionAnalysis}
                  featureAccess={featureAccess}
                  onShowUpgradeModal={() => setShowUpgradeModal(true)}
                />
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 text-center">
                  <Calendar className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">
                    Meal Planning Calendar - Chef Plan Required
                  </h3>
                  <p className="text-orange-700 mb-4">
                    Organize your recipes with our advanced meal planning calendar. Available for Chef plan subscribers and higher.
                  </p>
                  <div className="space-y-2 text-sm text-orange-600 mb-6">
                    <p>✓ Weekly meal planning</p>
                    <p>✓ Drag-and-drop recipe organization</p>
                    <p>✓ Automatic shopping list generation</p>
                    <p>✓ Nutritional planning overview</p>
                  </div>
                  <button
                    onClick={() => {
                      const upgradeButton = document.querySelector('[data-upgrade-plan]') as HTMLButtonElement;
                      if (upgradeButton) {
                        upgradeButton.click();
                      }
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upgrade to Chef Plan
                  </button>
                </div>
              )
            ) : (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Enhanced Conditional Layout with Smooth Transitions */}
                <div
                  className={`transition-all duration-1000 ease-out transform ${
                    !result && !converting
                      ? 'max-w-2xl mx-auto'
                      : 'max-w-none'
                  }`}
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div
                    className={`grid gap-4 sm:gap-6 lg:gap-8 items-start transition-all duration-1000 ease-out ${
                      !result && !converting
                        ? 'grid-cols-1'
                        : 'grid-cols-1 lg:grid-cols-12'
                    }`}
                    style={{
                      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                      transitionDelay: '50ms',
                    }}
                  >
                    <div
                      className={`bg-white rounded-lg shadow-md p-4 sm:p-6 transition-all duration-1000 ease-out transform ${
                        !result && !converting
                          ? 'hover:shadow-lg'
                          : 'lg:col-span-4 hover:shadow-lg'
                      }`}
                      style={{
                        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                        transitionDelay: '100ms',
                      }}
                    >
                      <RecipeInput
                        onSubmit={handleRecipeSubmit}
                        onSurpriseMe={handleSurpriseMe}
                        disabled={converting}
                        userSettings={userSettings || undefined}
                        userSettingsLoading={userSettingsLoading}
                        availableDietaryFilters={featureAccess.availableDietaryFilters}
                        currentPlan={featureAccess.currentPlan}
                        dailyUsage={{
                          used: featureAccess.conversionsUsedToday,
                          limit: featureAccess.conversionLimit
                        }}
                        onShowUpgradeModal={() => setShowUpgradeModal(true)}
                      />
                    </div>

                    {/* Recipe Display with Enhanced Animations */}
                    <div
                      className={`transition-all duration-1000 ease-out transform origin-left ${
                        (result || converting)
                          ? 'opacity-100 scale-100 translate-y-0 translate-x-0 lg:col-span-8 mt-4 lg:mt-0'
                          : 'opacity-0 scale-95 translate-y-8 translate-x-4 pointer-events-none'
                      }`}
                      style={{
                        transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        transitionDelay: (result || converting) ? '200ms' : '0ms',
                      }}
                    >
                      <div className={`transition-all duration-800 ease-out ${
                        (result || converting) ? 'blur-0' : 'blur-sm'
                      }`}>
                        <StructuredRecipeDisplay
                          recipeJson={result}
                          loading={converting}
                          saving={saving}
                          recipeSaved={recipeSaved}
                          onSave={handleSaveRecipe}
                          canSave={!!user && !!result && !selectedSavedRecipe && (recipeLimitInfo?.canSave ?? true)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Upgrade Plan Modal - Inside main element */}
        {showUpgradeModal && !isAdmin && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm transition-opacity" onClick={() => setShowUpgradeModal(false)}>
            {/* Modal - Fixed centered with internal scroll */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                          Upgrade Your Plan
                        </h2>
                        <p className="text-green-50 mt-1 text-lg">
                          Unlock unlimited recipes and premium features
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
                                        Save ${getSavingsInfo(planId)?.savingsAmount} ({getSavingsInfo(planId)?.savingsPercentage}%)
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
          </div>,
          document.body
        )}
      </main>

      {/* Recipe Viewer Modal */}
      {viewingRecipe && (
        <RecipeViewer
          recipe={viewingRecipe}
          isOpen={!!viewingRecipe}
          onClose={() => setViewingRecipe(null)}
          onEdit={(recipe) => {
            // Open recipe editor modal
            setEditingRecipe(recipe);
            setViewingRecipe(null);
          }}
        />
      )}

      {/* Recipe Editor Modal */}
      {editingRecipe && (
        <RecipeEditor
          recipe={editingRecipe}
          isOpen={!!editingRecipe}
          onClose={() => setEditingRecipe(null)}
          onUpdate={(updatedRecipe) => {
            // Refresh the recipes list or handle the update
            setEditingRecipe(null);
            // You might want to trigger a refresh of the saved recipes here
          }}
        />
      )}

      {/* Footer - Only show for logged-in users */}
      {user && <AppFooter />}

      {/* Reactivation Modal */}
      <ReactivationModal
        isOpen={showReactivationModal}
        user={auth.currentUser}
        onReactivate={handleReactivationSuccess}
        onDecline={handleReactivationDecline}
      />

      {/* Payment Success Popup */}
      <PaymentSuccessPopup
        isOpen={showSuccessPopup}
        onClose={closeSuccessPopup}
      />

      {/* Notification Popup - Rendered after main */}
      {selectedNotification && (
        <NotificationPopup
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}

    </div>
    </SubscriptionProvider>
  );
}
