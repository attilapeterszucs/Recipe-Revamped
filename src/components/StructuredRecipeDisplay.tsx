import React from 'react';
import { Clock, Users, Heart, ChefHat, Lightbulb, Save } from 'lucide-react';

interface RecipeData {
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
  imageUrl?: string;
}

interface StructuredRecipeDisplayProps {
  recipeJson: string;
  loading?: boolean;
  saving?: boolean;
  recipeSaved?: boolean;
  onSave?: () => void;
  canSave?: boolean;
  hideHeader?: boolean;
}

export const StructuredRecipeDisplay: React.FC<StructuredRecipeDisplayProps> = ({ 
  recipeJson, 
  loading, 
  saving, 
  recipeSaved, 
  onSave, 
  canSave,
  hideHeader
}) => {
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse delay-75"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
        <p className="text-center text-gray-600 mt-4 text-sm sm:text-base">Creating your recipe...</p>
      </div>
    );
  }

  if (!recipeJson || recipeJson.trim() === '') {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 sm:p-12">
        <div className="text-center">
          <svg 
            className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">
            Your recipe will appear here
          </p>
        </div>
      </div>
    );
  }

  let recipeData: RecipeData;
  try {
    recipeData = JSON.parse(recipeJson);
  } catch (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <p className="text-red-600">Error parsing recipe data. Please try again.</p>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-red-800">Debug Info</summary>
          <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify({ error: error?.toString(), recipeJson }, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Recipe Header with Image and Save Button - Only show if not hidden */}
      {!hideHeader && (
        <div className="relative h-32 sm:h-40 lg:h-48 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            {recipeData.imageUrl ? (
              <img 
                src={recipeData.imageUrl} 
                alt={recipeData.recipeName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-400 via-blue-500 to-purple-600"></div>
            )}
          </div>
          
          {/* Light blur overlay */}
          <div className="absolute inset-0 bg-black/15 backdrop-blur-[1px]"></div>
          
          {/* Save button */}
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving || !canSave}
              className={`absolute top-2 right-2 sm:top-3 sm:right-3 backdrop-blur-sm text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed z-10 flex items-center space-x-1 sm:space-x-2 ${
                saving 
                  ? 'bg-blue-500/30 animate-pulse' 
                  : recipeSaved 
                  ? 'bg-green-500/30' 
                  : 'bg-white/20 hover:bg-white/30'
              } ${saving ? 'opacity-90' : 'disabled:opacity-50'}`}
              title={saving ? "Saving recipe..." : recipeSaved ? "Recipe saved!" : "Save recipe"}
            >
              {saving ? (
                <>
                  <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className={`h-3 w-3 sm:h-4 sm:w-4 transition-colors ${recipeSaved ? 'text-green-400' : 'text-white'}`} />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                    {recipeSaved ? 'Saved!' : 'Save Recipe'}
                  </span>
                </>
              )}
            </button>
          )}
          
          {/* Recipe title */}
          <div className="absolute bottom-2 left-3 right-3 sm:bottom-3 sm:left-4 sm:right-4">
            <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-white drop-shadow-lg">
              {recipeData.recipeName}
            </h2>
          </div>
        </div>
      )}
      
      <div className="p-4 sm:p-6">
        {/* Time & Dietary Info */}
        <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 ${recipeData.healthConditions && recipeData.healthConditions.length > 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 sm:gap-4 mb-4 sm:mb-6`}>
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
            <div className="font-semibold text-blue-700 text-xs sm:text-sm">Prep Time</div>
            <div className="text-lg sm:text-2xl font-bold text-blue-800">{recipeData.prepTime}</div>
          </div>
          <div className="bg-orange-50 p-3 sm:p-4 rounded-lg text-center">
            <div className="font-semibold text-orange-700 text-xs sm:text-sm">Cook Time</div>
            <div className="text-lg sm:text-2xl font-bold text-orange-800">{recipeData.cookTime}</div>
          </div>
          <div className="bg-purple-50 p-3 sm:p-4 rounded-lg text-center col-span-2 sm:col-span-1">
            <div className="font-semibold text-purple-700 text-xs sm:text-sm">Dietary</div>
            <div className="text-xs sm:text-sm font-medium text-purple-800">{recipeData.dietaryRequirements}</div>
          </div>
          {recipeData.healthConditions && recipeData.healthConditions.length > 0 && (
            <div className="bg-pink-50 p-3 sm:p-4 rounded-lg text-center col-span-2 sm:col-span-1">
              <div className="font-semibold text-pink-700 text-xs sm:text-sm">Health Conditions</div>
              <div className="text-xs sm:text-sm font-medium text-pink-800">
                {recipeData.healthConditions.join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Nutrition Facts */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center text-sm sm:text-base">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500" />
            Nutrition (per serving)
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg text-gray-900">{recipeData.nutrition.calories}</div>
              <div className="text-xs text-gray-600">Calories</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg text-gray-900">{recipeData.nutrition.protein}g</div>
              <div className="text-xs text-gray-600">Protein</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg text-gray-900">{recipeData.nutrition.carbohydrates}g</div>
              <div className="text-xs text-gray-600">Carbs</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg text-gray-900">{recipeData.nutrition.fat}g</div>
              <div className="text-xs text-gray-600">Fat</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg text-gray-900">{recipeData.nutrition.fiber}g</div>
              <div className="text-xs text-gray-600">Fiber</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg text-gray-900">{recipeData.nutrition.sodium}mg</div>
              <div className="text-xs text-gray-600">Sodium</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Ingredients */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-600" />
              Ingredients ({recipeData.servings} serving{recipeData.servings !== 1 ? 's' : ''})
            </h3>
            <div className="bg-green-50 rounded-lg p-3 sm:p-4">
              <ul className="space-y-2">
                {recipeData.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-800 text-sm sm:text-base">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Instructions
            </h3>
            <div className="space-y-3">
              {recipeData.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-gray-800 pt-0.5 sm:pt-1 text-sm sm:text-base">{instruction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tips */}
        {recipeData.tips && recipeData.tips.length > 0 && (
          <div className="mt-4 sm:mt-6 bg-yellow-50 rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-bold text-yellow-800 mb-3 flex items-center">
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Chef's Tips
            </h3>
            <ul className="space-y-2">
              {recipeData.tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-yellow-900 text-sm sm:text-base">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};