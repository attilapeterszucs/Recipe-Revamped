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
  profileMatchExplanation?: string;
  imageUrl?: string;
  // Enhanced profile-based fields from the improved AI service
  healthGoalsAlignment?: {
    matchingGoals: string[];
    nutritionalTargets: string;
    progressSupport: string;
  };
  personalizedFeatures?: {
    skillLevelAdaptation: string;
    timeOptimization: string;
    budgetConsiderations: string;
  };
  healthInsights?: {
    bmiConsiderations: string;
    medicalConditionSupport: string[];
    allergyAlternatives: string[];
  };
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

        {/* Profile Match Explanation */}
        {recipeData.profileMatchExplanation && (
          <div className="bg-blue-50 border border-blue-200 p-4 sm:p-5 rounded-lg mb-4 sm:mb-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Why This Recipe Fits Your Profile
            </h3>
            <p className="text-blue-800 text-sm sm:text-base leading-relaxed">
              {recipeData.profileMatchExplanation}
            </p>
          </div>
        )}

        {/* Health Goals Alignment */}
        {recipeData.healthGoalsAlignment && (
          <div className="bg-green-50 border border-green-200 p-4 sm:p-5 rounded-lg mb-4 sm:mb-6">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Health Goals Alignment
            </h3>
            <div className="space-y-3">
              {recipeData.healthGoalsAlignment.matchingGoals.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-800 text-sm mb-2">Supporting Your Goals:</h4>
                  <ul className="space-y-1">
                    {recipeData.healthGoalsAlignment.matchingGoals.map((goal, index) => (
                      <li key={index} className="flex items-start text-sm text-green-700">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {recipeData.healthGoalsAlignment.nutritionalTargets && (
                <div>
                  <h4 className="font-medium text-green-800 text-sm mb-1">Nutritional Targets:</h4>
                  <p className="text-sm text-green-700">{recipeData.healthGoalsAlignment.nutritionalTargets}</p>
                </div>
              )}
              {recipeData.healthGoalsAlignment.progressSupport && (
                <div>
                  <h4 className="font-medium text-green-800 text-sm mb-1">Progress Support:</h4>
                  <p className="text-sm text-green-700">{recipeData.healthGoalsAlignment.progressSupport}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personalized Features */}
        {recipeData.personalizedFeatures && (
          <div className="bg-purple-50 border border-purple-200 p-4 sm:p-5 rounded-lg mb-4 sm:mb-6">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Personalized For You
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recipeData.personalizedFeatures.skillLevelAdaptation && (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <h4 className="font-medium text-purple-800 text-sm mb-1 flex items-center">
                    <ChefHat className="w-3 h-3 mr-1" />
                    Skill Level
                  </h4>
                  <p className="text-xs text-purple-700">{recipeData.personalizedFeatures.skillLevelAdaptation}</p>
                </div>
              )}
              {recipeData.personalizedFeatures.timeOptimization && (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <h4 className="font-medium text-purple-800 text-sm mb-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Time Optimization
                  </h4>
                  <p className="text-xs text-purple-700">{recipeData.personalizedFeatures.timeOptimization}</p>
                </div>
              )}
              {recipeData.personalizedFeatures.budgetConsiderations && (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <h4 className="font-medium text-purple-800 text-sm mb-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Budget
                  </h4>
                  <p className="text-xs text-purple-700">{recipeData.personalizedFeatures.budgetConsiderations}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Health Insights */}
        {recipeData.healthInsights && (
          <div className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-lg mb-4 sm:mb-6">
            <h3 className="font-semibold text-amber-900 mb-3 flex items-center text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Health Insights
            </h3>
            <div className="space-y-3">
              {recipeData.healthInsights.bmiConsiderations && (
                <div>
                  <h4 className="font-medium text-amber-800 text-sm mb-1">BMI Considerations:</h4>
                  <p className="text-sm text-amber-700">{recipeData.healthInsights.bmiConsiderations}</p>
                </div>
              )}
              {recipeData.healthInsights.medicalConditionSupport.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-800 text-sm mb-2">Medical Condition Support:</h4>
                  <ul className="space-y-1">
                    {recipeData.healthInsights.medicalConditionSupport.map((support, index) => (
                      <li key={index} className="flex items-start text-sm text-amber-700">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                        {support}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {recipeData.healthInsights.allergyAlternatives.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-800 text-sm mb-2">Allergy-Safe Alternatives:</h4>
                  <ul className="space-y-1">
                    {recipeData.healthInsights.allergyAlternatives.map((alternative, index) => (
                      <li key={index} className="flex items-start text-sm text-amber-700">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                        {alternative}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

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