import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { RecipeInput } from '../components/RecipeInput';
import { StructuredRecipeDisplay } from '../components/StructuredRecipeDisplay';
import { convertRecipeLocal } from '../lib/ai';
import { saveRecipe, getUserRecipeLimitInfo } from '../lib/firestore';
import type { SavedRecipe } from '../lib/validation';
import type { UserSettings } from '../types/userSettings';
import { useToast } from '../components/ToastContainer';
import type { FeatureAccess } from '../hooks/useFeatureAccess';
import { useOpenAIConsent } from '../hooks/useOpenAIConsent';
import { DailyConversionService } from '../lib/dailyConversionService';
import { trackRecipeConversion } from '../lib/analytics';

// Outlet context type
interface AppOutletContext {
  user: User;
  userSettings: UserSettings | null;
  featureAccess: FeatureAccess;
  updateRecipeCount: (count: number) => void;
}

export function ConvertPage() {
  // Get shared state from AppLayout via Outlet context
  const { user, userSettings, featureAccess } = useOutletContext<AppOutletContext>();

  const [converting, setConverting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');
  const [recipeSaved, setRecipeSaved] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<{ original: string; filters: string[] } | null>(null);
  const [selectedSavedRecipe, setSelectedSavedRecipe] = useState<SavedRecipe | null>(null);
  const [recipeLimitInfo, setRecipeLimitInfo] = useState<{
    currentCount: number;
    limit: number;
    plan: string;
    canSave: boolean;
  } | null>(null);

  const { showSuccess, showError, showInfo } = useToast();
  const { checkConsentBeforeAI, hasValidConsent } = useOpenAIConsent();

  // Load recipe limit info when user changes
  useEffect(() => {
    const loadRecipeLimitInfo = async () => {
      if (user && user.emailVerified) {
        try {
          const limitInfo = await getUserRecipeLimitInfo(user.uid);
          setRecipeLimitInfo(limitInfo);
        } catch (error) {
          console.error('Error loading recipe limit info:', error);
        }
      } else {
        setRecipeLimitInfo(null);
      }
    };

    loadRecipeLimitInfo();
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
      // Record the conversion for usage tracking
      const conversionRecorded = await featureAccess.recordConversion();

      const convertedRecipe = await convertRecipeLocal(
        recipe,
        filters,
        undefined,
        userSettings || undefined,
        hasValidConsent,
        mustUseIngredients,
        avoidIngredients
      );
      setResult(convertedRecipe);
      trackRecipeConversion('convert', filters);

      // Auto-save if user has space
      if (recipeLimitInfo?.canSave) {
        try {
          let existingImageUrl: string | undefined;
          try {
            const recipeData = JSON.parse(convertedRecipe);
            existingImageUrl = recipeData.imageUrl;
          } catch (error) {
            // Not JSON or no imageUrl
          }

          await saveRecipe(user!.uid, recipe, convertedRecipe, filters, undefined, existingImageUrl);
          setRecipeSaved(true);
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
    } catch (error) {
      setResult('Failed to convert recipe. Please try again.');
      showError('Conversion Failed', 'Unable to convert the recipe. Please check your input and try again.');
    } finally {
      setConverting(false);
    }
  };

  const handleSurpriseMe = async (filters: string[], mustUseIngredients?: string[], avoidIngredients?: string[]) => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Check OpenAI consent
    if (!checkConsentBeforeAI()) {
      return;
    }

    // Check daily limits
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
      surprisePrompt += ` Avoid using these ingredients: ${avoidIngredients.join(', ')}.`;
    }

    setCurrentRecipe({ original: surprisePrompt, filters });
    setSelectedSavedRecipe(null);

    try {
      // Record the conversion for usage tracking
      const conversionRecorded = await featureAccess.recordConversion();

      const generatedRecipe = await convertRecipeLocal(
        surprisePrompt,
        filters,
        undefined,
        userSettings || undefined,
        hasValidConsent,
        mustUseIngredients,
        avoidIngredients
      );
      setResult(generatedRecipe);
      trackRecipeConversion('surprise', filters);

      // Auto-save if space available
      if (recipeLimitInfo?.canSave) {
        try {
          let existingImageUrl: string | undefined;
          try {
            const recipeData = JSON.parse(generatedRecipe);
            existingImageUrl = recipeData.imageUrl;
          } catch (error) {
            // Not JSON
          }

          await saveRecipe(user!.uid, surprisePrompt, generatedRecipe, filters, undefined, existingImageUrl);
          setRecipeSaved(true);
          showSuccess('Surprise Recipe Auto-Saved', 'Your creative recipe has been automatically saved', 'auto-save');

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
    } catch (error) {
      setResult('Failed to generate surprise recipe. Please try again.');
      showError('Recipe Generation Failed', 'Unable to create a surprise recipe. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!user || !currentRecipe || !result) return;

    // Check if already saved
    if (recipeSaved) {
      showInfo('Already Saved', 'This recipe has already been saved to your collection.', 'save');
      return;
    }

    setSaving(true);
    try {
      // Extract imageUrl
      let existingImageUrl: string | undefined;
      try {
        const recipeData = JSON.parse(result);
        existingImageUrl = recipeData.imageUrl;
      } catch (error) {
        // Not JSON
      }

      await saveRecipe(
        user.uid,
        currentRecipe.original,
        result,
        currentRecipe.filters,
        undefined,
        existingImageUrl
      );
      setRecipeSaved(true);
      showSuccess('Recipe Saved', 'Your recipe has been successfully saved to your collection', 'save');

      // Refresh limit
      const limitInfo = await getUserRecipeLimitInfo(user.uid);
      setRecipeLimitInfo(limitInfo);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Recipe limit reached')) {
        showError('Save Failed - Limit Reached', error.message, 'save');
      } else {
        showError('Save Failed', 'Unable to save the recipe. Please try again.', 'save');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-green-200/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-32 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-green-100/30 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />

      <div className="space-y-4 sm:space-y-6">
        <div className="w-full">
          <div
            className={`grid gap-4 sm:gap-6 lg:gap-8 items-start ${
              !result && !converting
                ? 'grid-cols-1 max-w-2xl mx-auto'
                : 'grid-cols-1 lg:grid-cols-12 max-w-full'
            }`}
          >
            {/* Input Section */}
            <div
              className={`bg-white rounded-lg shadow-md p-4 sm:p-6 ${
                !result && !converting
                  ? 'hover:shadow-lg'
                  : 'lg:col-span-4 hover:shadow-lg'
              }`}
            >
              <RecipeInput
                onSubmit={handleRecipeSubmit}
                onSurpriseMe={handleSurpriseMe}
                disabled={converting}
                userSettings={userSettings || undefined}
                userSettingsLoading={false}
                availableDietaryFilters={featureAccess.availableDietaryFilters}
                currentPlan={featureAccess.currentPlan}
                dailyUsage={{
                  used: featureAccess.conversionsUsedToday,
                  limit: featureAccess.conversionLimit
                }}
              />
            </div>

            {/* Recipe Display */}
            <div
              className={`${
                (result || converting)
                  ? 'lg:col-span-8 mt-4 lg:mt-0 block'
                  : 'pointer-events-none hidden lg:block'
              }`}
            >
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
        </div>
      </div>
    </>
  );
}
