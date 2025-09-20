import { useState, useEffect } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Zap, BookOpen, Calendar, Menu, X } from 'lucide-react';
import { auth, logOut } from '../lib/firebase';
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
import { AppFooter } from '../components/AppFooter';
import { DailyConversionService } from '../lib/dailyConversionService';
import { trackRecipeConversion, trackPageView } from '../lib/analytics';
import { consentStorage } from '../lib/consentStorage';
import { ReactivationModal } from '../components/ReactivationModal';
import { PaymentSuccessPopup } from '../components/PaymentSuccessPopup';
import { usePaymentSuccess } from '../hooks/usePaymentSuccess';
import { SEOHead } from '../components/SEOHead';
import { SubscriptionSyncService } from '../lib/subscriptionSyncService';
import { CancelledSubscriptionBanner } from '../components/CancelledSubscriptionBanner';

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
  const { showSuccess, showError, showInfo } = useToast();

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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
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
            // Create/update user profile in Firestore for verified users only
            await createOrUpdateUserProfile(
              user.uid,
              user.email || '',
              user.displayName || undefined,
              user.photoURL || undefined
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
          }
        } else {
          // User exists but hasn't verified email - clear all app data
          setUserSettings(null);
          setRecipeLimitInfo(null);
        }
      } else {
        setUserSettings(null);
        setRecipeLimitInfo(null);
      }
    };

    loadUserData();
  }, [user]);


  const handleRecipeSubmit = async (recipe: string, filters: string[], mustUseIngredients?: string[], avoidIngredients?: string[]) => {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <SEOHead pageKey="app" />
      <CancelledSubscriptionBanner />
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => {
                setShowSaved(false);
                setShowSettings(false);
              }}
              className="flex items-center space-x-2 sm:space-x-3 hover:opacity-75 transition-opacity"
            >
              <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-7 w-7 sm:h-8 sm:w-8" />
              <h1 className="hidden sm:block text-xl sm:text-2xl font-bold text-gray-900">Recipe Revamped</h1>
            </button>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user ? (
                <>
                  {/* Navigation Buttons */}
                  <nav className="hidden md:flex items-center space-x-2 lg:space-x-3">
                    <button
                      onClick={() => {
                        setShowSaved(false);
                        setShowSettings(false);
                        setShowMealPlanner(false);
                      }}
                      className={`flex items-center space-x-1.5 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
                        !showSaved && !showSettings && !showMealPlanner
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Convert</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowSaved(!showSaved);
                        setShowSettings(false);
                        setShowMealPlanner(false);
                      }}
                      className={`flex items-center space-x-1.5 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
                        showSaved 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Recipe Book</span>
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
                        setShowMealPlanner(!showMealPlanner);
                        setShowSaved(false);
                        setShowSettings(false);
                      }}
                      className={`flex items-center space-x-1.5 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
                        !featureAccess.canUseMealPlanning 
                          ? 'text-gray-400 cursor-not-allowed opacity-60'
                          : showMealPlanner 
                            ? 'bg-green-100 text-green-700' 
                            : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                      }`}
                      disabled={!featureAccess.canUseMealPlanning}
                    >
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Meal Planning</span>
                      <span className="sm:hidden">Meal</span>
                      {!featureAccess.canUseMealPlanning && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-1 py-0.5 rounded">
                          Chef+
                        </span>
                      )}
                    </button>
                  </nav>
                  
                  <div className="flex items-center space-x-3">
                    <NotificationBell userId={user.uid} />
                    <UserAccountDropdown
                    user={user}
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
                    />
                    
                    {/* Mobile Menu Button */}
                    <button
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      className="md:hidden p-1.5 sm:p-2 text-gray-600 hover:text-green-600 transition-colors rounded-lg hover:bg-gray-100"
                      aria-label="Toggle mobile menu"
                    >
                      {showMobileMenu ? (
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
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
          <div className="md:hidden bg-white border-t border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
            <nav className="space-y-1 sm:space-y-2">
              <button
                onClick={() => {
                  setShowSaved(false);
                  setShowSettings(false);
                  setShowMealPlanner(false);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center space-x-2 sm:space-x-3 px-2 py-2 sm:px-3 sm:py-3 rounded-lg transition-colors text-left text-sm sm:text-base ${
                  !showSaved && !showSettings && !showMealPlanner
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium">Convert</span>
              </button>
              
              <button
                onClick={() => {
                  setShowSaved(!showSaved);
                  setShowSettings(false);
                  setShowMealPlanner(false);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center space-x-2 sm:space-x-3 px-2 py-2 sm:px-3 sm:py-3 rounded-lg transition-colors text-left text-sm sm:text-base ${
                  showSaved 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium">Recipe Book</span>
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
                  setShowMealPlanner(!showMealPlanner);
                  setShowSaved(false);
                  setShowSettings(false);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center justify-between px-2 py-2 sm:px-3 sm:py-3 rounded-lg transition-colors text-left text-sm sm:text-base ${
                  !featureAccess.canUseMealPlanning 
                    ? 'text-gray-400 cursor-not-allowed opacity-60'
                    : showMealPlanner 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
                disabled={!featureAccess.canUseMealPlanning}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium">Meal Planning Calendar</span>
                </div>
                {!featureAccess.canUseMealPlanning && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                    Chef+
                  </span>
                )}
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={`px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 ${
        !showSaved && !showSettings && !showMealPlanner
          ? 'w-full'
          : 'max-w-7xl mx-auto'
      }`}>
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
                initialActiveSection={new URLSearchParams(location.search).get('section') || undefined}
                featureAccess={{
                  canSetDefaultPreferences: featureAccess.canSetDefaultPreferences,
                  canBackupRestore: featureAccess.canBackupRestore,
                  canUploadProfilePicture: featureAccess.canUploadProfilePicture,
                  canUseHealthConditions: featureAccess.canUseHealthConditions,
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
              <div className="space-y-4 sm:space-y-6">
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
                        availableDietaryFilters={featureAccess.availableDietaryFilters}
                        currentPlan={featureAccess.currentPlan}
                        dailyUsage={{
                          used: featureAccess.conversionsUsedToday,
                          limit: featureAccess.conversionLimit
                        }}
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

    </div>
    </SubscriptionProvider>
  );
}
