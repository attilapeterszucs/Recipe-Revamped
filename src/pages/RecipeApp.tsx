import { useState, useEffect } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Zap, BookOpen, Calendar, Menu, X } from 'lucide-react';
import { auth, logOut } from '../lib/firebase';
import { SignIn } from '../components/Auth/SignIn';
import { SignUp } from '../components/Auth/SignUp';
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

export function RecipeApp() {
  const navigate = useNavigate();
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
  const { showSuccess, showError, showInfo } = useToast();
  
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Load user settings and recipe limits when user changes
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          // Create/update user profile in Firestore for all users (both email and Google)
          await createOrUpdateUserProfile(
            user.uid,
            user.email || '',
            user.displayName || undefined,
            user.photoURL || undefined
          );
          
          // Initialize admin system if this is the designated admin
          await initializeAdminSystem(user);
          
          // Only load full app settings if email is verified OR if they signed up via Google
          const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
          const shouldLoadFullApp = user.emailVerified || isGoogleUser;
          
          if (shouldLoadFullApp) {
            const [settings, limitInfo] = await Promise.all([
              getUserSettings(user.uid),
              getUserRecipeLimitInfo(user.uid)
            ]);
            setUserSettings(settings);
            setRecipeLimitInfo(limitInfo);
          } else {
            // User exists but hasn't verified email - don't load app data
            setUserSettings(null);
            setRecipeLimitInfo(null);
          }
        } catch (error) {
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => {
                setShowSaved(false);
                setShowSettings(false);
              }}
              className="flex items-center space-x-3 hover:opacity-75 transition-opacity"
            >
              <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-8 w-8" />
              <h1 className="hidden sm:block text-2xl font-bold text-gray-900">Recipe Revamped</h1>
            </button>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Navigation Buttons */}
                  <nav className="hidden md:flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setShowSaved(false);
                        setShowSettings(false);
                        setShowMealPlanner(false);
                      }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        !showSaved && !showSettings && !showMealPlanner
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Convert</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowSaved(!showSaved);
                        setShowSettings(false);
                        setShowMealPlanner(false);
                      }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        showSaved 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
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
                        setShowMealPlanner(!showMealPlanner);
                        setShowSaved(false);
                        setShowSettings(false);
                      }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        !featureAccess.canUseMealPlanning 
                          ? 'text-gray-400 cursor-not-allowed opacity-60'
                          : showMealPlanner 
                            ? 'bg-green-100 text-green-700' 
                            : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                      }`}
                      disabled={!featureAccess.canUseMealPlanning}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Meal Planning Calendar</span>
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
                      className="md:hidden p-2 text-gray-600 hover:text-green-600 transition-colors rounded-full hover:bg-gray-100"
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
          <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3">
            <nav className="space-y-2">
              <button
                onClick={() => {
                  setShowSaved(false);
                  setShowSettings(false);
                  setShowMealPlanner(false);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-left ${
                  !showSaved && !showSettings && !showMealPlanner
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Zap className="w-5 h-5" />
                <span className="font-medium">Convert</span>
              </button>
              
              <button
                onClick={() => {
                  setShowSaved(!showSaved);
                  setShowSettings(false);
                  setShowMealPlanner(false);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-left ${
                  showSaved 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <BookOpen className="w-5 h-5" />
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
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors text-left ${
                  !featureAccess.canUseMealPlanning 
                    ? 'text-gray-400 cursor-not-allowed opacity-60'
                    : showMealPlanner 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
                disabled={!featureAccess.canUseMealPlanning}
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">Meal Planning Calendar</span>
                </div>
                {!featureAccess.canUseMealPlanning && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    Chef+
                  </span>
                )}
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          <div className="flex justify-center py-12">
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
        ) : (
          <>
            {/* Model Loading Status */}


            {showSettings ? (
              <Settings 
                user={user} 
                onBack={() => setShowSettings(false)}
                onSettingsUpdate={(updatedSettings) => setUserSettings(updatedSettings)}
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Enter Your Recipe
                      </h2>
                      <div className="text-sm text-gray-600 font-medium">
                        {featureAccess.conversionsUsedToday}/{featureAccess.conversionLimit === -1 ? '∞' : featureAccess.conversionLimit}
                      </div>
                    </div>
                    <RecipeInput 
                      onSubmit={handleRecipeSubmit}
                      onSurpriseMe={handleSurpriseMe}
                      disabled={converting}
                      userSettings={userSettings || undefined}
                      availableDietaryFilters={featureAccess.availableDietaryFilters}
                      currentPlan={featureAccess.currentPlan}
                    />
                  </div>

                  <div>
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

    </div>
    </SubscriptionProvider>
  );
}
