import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { app } from './firebase';
import type { UserSettings } from '../types/userSettings';
import { ImageService } from './imageService';
import { buildProfileContext, getGoalSpecificPrompts } from './profileContext';
import { logger } from './logger';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Recipe response interfaces
interface RecipeResponse {
  recipeName: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: number;
  dietaryRequirements: string;
  healthConditions?: string[];
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  tips: string[];
  profileMatchExplanation?: string;
  imageUrl?: string;
}

interface FirebaseFunctionResponse {
  success: boolean;
  data: RecipeResponse;
  tokensUsed: number;
}

// Determine conversion mode based on input
const determineMode = (input: string): 'convert' | 'create' | 'surprise' => {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('generate a complete, delicious recipe') || lowerInput.includes('create something creative')) {
    return 'surprise';
  }
  
  // If it's a short input (likely just a dish name), it's creation mode
  if (input.trim().split(' ').length <= 5 && !lowerInput.includes('ingredients') && !lowerInput.includes('instructions')) {
    return 'create';
  }
  
  // Otherwise, it's conversion mode
  return 'convert';
};

// Convert structured response to markdown format for compatibility with existing UI
const convertToMarkdown = (recipe: RecipeResponse): string => {
  let markdown = `**Recipe Name:** ${recipe.recipeName}
**Prep Time:** ${recipe.prepTime} **Cook Time:** ${recipe.cookTime} **Total Time:** ${recipe.totalTime} **Servings:** ${recipe.servings}
**Dietary Requirements:** ${recipe.dietaryRequirements}

## Ingredients:
${recipe.ingredients.map(ingredient => `- ${ingredient}`).join('\n')}

## Instructions:
${recipe.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

## Nutrition Information (per serving):
- Calories: ${recipe.nutrition.calories} kcal
- Protein: ${recipe.nutrition.protein}g
- Carbohydrates: ${recipe.nutrition.carbohydrates}g
- Fat: ${recipe.nutrition.fat}g
- Fiber: ${recipe.nutrition.fiber}g
- Sodium: ${recipe.nutrition.sodium}mg`;

  // Add profile match explanation if available
  if (recipe.profileMatchExplanation) {
    markdown += `

## Why This Recipe Fits Your Profile:
${recipe.profileMatchExplanation}`;
  }

  markdown += `

## Tips:
${recipe.tips.map(tip => `- ${tip}`).join('\n')}`;

  return markdown;
};

// Main recipe conversion function - now using secure Firebase Functions
export const convertRecipeLocal = async (
  originalRecipe: string,
  filters: string[],
  onStream?: (chunk: string) => void,
  userSettings?: UserSettings,
  hasConsent?: boolean,
  mustUseIngredients?: string[],
  avoidIngredients?: string[]
): Promise<string> => {
  try {
    // Check for user consent before proceeding
    if (!hasConsent) {
      throw new Error('OpenAI data sharing consent is required to generate recipes. Please accept the consent in your settings.');
    }

    // Check authentication
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to generate recipes');
    }

    // Get Firebase ID token for authentication
    const idToken = await user.getIdToken();

    const mode = determineMode(originalRecipe);

    // Build profile context for enhanced AI prompts
    const profileContext = userSettings ? buildProfileContext(userSettings) : null;
    const goalPrompts = userSettings?.personalProfile?.healthGoals
      ? getGoalSpecificPrompts(userSettings.personalProfile.healthGoals.filter(g => g.isActive))
      : [];

    // Prepare request data
    const requestData = {
      originalRecipe,
      filters,
      userSettings: userSettings || {
        defaultServingSize: 4,
        preferredUnits: 'metric' as const,
        healthConditions: [],
        defaultDietaryFilters: []
      },
      mode,
      mustUseIngredients,
      avoidIngredients,
      profileContext,
      goalPrompts
    };

    // Call Firebase Function directly via HTTPS - Updated for Gen2 deployment
    const functionsUrl = process.env.NODE_ENV === 'development' 
      ? 'https://generaterecipev2-428797186446.us-central1.run.app'
      : 'https://generaterecipev2-428797186446.us-central1.run.app';

    const response = await fetch(functionsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result: FirebaseFunctionResponse = await response.json();

    if (!result.success) {
      throw new Error('Recipe conversion failed');
    }

    // Validate response structure
    const recipeData = result.data;
    if (!recipeData.recipeName || !Array.isArray(recipeData.ingredients) || !Array.isArray(recipeData.instructions)) {
      throw new Error('Invalid recipe structure from AI');
    }

    // Fetch image for the recipe using searchimagesv2 service or fallback
    try {
      // Fetching image for recipe
      const imageUrl = await ImageService.getRecipeImage(recipeData.recipeName);
      if (imageUrl) {
        recipeData.imageUrl = imageUrl;
        // Successfully added image to recipe
      } else {
        // No image found from search service, trying fallback
        // Import fallback service
        const { getDefaultRecipeImage } = await import('./recipeImageService');
        const fallbackImage = await getDefaultRecipeImage(JSON.stringify(recipeData), user.uid);
        recipeData.imageUrl = fallbackImage;
        // Using fallback image for recipe
      }
    } catch (imageError) {
      // Failed to fetch recipe image, using fallback
      try {
        // Try fallback service
        const { getDefaultRecipeImage } = await import('./recipeImageService');
        const fallbackImage = await getDefaultRecipeImage(JSON.stringify(recipeData), user.uid);
        recipeData.imageUrl = fallbackImage;
        // Using fallback image after error
      } catch (fallbackError) {
        // Fallback image service also failed
        // Continue without image - this is not a critical failure
      }
    }

    // Return the structured data as JSON string
    return JSON.stringify(recipeData, null, 2);

  } catch (error: any) {
    logger.error('Recipe conversion error:', { error });
    
    // Handle specific error types
    if (error.message?.includes('User must be authenticated')) {
      throw new Error('Please sign in to generate recipes.');
    } else if (error.message?.includes('quota')) {
      throw new Error('AI service quota exceeded. Please try again later.');
    } else if (error.message?.includes('fetch')) {
      throw new Error('Unable to connect to recipe service. Please check your internet connection.');
    }
    
    throw new Error(error?.message || 'Failed to generate recipe. Please try again.');
  }
};

// Initialize function - no longer needed with cloud functions but kept for compatibility
export const initializeModel = async (onProgress?: (progress: number, message: string) => void): Promise<void> => {
  // Simulate initialization for compatibility
  if (onProgress) {
    onProgress(100, 'AI service ready');
  }
};

// Check if model is ready - always true with cloud functions
export const isModelReady = (): boolean => {
  return true;
};

// Export types for compatibility
export type { RecipeResponse };