import React, { useState, useEffect } from 'react';
import { RecipeSchema } from '../lib/validation';
import { z } from 'zod';
import { Shuffle, Wand2, Search, ChevronLeft, ChevronRight, Filter, Trash2, Utensils, Crown, Check } from 'lucide-react';
import type { UserSettings } from '../types/userSettings';

interface RecipeInputProps {
  onSubmit: (recipe: string, filters: string[], mustUseIngredients?: string[], avoidIngredients?: string[]) => void;
  onSurpriseMe: (filters: string[], mustUseIngredients?: string[], avoidIngredients?: string[]) => void;
  disabled?: boolean;
  userSettings?: UserSettings;
  userSettingsLoading?: boolean;
  availableDietaryFilters?: string[];
  currentPlan?: string;
  dailyUsage?: {
    used: number;
    limit: number;
  };
  onShowUpgradeModal?: () => void;
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

export const RecipeInput: React.FC<RecipeInputProps> = ({ onSubmit, onSurpriseMe, disabled, userSettings, userSettingsLoading, availableDietaryFilters, currentPlan, dailyUsage, onShowUpgradeModal }) => {
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

  // State for locked filters pagination
  const [lockedCurrentPage, setLockedCurrentPage] = useState(0);
  const [showPremiumDetails, setShowPremiumDetails] = useState(false);
  const filtersPerPage = 8;

  // Use provided dietary filters or fall back to basic filters
  const allFilters = (import.meta.env.VITE_ALLOWED_FILTERS as string).split(',');
  const basicFilters = allFilters.slice(0, 4); // First 4 filters for fallback
  const availableFilters = availableDietaryFilters || basicFilters;

  // Initialize selected filters with user's default dietary filters (filtered by available filters)
  useEffect(() => {
    if (!userSettingsLoading && userSettings?.defaultDietaryFilters && userSettings.defaultDietaryFilters.length > 0) {
      const filteredDefaults = userSettings.defaultDietaryFilters.filter(filter =>
        availableFilters.includes(filter)
      );
      setSelectedFilters(filteredDefaults);
    }
  }, [userSettings?.defaultDietaryFilters, availableFilters, userSettingsLoading]);

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
      {/* Enhanced Mode Toggle with Gradient Indicator */}
      <div className="relative bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-1.5 shadow-inner">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('convert');
              setErrors({});
            }}
            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 transform ${
              mode === 'convert'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            disabled={disabled}
            aria-label="Convert existing recipe"
            aria-pressed={mode === 'convert'}
          >
            <Wand2 className={`w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2 ${mode === 'convert' ? 'animate-pulse' : ''}`} />
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
            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 transform ${
              mode === 'create'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            disabled={disabled}
            aria-label="Create new recipe from scratch"
            aria-pressed={mode === 'create'}
          >
            <Shuffle className={`w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2 ${mode === 'create' ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">Create Recipe</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Enhanced Usage Meter with Gradient Progress Bar */}
      {dailyUsage && (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Daily Conversions</h4>
            <span className="text-xs font-medium text-gray-600">
              {dailyUsage.used}/{dailyUsage.limit === -1 ? '∞' : dailyUsage.limit}
            </span>
          </div>

          {dailyUsage.limit !== -1 && (
            <>
              <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                {(() => {
                  const percentage = Math.min((dailyUsage.used / dailyUsage.limit) * 100, 100);
                  const getGradientColor = () => {
                    if (percentage < 60) return 'bg-gradient-to-r from-green-500 to-emerald-500';
                    if (percentage < 85) return 'bg-gradient-to-r from-yellow-500 to-amber-500';
                    return 'bg-gradient-to-r from-red-500 to-rose-500';
                  };

                  return (
                    <div
                      className={`h-full ${getGradientColor()} transition-all duration-500 ease-out rounded-full`}
                      style={{ width: `${percentage}%` }}
                      role="progressbar"
                      aria-valuenow={dailyUsage.used}
                      aria-valuemin={0}
                      aria-valuemax={dailyUsage.limit}
                      aria-label={`${dailyUsage.used} of ${dailyUsage.limit} daily conversions used`}
                    />
                  );
                })()}
              </div>

              {(() => {
                const percentage = (dailyUsage.used / dailyUsage.limit) * 100;
                if (percentage >= 90) {
                  return (
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      ⚠️ Almost at limit! Upgrade for unlimited conversions
                    </p>
                  );
                } else if (percentage >= 75) {
                  return (
                    <p className="text-xs text-amber-600 mt-2 font-medium">
                      ⚡ {dailyUsage.limit - dailyUsage.used} conversions remaining today
                    </p>
                  );
                }
                return null;
              })()}
            </>
          )}
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-1 sm:space-y-0">
          <label htmlFor="recipe" className="block text-xs sm:text-sm font-medium text-gray-700">
            {mode === 'convert' ? 'Paste Your Recipe' : 'Enter Food Name or Dish Type'}
          </label>
        </div>
        {mode === 'convert' ? (
          <textarea
            id="recipe"
            value={recipe}
            onChange={(e) => {
              setRecipe(e.target.value);
              setErrors(prev => ({ ...prev, recipe: '' }));
            }}
            placeholder="Paste your recipe here... Include ingredients, instructions, and any other details you have."
            className="w-full h-48 sm:h-64 px-3 sm:px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm shadow-sm transition-all duration-200"
            disabled={disabled}
            aria-label="Recipe input text area"
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
            className="w-full px-3 sm:px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm shadow-sm transition-all duration-200"
            disabled={disabled}
            aria-label="Food name or dish type input"
          />
        )}
        {errors.recipe && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.recipe}</p>
        )}
        {mode === 'convert' && (
          <div className="mt-2 flex items-center justify-between">
            <p className={`text-xs font-medium ${
              recipe.length > 18000 ? 'text-red-600' :
              recipe.length > 15000 ? 'text-amber-600' :
              'text-gray-500'
            }`}>
              {recipe.length.toLocaleString()} / 20,000 characters
            </p>
            {recipe.length > 0 && (
              <div className="h-1.5 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    recipe.length > 18000 ? 'bg-red-500' :
                    recipe.length > 15000 ? 'bg-amber-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((recipe.length / 20000) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        )}
        {mode === 'create' && (
          <p className="mt-1 text-xs text-gray-500">
            Enter a simple food name or dish type to generate a complete recipe
          </p>
        )}
      </div>

      {/* Active Filters Badge - Display at Top */}
      {selectedFilters.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-green-900 flex items-center">
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mr-2">
                {selectedFilters.length}
              </span>
              Active Dietary Filters
            </h4>
            {selectedFilters.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFilters([])}
                className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
                aria-label="Clear all filters"
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
                  className="inline-flex items-center bg-white border-2 border-green-300 rounded-full px-3 py-1.5 shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <span className="text-sm mr-1.5">{option?.icon || '🔹'}</span>
                  <span className="text-xs font-semibold text-gray-800">{filter}</span>
                  <button
                    type="button"
                    onClick={() => handleFilterToggle(filter)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={`Remove ${filter} filter`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

        {/* Search Bar */}
        <div className="mb-4">
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
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm shadow-sm"
              disabled={disabled}
              aria-label="Search dietary filters"
            />
          </div>
        </div>

        {/* Category Tabs - Horizontal Scrollable */}
        <div className="mb-4 -mx-2 px-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={disabled}
              aria-label="Show all categories"
              aria-pressed={selectedCategory === 'all'}
            >
              All Filters
            </button>
            {Object.entries(categoryLabels).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedCategory(key);
                  setCurrentPage(0);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === key
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={disabled}
                aria-label={`Filter by ${value.label}`}
                aria-pressed={selectedCategory === key}
              >
                {value.label}
              </button>
            ))}
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
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
                {visibleOptions.map(option => (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => handleFilterToggle(option.name)}
                    disabled={disabled}
                    className={`flex items-center justify-center px-2 sm:px-3 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all border-2 min-h-[44px] ${
                      selectedFilters.includes(option.name)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                        : `${option.color} border-transparent hover:shadow-md hover:transform hover:scale-102`
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-base sm:text-lg mr-1 sm:mr-2">{option.icon}</span>
                    <span className="text-center leading-tight text-xs sm:text-sm">{option.name}</span>
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

        {/* Action Buttons for Chef+ Users - Shown right after filters */}
        {availableFilters.length > basicFilters.length && (
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {/* Primary Action Button with Enhanced Styling */}
            <button
              type="submit"
              disabled={disabled}
              className="flex-1 relative overflow-hidden py-3.5 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base group"
              aria-label={mode === 'convert' ? 'Convert recipe with selected filters' : 'Create new recipe'}
            >
              <span className="relative z-10 flex items-center justify-center">
                {mode === 'convert' ? (
                  <>
                    <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-pulse" />
                    Convert Recipe
                    <span className="hidden lg:inline ml-2 text-xs opacity-75">(Enter ↵)</span>
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-pulse" />
                    Create Recipe
                    <span className="hidden lg:inline ml-2 text-xs opacity-75">(Enter ↵)</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700" />
            </button>

            {/* Secondary Action Button */}
            <button
              type="button"
              onClick={handleSurpriseMe}
              disabled={disabled}
              className="sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base group"
              title="Generate a random recipe with selected dietary preferences"
              aria-label="Generate surprise recipe"
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 group-hover:rotate-180 transition-transform duration-500" />
              <span className="hidden sm:inline">Surprise Me!</span>
              <span className="sm:hidden">Surprise!</span>
            </button>
          </div>
        )}

        {/* Custom Ingredient Preferences for Chef+ Users */}
        {availableFilters.length > basicFilters.length && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              🥘 Custom Ingredient Preferences
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Specify must-use and avoid ingredients for more precise recipe customization
            </p>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Must-Use Ingredients
                  {mustUseIngredients.length > 0 && (
                    <span className="text-blue-600 text-xs ml-1">({mustUseIngredients.length})</span>
                  )}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
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
                    placeholder="e.g., chicken, tomatoes"
                    className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    onClick={addMustUseIngredient}
                    disabled={disabled || !mustUseInput.trim()}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
                {mustUseIngredients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mustUseIngredients.map((ingredient, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {ingredient}
                        <button
                          type="button"
                          onClick={() => removeMustUseIngredient(ingredient)}
                          disabled={disabled}
                          className="ml-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Avoid Ingredients
                  {avoidIngredients.length > 0 && (
                    <span className="text-red-600 text-xs ml-1">({avoidIngredients.length})</span>
                  )}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
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
                    placeholder="e.g., nuts, shellfish"
                    className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    onClick={addAvoidIngredient}
                    disabled={disabled || !avoidInput.trim()}
                    className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
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

        {/* Action Buttons for Free Users - Shown in original position */}
        {availableFilters.length <= basicFilters.length && (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Primary Action Button with Enhanced Styling */}
            <button
              type="submit"
              disabled={disabled}
              className="flex-1 relative overflow-hidden py-3.5 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base group"
              aria-label={mode === 'convert' ? 'Convert recipe with selected filters' : 'Create new recipe'}
            >
              <span className="relative z-10 flex items-center justify-center">
                {mode === 'convert' ? (
                  <>
                    <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-pulse" />
                    Convert Recipe
                    <span className="hidden lg:inline ml-2 text-xs opacity-75">(Enter ↵)</span>
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-pulse" />
                    Create Recipe
                    <span className="hidden lg:inline ml-2 text-xs opacity-75">(Enter ↵)</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700" />
            </button>

            {/* Secondary Action Button */}
            <button
              type="button"
              onClick={handleSurpriseMe}
              disabled={disabled}
              className="sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base group"
              title="Generate a random recipe with selected dietary preferences"
              aria-label="Generate surprise recipe"
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 group-hover:rotate-180 transition-transform duration-500" />
              <span className="hidden sm:inline">Surprise Me!</span>
              <span className="sm:hidden">Surprise!</span>
            </button>
          </div>
        )}
      </form>

      {/* Enhanced Default Serving Size and Units Display - Moved After Action Buttons */}
      {userSettingsLoading ? (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-200 rounded-lg animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-green-200 rounded animate-pulse w-32 mb-2"></div>
              <div className="h-3 bg-green-200 rounded animate-pulse w-40"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/60 rounded-lg p-3">
              <div className="h-3 bg-green-200 rounded animate-pulse w-20 mb-2"></div>
              <div className="h-4 bg-green-200 rounded animate-pulse w-16"></div>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <div className="h-3 bg-green-200 rounded animate-pulse w-20 mb-2"></div>
              <div className="h-4 bg-green-200 rounded animate-pulse w-16"></div>
            </div>
          </div>
        </div>
      ) : userSettings && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-green-500 rounded-lg p-2">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Recipe Preferences</h4>
                <p className="text-xs text-green-600 font-medium">From your settings</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-green-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">👥</span>
                <span className="text-xs font-semibold text-gray-600">Serving Size</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{userSettings.defaultServingSize}</p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-green-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📏</span>
                <span className="text-xs font-semibold text-gray-600">Unit System</span>
              </div>
              <p className="text-lg font-bold text-gray-900 capitalize">{userSettings.preferredUnits}</p>
            </div>
          </div>
        </div>
      )}

      {/* Premium Features Section with Enhanced Design */}
      {availableFilters.length < allFilters.length && (
        <div className="mt-4 sm:mt-6 relative bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-300 rounded-2xl p-6 sm:p-8 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
          {/* Decorative background pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(249, 115, 22, 0.3) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}></div>
          </div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
            {/* Premium Badge Icon */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-lg ring-4 ring-orange-200 group-hover:ring-orange-300 transition-all duration-300">
                  <Filter className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
                </div>
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl p-2 shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform duration-300">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg sm:text-xl font-black text-gray-900">Unlock Premium Filters</h3>
                <span className="inline-flex items-center px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                  PREMIUM
                </span>
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-semibold mb-4">
                Get access to {allFilters.length - availableFilters.length} more dietary filters + custom ingredient preferences
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="inline-flex items-center px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 border border-orange-200">
                  <Check className="w-3 h-3 mr-1.5 text-orange-600" />
                  22+ Premium Filters
                </div>
                <div className="inline-flex items-center px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 border border-orange-200">
                  <Check className="w-3 h-3 mr-1.5 text-orange-600" />
                  Custom Ingredients
                </div>
                <div className="inline-flex items-center px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 border border-orange-200">
                  <Check className="w-3 h-3 mr-1.5 text-orange-600" />
                  Advanced Preferences
                </div>
              </div>

              {/* Toggle Details Button */}
              <button
                type="button"
                onClick={() => setShowPremiumDetails(!showPremiumDetails)}
                className="text-sm font-bold text-orange-600 hover:text-orange-700 underline"
                aria-label={showPremiumDetails ? "Hide premium details" : "Show premium details"}
              >
                {showPremiumDetails ? '▲ Hide All Filters' : '▼ View All Premium Filters'}
              </button>
            </div>
          </div>

          {/* Preview: Show 4-6 locked filters */}
          {!showPremiumDetails && (() => {
            const lockedFilters = dietaryOptions.filter(option => !availableFilters.includes(option.name));
            const previewFilters = lockedFilters.slice(0, 6);

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {previewFilters.map(option => (
                  <div
                    key={option.name}
                    className={`relative flex items-center justify-center px-2 py-2 rounded-lg text-xs font-medium border opacity-50 cursor-not-allowed ${option.color} border-transparent`}
                    title="Requires premium subscription"
                  >
                    <span className="text-sm mr-1">{option.icon}</span>
                    <span className="text-xs truncate">{option.name}</span>
                    <span className="text-xs ml-1">🔒</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Expandable Details */}
          {showPremiumDetails && (() => {
            const lockedFilters = dietaryOptions.filter(option => !availableFilters.includes(option.name));
            const lockedFiltersPerPage = 8;
            const lockedTotalPages = Math.ceil(lockedFilters.length / lockedFiltersPerPage);
            const lockedStartIndex = lockedCurrentPage * lockedFiltersPerPage;
            const visibleLockedFilters = lockedFilters.slice(lockedStartIndex, lockedStartIndex + lockedFiltersPerPage);

            return (
              <div>
                {/* Locked Filters Grid - Matching regular design */}
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  {visibleLockedFilters.map(option => (
                    <div
                      key={option.name}
                      className={`relative flex items-center justify-center px-2 sm:px-3 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium border-2 opacity-60 cursor-not-allowed min-h-[44px] ${option.color} border-transparent`}
                      title="Requires premium subscription"
                    >
                      <span className="text-base sm:text-lg mr-1 sm:mr-2">{option.icon}</span>
                      <span className="text-center leading-tight text-xs sm:text-sm">{option.name}</span>
                      <div className="absolute top-1 right-1">
                        <span className="text-xs">🔒</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls for Locked Filters */}
                {lockedTotalPages > 1 && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      Showing {lockedStartIndex + 1}-{Math.min(lockedStartIndex + lockedFiltersPerPage, lockedFilters.length)} of {lockedFilters.length} premium filters
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setLockedCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={lockedCurrentPage === 0}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600 px-2">
                        Page {lockedCurrentPage + 1} of {lockedTotalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setLockedCurrentPage(prev => Math.min(lockedTotalPages - 1, prev + 1))}
                        disabled={lockedCurrentPage === lockedTotalPages - 1}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* Custom Ingredient Preferences - Only show for Free plan users */}
          {availableFilters.length <= allFilters.slice(0, 4).length && (
            <div className="mt-4">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center">
                🥘 Custom Ingredient Preferences
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Specify must-use and avoid ingredients for more precise recipe customization
              </p>

              <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="relative">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Must-Use Ingredients</label>
                  <input
                    type="text"
                    placeholder="e.g., chicken, tomatoes, basil"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm opacity-50 cursor-not-allowed bg-gray-50"
                    disabled
                  />
                  <div className="absolute top-1 right-1">
                    <span className="text-xs">🔒</span>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Avoid Ingredients</label>
                  <input
                    type="text"
                    placeholder="e.g., nuts, shellfish, dairy"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm opacity-50 cursor-not-allowed bg-gray-50"
                    disabled
                  />
                  <div className="absolute top-1 right-1">
                    <span className="text-xs">🔒</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced CTA Button */}
          <div className="relative">
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transform hover:scale-105 text-sm sm:text-base group relative overflow-hidden"
              onClick={() => onShowUpgradeModal && onShowUpgradeModal()}
              aria-label="Upgrade to access all premium filters"
            >
              <Crown className="w-5 h-5 group-hover:animate-pulse" />
              <span>Upgrade to Unlock All Filters</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700" />
            </button>

            {currentPlan !== 'chef' && (
              <p className="text-xs text-gray-700 mt-3 text-center font-semibold">
                ⚡ Starting at $14.99/month • Cancel anytime
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
