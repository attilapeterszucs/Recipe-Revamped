import React, { useState, useEffect } from 'react';
import { RecipeSchema } from '../lib/validation';
import { z } from 'zod';
import { Shuffle, Wand2 } from 'lucide-react';
import type { UserSettings } from '../types/userSettings';

interface RecipeInputProps {
  onSubmit: (recipe: string, filters: string[], mustUseIngredients?: string[], avoidIngredients?: string[]) => void;
  onSurpriseMe: (filters: string[], mustUseIngredients?: string[], avoidIngredients?: string[]) => void;
  disabled?: boolean;
  userSettings?: UserSettings;
  availableDietaryFilters?: string[];
  currentPlan?: string;
}

export const RecipeInput: React.FC<RecipeInputProps> = ({ onSubmit, onSurpriseMe, disabled, userSettings, availableDietaryFilters, currentPlan }) => {
  const [recipe, setRecipe] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [mustUseIngredients, setMustUseIngredients] = useState<string[]>([]);
  const [avoidIngredients, setAvoidIngredients] = useState<string[]>([]);
  const [mustUseInput, setMustUseInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');
  const [errors, setErrors] = useState<{ recipe?: string; filters?: string }>({});
  const [mode, setMode] = useState<'convert' | 'create'>('convert');

  // Use provided dietary filters or fall back to basic filters
  const allFilters = (import.meta.env.VITE_ALLOWED_FILTERS as string).split(',');
  const basicFilters = allFilters.slice(0, 4); // First 4 filters for fallback
  const availableFilters = availableDietaryFilters || basicFilters;

  // Initialize selected filters with user's default dietary filters (filtered by available filters)
  useEffect(() => {
    if (userSettings?.defaultDietaryFilters && userSettings.defaultDietaryFilters.length > 0) {
      const filteredDefaults = userSettings.defaultDietaryFilters.filter(filter => 
        availableFilters.includes(filter)
      );
      setSelectedFilters(filteredDefaults);
    }
  }, [userSettings?.defaultDietaryFilters, availableFilters]);

  const handleFilterToggle = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
    setErrors(prev => ({ ...prev, filters: '' }));
  };

  const addMustUseIngredient = () => {
    if (mustUseInput.trim() && !mustUseIngredients.includes(mustUseInput.trim())) {
      setMustUseIngredients(prev => [...prev, mustUseInput.trim()]);
      setMustUseInput('');
    }
  };

  const removeMustUseIngredient = (ingredient: string) => {
    setMustUseIngredients(prev => prev.filter(item => item !== ingredient));
  };

  const addAvoidIngredient = () => {
    if (avoidInput.trim() && !avoidIngredients.includes(avoidInput.trim())) {
      setAvoidIngredients(prev => [...prev, avoidInput.trim()]);
      setAvoidInput('');
    }
  };

  const removeAvoidIngredient = (ingredient: string) => {
    setAvoidIngredients(prev => prev.filter(item => item !== ingredient));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      if (mode === 'create' && recipe.trim().split(' ').length <= 3) {
        // For recipe creation mode, we allow short food names
        if (!recipe.trim()) {
          setErrors({ recipe: 'Please enter a food name or dish type' });
          return;
        }
        if (selectedFilters.length === 0) {
          setErrors({ filters: 'Please select at least one dietary filter' });
          return;
        }
        onSubmit(recipe, selectedFilters, mustUseIngredients, avoidIngredients);
      } else {
        // For convert mode, use full validation
        const validated = RecipeSchema.parse({
          originalRecipe: recipe,
          dietaryFilters: selectedFilters
        });
        onSubmit(validated.originalRecipe, validated.dietaryFilters, mustUseIngredients, avoidIngredients);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { recipe?: string; filters?: string } = {};
        error.issues.forEach(err => {
          if (err.path[0] === 'originalRecipe') {
            fieldErrors.recipe = err.message;
          } else if (err.path[0] === 'dietaryFilters') {
            fieldErrors.filters = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleSurpriseMe = () => {
    if (selectedFilters.length === 0) {
      setErrors({ filters: 'Please select at least one dietary filter for surprise recipe generation' });
      return;
    }
    setErrors({});
    onSurpriseMe(selectedFilters, mustUseIngredients, avoidIngredients);
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => {
            setMode('convert');
            setErrors({});
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'convert'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          disabled={disabled}
        >
          <Wand2 className="w-4 h-4 inline mr-2" />
          Convert Recipe
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('create');
            setRecipe('');
            setErrors({});
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'create'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          disabled={disabled}
        >
          <Shuffle className="w-4 h-4 inline mr-2" />
          Create Recipe
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="recipe" className="block text-sm font-medium text-gray-700 mb-2">
          {mode === 'convert' ? 'Paste Your Recipe' : 'Enter Food Name or Dish Type'}
        </label>
        {mode === 'convert' ? (
          <textarea
            id="recipe"
            value={recipe}
            onChange={(e) => {
              setRecipe(e.target.value);
              setErrors(prev => ({ ...prev, recipe: '' }));
            }}
            placeholder="Paste your recipe here..."
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={disabled}
          />
        ) : (
          <input
            type="text"
            id="recipe"
            value={recipe}
            onChange={(e) => {
              setRecipe(e.target.value);
              setErrors(prev => ({ ...prev, recipe: '' }));
            }}
            placeholder="e.g., Pasta Carbonara, Chicken Tacos, Chocolate Cake"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          />
        )}
        {errors.recipe && (
          <p className="mt-1 text-sm text-red-600">{errors.recipe}</p>
        )}
        {mode === 'convert' && (
          <p className="mt-1 text-xs text-gray-500">
            {recipe.length} / 20,000 characters
          </p>
        )}
        {mode === 'create' && (
          <p className="mt-1 text-xs text-gray-500">
            Enter a simple food name or dish type to generate a complete recipe
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Dietary Filters
          {userSettings?.defaultDietaryFilters && userSettings.defaultDietaryFilters.length > 0 && (
            <span className="text-xs text-blue-600 ml-2 font-normal">
              (Default preferences pre-selected)
            </span>
          )}
          {availableFilters.length < allFilters.length && (
            <span className="text-xs text-orange-600 ml-2 font-normal">
              ({allFilters.length - availableFilters.length} more filters require plan upgrade)
            </span>
          )}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableFilters.map(filter => (
            <button
              key={filter}
              type="button"
              onClick={() => handleFilterToggle(filter)}
              disabled={disabled}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedFilters.includes(filter)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {filter}
            </button>
          ))}
        </div>
        {errors.filters && (
          <p className="mt-2 text-sm text-red-600">{errors.filters}</p>
        )}
        
        {/* Show locked advanced filters for users with restricted access */}
        {availableFilters.length < allFilters.length && (
          <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-xl relative overflow-hidden">
            {/* Premium Badge */}
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
                ⭐ PREMIUM
              </span>
            </div>
            
            {/* Header */}
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                🚀 Advanced Dietary Filters
              </h3>
              <p className="text-sm text-gray-600">
                Unlock specialized dietary options and health condition support
              </p>
            </div>
            
            {/* Filters Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
              {allFilters.filter(filter => !availableFilters.includes(filter)).map(filter => (
                <div
                  key={filter}
                  className="relative px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-500 opacity-75 cursor-not-allowed shadow-sm hover:shadow-md transition-shadow"
                  title="Requires premium subscription"
                >
                  <div className="flex items-center justify-between">
                    <span>{filter}</span>
                    <span className="text-xs text-blue-500">🔒</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Custom Ingredient Preferences - Only show for Free plan users */}
            {availableFilters.length <= basicFilters.length && (
              <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <h4 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                  🥘 Custom Ingredient Preferences
                </h4>
                <p className="text-sm text-purple-600 mb-4">
                  Specify must-use and avoid ingredients for more precise recipe customization
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Must-Use Ingredients</label>
                    <input
                      type="text"
                      placeholder="e.g., chicken, tomatoes, basil"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm opacity-50 cursor-not-allowed bg-gray-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Avoid Ingredients</label>
                    <input
                      type="text"
                      placeholder="e.g., nuts, shellfish, dairy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm opacity-50 cursor-not-allowed bg-gray-50"
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div className="text-center mt-4">
              <button 
                type="button"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg font-semibold text-sm"
                onClick={() => {
                  // Try direct global function first
                  if ((window as any).showUpgradeModal) {
                    (window as any).showUpgradeModal();
                    return;
                  }
                  
                  // Fallback to clicking the upgrade button
                  const upgradeButton = document.querySelector('[data-upgrade-plan]') as HTMLButtonElement;
                  if (upgradeButton) {
                    upgradeButton.click();
                  }
                }}
              >
                <span className="mr-2">✨</span>
                Upgrade to Access All Features
                <span className="ml-2">→</span>
              </button>
              {currentPlan !== 'chef' && (
                <p className="text-xs text-gray-500 mt-2">
                  Starting at $14.99/month • Cancel anytime
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Custom Ingredient Preferences for Chef+ Users */}
        {availableFilters.length > basicFilters.length && (
          <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
              🥘 Custom Ingredient Preferences
            </h4>
            <p className="text-sm text-green-600 mb-4">
              Specify must-use and avoid ingredients for more precise recipe customization
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Must-Use Ingredients
                  {mustUseIngredients.length > 0 && (
                    <span className="text-green-600 text-xs ml-1">({mustUseIngredients.length})</span>
                  )}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={mustUseInput}
                    onChange={(e) => setMustUseInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMustUseIngredient();
                      }
                    }}
                    placeholder="e.g., chicken, tomatoes, basil"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    onClick={addMustUseIngredient}
                    disabled={disabled || !mustUseInput.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
                {mustUseIngredients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mustUseIngredients.map((ingredient, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {ingredient}
                        <button
                          type="button"
                          onClick={() => removeMustUseIngredient(ingredient)}
                          disabled={disabled}
                          className="ml-2 text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avoid Ingredients
                  {avoidIngredients.length > 0 && (
                    <span className="text-red-600 text-xs ml-1">({avoidIngredients.length})</span>
                  )}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={avoidInput}
                    onChange={(e) => setAvoidInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAvoidIngredient();
                      }
                    }}
                    placeholder="e.g., nuts, shellfish, dairy"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    onClick={addAvoidIngredient}
                    disabled={disabled || !avoidInput.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
                {avoidIngredients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {avoidIngredients.map((ingredient, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                      >
                        {ingredient}
                        <button
                          type="button"
                          onClick={() => removeAvoidIngredient(ingredient)}
                          disabled={disabled}
                          className="ml-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {(mustUseIngredients.length > 0 || avoidIngredients.length > 0) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Active Preferences:</strong>
                  {mustUseIngredients.length > 0 && (
                    <span className="ml-2">
                      Must include: {mustUseIngredients.join(', ')}
                    </span>
                  )}
                  {mustUseIngredients.length > 0 && avoidIngredients.length > 0 && <span className="mx-2">•</span>}
                  {avoidIngredients.length > 0 && (
                    <span>
                      Avoid: {avoidIngredients.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Default Serving Size and Units Display */}
      {userSettings && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-sm font-medium text-blue-800">Default Serving Size:</span>
                <span className="ml-2 text-sm text-blue-700">{userSettings.defaultServingSize} servings</span>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-800">Unit System:</span>
                <span className="ml-2 text-sm text-blue-700 capitalize">{userSettings.preferredUnits}</span>
              </div>
            </div>
            <div className="text-xs text-blue-600">
              From your preferences
            </div>
          </div>
        </div>
      )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={disabled}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mode === 'convert' ? 'Convert Recipe' : 'Create Recipe'}
          </button>
          
          <button
            type="button"
            onClick={handleSurpriseMe}
            disabled={disabled}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-md hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            title="Generate a random recipe with selected dietary preferences"
          >
            <Shuffle className="w-5 h-5 inline mr-2" />
            Surprise Me!
          </button>
        </div>
      </form>
    </div>
  );
};
