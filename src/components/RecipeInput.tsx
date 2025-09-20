import React, { useState, useEffect } from 'react';
import { RecipeSchema } from '../lib/validation';
import { z } from 'zod';
import { Shuffle, Wand2, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import type { UserSettings } from '../types/userSettings';

interface RecipeInputProps {
  onSubmit: (recipe: string, filters: string[], mustUseIngredients?: string[], avoidIngredients?: string[]) => void;
  onSurpriseMe: (filters: string[], mustUseIngredients?: string[], avoidIngredients?: string[]) => void;
  disabled?: boolean;
  userSettings?: UserSettings;
  availableDietaryFilters?: string[];
  currentPlan?: string;
  dailyUsage?: {
    used: number;
    limit: number;
  };
}

// Dietary options data with categories
const dietaryOptions = [
  { name: 'Vegetarian', icon: '🥬', category: 'plant-based', color: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { name: 'Vegan', icon: '🌱', category: 'plant-based', color: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { name: 'Plant-Based', icon: '🌿', category: 'plant-based', color: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { name: 'Pescatarian', icon: '🐟', category: 'plant-based', color: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { name: 'Gluten-Free', icon: '🌾', category: 'allergen-free', color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  { name: 'Dairy-Free', icon: '🥛', category: 'allergen-free', color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  { name: 'Nut-Free', icon: '🥜', category: 'allergen-free', color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  { name: 'Sugar-Free', icon: '🍯', category: 'allergen-free', color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  { name: 'Keto', icon: '🥑', category: 'low-carb', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { name: 'Low-Carb', icon: '🥩', category: 'low-carb', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { name: 'Paleo', icon: '🍖', category: 'whole-foods', color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { name: 'Whole30', icon: '🥕', category: 'whole-foods', color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { name: 'Raw-Food', icon: '🥒', category: 'whole-foods', color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { name: 'High-Protein', icon: '💪', category: 'fitness', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { name: 'Low-Sodium', icon: '🧂', category: 'fitness', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { name: 'Intermittent-Fasting', icon: '⏰', category: 'fitness', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { name: 'Macro-Friendly', icon: '📊', category: 'fitness', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { name: 'Carnivore', icon: '🥩', category: 'fitness', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { name: 'Mediterranean', icon: '🫒', category: 'regional', color: 'bg-teal-50 border-teal-200 hover:bg-teal-100' },
  { name: 'Diabetic-Friendly', icon: '🩺', category: 'health', color: 'bg-pink-50 border-pink-200 hover:bg-pink-100' },
  { name: 'Heart-Healthy', icon: '❤️', category: 'health', color: 'bg-pink-50 border-pink-200 hover:bg-pink-100' },
  { name: 'Anti-Inflammatory', icon: '🫐', category: 'health', color: 'bg-pink-50 border-pink-200 hover:bg-pink-100' },
  { name: 'FODMAP-Friendly', icon: '🌸', category: 'health', color: 'bg-pink-50 border-pink-200 hover:bg-pink-100' },
  { name: 'Alkaline', icon: '🥝', category: 'health', color: 'bg-pink-50 border-pink-200 hover:bg-pink-100' },
  { name: 'Halal', icon: '☪️', category: 'religious', color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100' },
  { name: 'Kosher', icon: '✡️', category: 'religious', color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100' }
];

const categoryLabels = {
  'plant-based': { label: '🌱 Plant-Based', color: 'text-green-700' },
  'allergen-free': { label: '🛡️ Allergen-Free', color: 'text-yellow-700' },
  'low-carb': { label: '🥑 Low-Carb', color: 'text-purple-700' },
  'whole-foods': { label: '🥕 Whole Foods', color: 'text-orange-700' },
  'fitness': { label: '💪 Fitness', color: 'text-blue-700' },
  'regional': { label: '🌍 Regional', color: 'text-teal-700' },
  'health': { label: '🩺 Health', color: 'text-pink-700' },
  'religious': { label: '🙏 Religious', color: 'text-indigo-700' }
};

export const RecipeInput: React.FC<RecipeInputProps> = ({ onSubmit, onSurpriseMe, disabled, userSettings, availableDietaryFilters, currentPlan, dailyUsage }) => {
  const [recipe, setRecipe] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [mustUseIngredients, setMustUseIngredients] = useState<string[]>([]);
  const [avoidIngredients, setAvoidIngredients] = useState<string[]>([]);
  const [mustUseInput, setMustUseInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');
  const [errors, setErrors] = useState<{ recipe?: string; filters?: string }>({});
  const [mode, setMode] = useState<'convert' | 'create'>('convert');

  // New state for enhanced filters
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const filtersPerPage = 8;

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
    if (mustUseInput.trim()) {
      // Split by comma and process each ingredient
      const ingredients = mustUseInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0 && !mustUseIngredients.includes(item));

      if (ingredients.length > 0) {
        setMustUseIngredients(prev => [...prev, ...ingredients]);
        setMustUseInput('');
      }
    }
  };

  const removeMustUseIngredient = (ingredient: string) => {
    setMustUseIngredients(prev => prev.filter(item => item !== ingredient));
  };

  const addAvoidIngredient = () => {
    if (avoidInput.trim()) {
      // Split by comma and process each ingredient
      const ingredients = avoidInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0 && !avoidIngredients.includes(item));

      if (ingredients.length > 0) {
        setAvoidIngredients(prev => [...prev, ...ingredients]);
        setAvoidInput('');
      }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Mode Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => {
            setMode('convert');
            setErrors({});
          }}
          className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            mode === 'convert'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          disabled={disabled}
        >
          <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Convert Recipe</span>
          <span className="sm:hidden">Convert</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('create');
            setRecipe('');
            setErrors({});
          }}
          className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            mode === 'create'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          disabled={disabled}
        >
          <Shuffle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Create Recipe</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-1 sm:space-y-0">
          <label htmlFor="recipe" className="block text-xs sm:text-sm font-medium text-gray-700">
            {mode === 'convert' ? 'Paste Your Recipe' : 'Enter Food Name or Dish Type'}
          </label>
          {dailyUsage && (
            <div className="text-xs sm:text-sm text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded-full">
              {dailyUsage.used}/{dailyUsage.limit === -1 ? '∞' : dailyUsage.limit} today
            </div>
          )}
        </div>
        {mode === 'convert' ? (
          <textarea
            id="recipe"
            value={recipe}
            onChange={(e) => {
              setRecipe(e.target.value);
              setErrors(prev => ({ ...prev, recipe: '' }));
            }}
            placeholder="Paste your recipe here..."
            className="w-full h-48 sm:h-64 px-2.5 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
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
            className="w-full px-2.5 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={disabled}
          />
        )}
        {errors.recipe && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.recipe}</p>
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
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
          Select Dietary Filters
          {userSettings?.defaultDietaryFilters && userSettings.defaultDietaryFilters.length > 0 && (
            <span className="text-xs text-blue-600 ml-2 font-normal block sm:inline mt-1 sm:mt-0">
              (Default preferences pre-selected)
            </span>
          )}
          {availableFilters.length < allFilters.length && (
            <span className="text-xs text-orange-600 ml-2 font-normal block sm:inline mt-1 sm:mt-0">
              ({allFilters.length - availableFilters.length} more filters require plan upgrade)
            </span>
          )}
        </label>
        {/* Enhanced Filter System with Search, Categories, and Pagination */}

        {/* Search Bar and Category Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search Bar (2/3 of row) */}
          <div className="flex-1 sm:w-2/3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search dietary filters..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0); // Reset to first page when searching
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Category Filter (1/3 of row) */}
          <div className="sm:w-1/3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(0); // Reset to first page when changing category
                }}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white appearance-none"
                disabled={disabled}
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryLabels).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filtered and Paginated Filters Grid */}
        {(() => {
          // Get available dietary options that match current filters
          const matchingOptions = dietaryOptions.filter(option =>
            availableFilters.includes(option.name) &&
            (selectedCategory === 'all' || option.category === selectedCategory) &&
            (searchTerm === '' || option.name.toLowerCase().includes(searchTerm.toLowerCase()))
          );

          // Calculate pagination
          const totalPages = Math.ceil(matchingOptions.length / filtersPerPage);
          const startIndex = currentPage * filtersPerPage;
          const visibleOptions = matchingOptions.slice(startIndex, startIndex + filtersPerPage);

          return (
            <div>
              {/* Filters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {visibleOptions.map(option => (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => handleFilterToggle(option.name)}
                    disabled={disabled}
                    className={`flex items-center justify-center px-3 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                      selectedFilters.includes(option.name)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                        : `${option.color} border-transparent hover:shadow-md hover:transform hover:scale-102`
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-lg mr-2">{option.icon}</span>
                    <span className="text-center leading-tight">{option.name}</span>
                  </button>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(startIndex + filtersPerPage, matchingOptions.length)} of {matchingOptions.length} filters
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={disabled || currentPage === 0}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600 px-2">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={disabled || currentPage === totalPages - 1}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* No Results Message */}
              {matchingOptions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No filters found matching your search.</p>
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                        setCurrentPage(0);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm mt-2 underline"
                    >
                      Clear search and show all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}
        {errors.filters && (
          <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.filters}</p>
        )}

        {/* Selected Filters Display */}
        {selectedFilters.length > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-blue-900 flex items-center">
                <span className="text-base mr-2">✅</span>
                Selected Dietary Filters ({selectedFilters.length})
              </h4>
              {selectedFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFilters([])}
                  className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedFilters.map(filter => {
                const option = dietaryOptions.find(opt => opt.name === filter);
                return (
                  <div
                    key={filter}
                    className="flex items-center bg-white border border-blue-200 rounded-full px-3 py-1.5 shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <span className="text-sm mr-1.5">{option?.icon || '🔹'}</span>
                    <span className="text-xs font-medium text-gray-800">{filter}</span>
                    <button
                      type="button"
                      onClick={() => handleFilterToggle(filter)}
                      className="ml-2 text-gray-400 hover:text-red-500 transition-colors group-hover:text-gray-600"
                      title={`Remove ${filter}`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-blue-600">
              💡 These filters will be applied to your recipe conversion
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
                    placeholder="e.g., chicken, tomatoes, basil (separate with commas)"
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
                    placeholder="e.g., nuts, shellfish, dairy (separate with commas)"
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

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="submit"
            disabled={disabled}
            className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            {mode === 'convert' ? 'Convert Recipe' : 'Create Recipe'}
          </button>
          
          <button
            type="button"
            onClick={handleSurpriseMe}
            disabled={disabled}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-md hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 text-sm sm:text-base"
            title="Generate a random recipe with selected dietary preferences"
          >
            <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Surprise Me!</span>
            <span className="sm:hidden">Surprise!</span>
          </button>
        </div>
      </form>
      
      {/* Premium Features Section - Moved after action buttons */}
      {availableFilters.length < allFilters.length && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-xl relative overflow-hidden">
          {/* Premium Badge */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
              ⭐ PREMIUM
            </span>
          </div>
          
          {/* Header */}
          <div className="mb-3 pr-16 sm:pr-20">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
              🚀 Advanced Dietary Filters
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Unlock specialized dietary options and health condition support
            </p>
          </div>
          
          {/* Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {allFilters.filter(filter => !availableFilters.includes(filter)).map(filter => (
              <div
                key={filter}
                className="relative px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-500 opacity-75 cursor-not-allowed shadow-sm hover:shadow-md transition-shadow"
                title="Requires premium subscription"
              >
                <div className="flex items-center justify-between">
                  <span className="truncate pr-1">{filter}</span>
                  <span className="text-xs text-blue-500 flex-shrink-0">🔒</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Custom Ingredient Preferences - Only show for Free plan users */}
          {availableFilters.length <= allFilters.slice(0, 4).length && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <h4 className="text-base sm:text-lg font-semibold text-purple-800 mb-2 sm:mb-3 flex items-center">
                🥘 Custom Ingredient Preferences
              </h4>
              <p className="text-xs sm:text-sm text-purple-600 mb-3 sm:mb-4">
                Specify must-use and avoid ingredients for more precise recipe customization
              </p>
              
              <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Must-Use Ingredients</label>
                  <input
                    type="text"
                    placeholder="e.g., chicken, tomatoes, basil"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm opacity-50 cursor-not-allowed bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Avoid Ingredients</label>
                  <input
                    type="text"
                    placeholder="e.g., nuts, shellfish, dairy"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm opacity-50 cursor-not-allowed bg-gray-50"
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <div className="text-center mt-3 sm:mt-4">
            <button 
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg font-semibold text-xs sm:text-sm"
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
              <span className="mr-1 sm:mr-2">✨</span>
              <span className="hidden sm:inline">Upgrade to Access All Features</span>
              <span className="sm:hidden">Upgrade for More Features</span>
              <span className="ml-1 sm:ml-2">→</span>
            </button>
            {currentPlan !== 'chef' && (
              <p className="text-xs text-gray-500 mt-2">
                Starting at $14.99/month • Cancel anytime
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
