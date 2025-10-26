import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getUserRecipes, deleteRecipe } from '../lib/firestore';
import type { SavedRecipe } from '../lib/validation';
import type { UserSettings } from '../types/userSettings';
import { useToast } from './ToastContainer';
import { Search, Trash2, Filter, ChefHat, RefreshCcw, ArrowUpDown, Grid3x3, List, X, Heart, Crown } from 'lucide-react';
import { RecipeEditor } from './RecipeEditor';
import { CustomDropdown } from './CustomDropdown';
import { RecipeCard } from './RecipeCard';

interface SavedRecipesProps {
  userId: string;
  onSelect?: (recipe: SavedRecipe) => void;
  onViewRecipe?: (recipe: SavedRecipe) => void;
  onRecipeCountChange?: (count: number) => void;
  userSettings?: UserSettings;
  featureAccess?: {
    recipeLimit: number;
    currentRecipeCount: number;
    currentPlan: string;
    canSaveRecipes: boolean;
    canUseAdvancedFilters: boolean;
    canUseHealthConditions: boolean;
  };
}

// extractRecipeInfo has been moved to RecipeCard component

// SessionStorage keys for persisting state
const STORAGE_KEY_PREFIX = 'recipeBook_';
const STORAGE_KEYS = {
  searchTerm: `${STORAGE_KEY_PREFIX}searchTerm`,
  selectedFilter: `${STORAGE_KEY_PREFIX}selectedFilter`,
  selectedHealthCondition: `${STORAGE_KEY_PREFIX}selectedHealthCondition`,
  sortBy: `${STORAGE_KEY_PREFIX}sortBy`,
  sortOrder: `${STORAGE_KEY_PREFIX}sortOrder`,
  selectedCategory: `${STORAGE_KEY_PREFIX}selectedCategory`,
  viewMode: `${STORAGE_KEY_PREFIX}viewMode`,
};

// Helper functions for sessionStorage
const loadFromSession = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToSession = <T,>(key: string, value: T): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if sessionStorage is not available
  }
};

export const SavedRecipes: React.FC<SavedRecipesProps> = ({ userId, onSelect, onViewRecipe, onRecipeCountChange, userSettings, featureAccess }) => {
  const location = useLocation();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(() => loadFromSession(STORAGE_KEYS.searchTerm, ''));
  const [selectedFilter, setSelectedFilter] = useState<string>(() => loadFromSession(STORAGE_KEYS.selectedFilter, ''));
  const [selectedHealthCondition, setSelectedHealthCondition] = useState<string>(() => loadFromSession(STORAGE_KEYS.selectedHealthCondition, ''));
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'rating'>(() => loadFromSession(STORAGE_KEYS.sortBy, 'date'));
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => loadFromSession(STORAGE_KEYS.sortOrder, 'desc'));
  const [selectedCategory, setSelectedCategory] = useState<string>(() => loadFromSession(STORAGE_KEYS.selectedCategory, ''));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<SavedRecipe | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => loadFromSession(STORAGE_KEYS.viewMode, 'grid'));
  const recipesPerPage = 8;
  const { showSuccess, showError } = useToast();

  const loadRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const userRecipes = await getUserRecipes(userId);

      // Apply default sorting (newest first) before setting recipes
      const sortedRecipes = [...userRecipes].sort((a, b) => {
        return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
      });

      setRecipes(sortedRecipes);

      // Notify parent of recipe count change
      if (onRecipeCountChange) {
        onRecipeCountChange(sortedRecipes.length);
      }
    } catch (err) {
      setError('Failed to load recipes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId, onRecipeCountChange]);

  // Trigger animation when filters are applied
  useEffect(() => {
    if (searchTerm || selectedFilter || selectedHealthCondition || selectedCategory) {
      setFilterApplied(true);
      const timer = setTimeout(() => setFilterApplied(false), 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, selectedFilter, selectedHealthCondition, selectedCategory]);

  // Filter and sort recipes using useMemo for better performance
  const filteredRecipes = useMemo(() => {
    let filtered = [...recipes];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.convertedRecipe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.dietaryFilters.some(filter =>
          filter.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply dietary filter
    if (selectedFilter) {
      filtered = filtered.filter(recipe =>
        recipe.dietaryFilters.includes(selectedFilter)
      );
    }

    // Apply health condition filter (only for Master Chef+ plans)
    if (selectedHealthCondition && userSettings?.healthConditions.includes(selectedHealthCondition) && featureAccess?.canUseHealthConditions) {
      filtered = filtered.filter(recipe => {
        const recipeContent = recipe.convertedRecipe.toLowerCase();
        // Filter recipes that are suitable for the health condition
        switch (selectedHealthCondition.toLowerCase()) {
          case 'diabetes':
            return recipeContent.includes('low sugar') || recipeContent.includes('sugar-free') ||
                   recipeContent.includes('diabetic') || recipeContent.includes('low carb') ||
                   !recipeContent.includes('high sugar') && !recipeContent.includes('dessert');
          case 'heart disease':
            return recipeContent.includes('low sodium') || recipeContent.includes('heart healthy') ||
                   recipeContent.includes('low cholesterol') || recipeContent.includes('lean') ||
                   !recipeContent.includes('fried') && !recipeContent.includes('butter');
          case 'hypertension':
            return recipeContent.includes('low sodium') || recipeContent.includes('no salt') ||
                   recipeContent.includes('dash diet') || !recipeContent.includes('high sodium');
          case 'celiac disease':
            return recipeContent.includes('gluten-free') || recipeContent.includes('gluten free') ||
                   !recipeContent.includes('wheat') && !recipeContent.includes('flour') && !recipeContent.includes('bread');
          case 'kidney disease':
            return recipeContent.includes('low protein') || recipeContent.includes('kidney friendly') ||
                   recipeContent.includes('low potassium') || recipeContent.includes('low phosphorus');
          default:
            return true; // Show all recipes for unknown conditions
        }
      });
    }

    // Apply category filter (advanced filtering)
    if (selectedCategory && featureAccess?.canUseAdvancedFilters) {
      filtered = filtered.filter(recipe => {
        const recipeContent = recipe.convertedRecipe.toLowerCase();
        switch (selectedCategory) {
          case 'appetizer':
            return recipeContent.includes('appetizer') || recipeContent.includes('starter') ||
                   recipeContent.includes('hors d\'oeuvre') || recipeContent.includes('canapé') ||
                   recipeContent.includes('antipasto') || recipeContent.includes('bruschetta');
          case 'main-dish':
            return recipeContent.includes('main') || recipeContent.includes('entree') ||
                   recipeContent.includes('dinner') || recipeContent.includes('lunch') ||
                   recipeContent.includes('entrée') || recipeContent.includes('course');
          case 'side-dish':
            return recipeContent.includes('side') || recipeContent.includes('accompaniment') ||
                   recipeContent.includes('garnish') || recipeContent.includes('vegetable') ||
                   recipeContent.includes('rice') || recipeContent.includes('potato');
          case 'dessert':
            return recipeContent.includes('dessert') || recipeContent.includes('sweet') ||
                   recipeContent.includes('cake') || recipeContent.includes('cookie') ||
                   recipeContent.includes('ice cream') || recipeContent.includes('pie') ||
                   recipeContent.includes('pudding') || recipeContent.includes('tart');
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
          break;
        case 'rating':
          // For now, use a simple popularity metric based on title length (could be replaced with actual ratings)
          comparison = (a.title.length || 0) - (b.title.length || 0);
          break;
        default:
          comparison = (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [recipes, searchTerm, selectedFilter, selectedHealthCondition, selectedCategory, sortBy, sortOrder, featureAccess, userSettings]);

  // Reset to first page only when filters change (not when recipes change)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter, selectedHealthCondition, selectedCategory, sortBy, sortOrder]);

  // Get all unique dietary filters from recipes - memoized
  const availableFilters = useMemo(() =>
    [...new Set(recipes.flatMap(recipe => recipe.dietaryFilters))].sort(),
    [recipes]
  );

  // Pagination calculations - memoized
  const { totalPages, startIndex, endIndex, currentRecipes } = useMemo(() => {
    const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
    const startIndex = (currentPage - 1) * recipesPerPage;
    const endIndex = startIndex + recipesPerPage;
    const currentRecipes = filteredRecipes.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, currentRecipes };
  }, [filteredRecipes, currentPage, recipesPerPage]);

  // Advanced category filters (only for Chef+ plans)
  const categoryFilters = [
    { value: '', label: 'All Categories' },
    { value: 'appetizer', label: '🍤 Appetizer' },
    { value: 'main-dish', label: '🍽️ Main Dish' },
    { value: 'side-dish', label: '🥔 Side Dish' },
    { value: 'dessert', label: '🍰 Dessert' }
  ];

  useEffect(() => {
    loadRecipes();
    // Trigger page load animation
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [loadRecipes]);

  // Reload recipes when navigating to the recipe book page
  useEffect(() => {
    if (location.pathname === '/app/recipe-book') {
      loadRecipes();
    }
  }, [location.pathname, loadRecipes]);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    saveToSession(STORAGE_KEYS.searchTerm, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    saveToSession(STORAGE_KEYS.selectedFilter, selectedFilter);
  }, [selectedFilter]);

  useEffect(() => {
    saveToSession(STORAGE_KEYS.selectedHealthCondition, selectedHealthCondition);
  }, [selectedHealthCondition]);

  useEffect(() => {
    saveToSession(STORAGE_KEYS.sortBy, sortBy);
  }, [sortBy]);

  useEffect(() => {
    saveToSession(STORAGE_KEYS.sortOrder, sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    saveToSession(STORAGE_KEYS.selectedCategory, selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    saveToSession(STORAGE_KEYS.viewMode, viewMode);
  }, [viewMode]);

  // Force grid view on mobile screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640 && viewMode === 'list') {
        setViewMode('grid');
      }
    };

    // Check on mount
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === currentPage || isTransitioning) return;

    setIsTransitioning(true);

    // Short delay to allow fade-out animation
    setTimeout(() => {
      setCurrentPage(newPage);
      // End transition after a brief moment for fade-in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    }, 150);
  }, [currentPage, isTransitioning]);

  const handleDeleteClick = useCallback((recipeId: string) => {
    setShowDeleteConfirm(recipeId);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!showDeleteConfirm) return;

    try {
      await deleteRecipe(showDeleteConfirm);
      setRecipes(prev => {
        const updated = prev.filter(r => r.id !== showDeleteConfirm);

        // Notify parent of recipe count change
        if (onRecipeCountChange) {
          onRecipeCountChange(updated.length);
        }

        return updated;
      });
      setShowDeleteConfirm(null);
      showSuccess('Recipe Deleted', 'The recipe has been successfully removed from your collection', 'delete');
    } catch (err) {
      setError('Failed to delete recipe');
      console.error(err);
      showError('Delete Failed', 'Could not delete the recipe. Please try again.', 'delete');
    }
  }, [showDeleteConfirm, showSuccess, showError, onRecipeCountChange]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(null);
  }, []);

  const handleEditRecipe = useCallback((recipe: SavedRecipe) => {
    setEditingRecipe(recipe);
  }, []);

  const handleRecipeUpdate = useCallback((updatedRecipe: SavedRecipe) => {

    // Update the recipes array immediately
    setRecipes(prev => {
      const updated = prev.map(recipe =>
        recipe.id === updatedRecipe.id ? updatedRecipe : recipe
      );
      return updated;
    });

    setEditingRecipe(null);
  }, []);

  // Clear all filters except search and sort
  const handleClearFilters = useCallback(() => {
    setSelectedFilter('');
    setSelectedHealthCondition('');
    setSelectedCategory('');
  }, []);

  // Loading skeleton cards will be shown in the main UI below
  const isLoadingState = loading;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 rounded-2xl shadow-2xl p-8 border-2 border-green-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 shadow-lg">
                <ChefHat className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">My Recipe Book</h2>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md mx-auto shadow-lg">
              <p className="text-red-600 font-bold mb-4">{error}</p>
              <button
                onClick={loadRecipes}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Remove the empty state - always show the full UI

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 border-2 border-green-100">
        {/* Header with animation */}
        <div className={`flex items-center justify-between mb-4 sm:mb-6 ${isPageLoaded ? 'animate-header-slide-in' : 'opacity-0'}`}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-2 sm:p-2.5 lg:p-3 shadow-lg transform transition-transform duration-300 hover:scale-110">
              <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white flex-shrink-0" />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-3xl font-black text-gray-900 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">My Recipe Book</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {featureAccess && (
              <div className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 shadow-sm transition-all duration-300 ${
                featureAccess.canSaveRecipes
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-300'
                  : 'bg-gradient-to-r from-orange-50 to-red-50 text-orange-800 border-orange-300'
              }`}>
                <ChefHat className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-extrabold">{featureAccess.currentRecipeCount}</span>
                <span className="text-gray-400 font-bold">/</span>
                <span className="opacity-75">{featureAccess.recipeLimit === 999999 ? '∞' : featureAccess.recipeLimit}</span>
              </div>
            )}
            {/* View Toggle Buttons - Hidden on mobile */}
            <div className="hidden sm:flex items-center bg-white border-2 border-gray-300 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Recipe Limit Warning */}
        {featureAccess && !featureAccess.canSaveRecipes && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start sm:items-center">
              <div className="flex-shrink-0">
                <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400 mt-0.5 sm:mt-0" />
              </div>
              <div className="ml-2 sm:ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-orange-800">Recipe Limit Reached</h3>
                <p className="text-xs sm:text-sm text-orange-700 mt-1">
                  You've reached your {featureAccess.currentPlan.toUpperCase()} plan limit of {featureAccess.recipeLimit} recipes. 
                  Upgrade your plan to save more recipes.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {featureAccess && featureAccess.canSaveRecipes && featureAccess.currentRecipeCount >= featureAccess.recipeLimit * 0.8 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start sm:items-center">
              <div className="flex-shrink-0">
                <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mt-0.5 sm:mt-0" />
              </div>
              <div className="ml-2 sm:ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-yellow-800">Nearly at Recipe Limit</h3>
                <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                  You're using {featureAccess.currentRecipeCount} of {featureAccess.recipeLimit} recipes on your {featureAccess.currentPlan.toUpperCase()} plan. 
                  Consider upgrading to avoid reaching your limit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filter Bar with animation */}
        <div className={`relative z-40 bg-gradient-to-br from-white to-green-50/20 rounded-2xl shadow-lg border-2 border-green-100 p-4 sm:p-5 mb-4 sm:mb-6 ${isPageLoaded ? 'animate-filter-bar-slide' : 'opacity-0'}`}>
          {/* First Row: Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            {/* Search Input - 2/3 width on desktop */}
            <div className="relative flex-1 sm:flex-[2]">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium shadow-sm transition-all duration-200 hover:border-green-300"
                aria-label="Search recipes"
              />
            </div>

            {/* Sort Options - 1/3 width on desktop with animation */}
            <div className="sm:flex-1">
              <CustomDropdown
                value={`${sortBy}-${sortOrder}`}
                onChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split('-');
                  setSortBy(newSortBy as 'date' | 'name' | 'rating');
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                }}
                options={[
                  { value: 'date-desc', label: 'Newest First', icon: '📅' },
                  { value: 'date-asc', label: 'Oldest First', icon: '📅' },
                  { value: 'name-asc', label: 'A-Z', icon: '🔤' },
                  { value: 'name-desc', label: 'Z-A', icon: '🔤' }
                ]}
                icon={<ArrowUpDown className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
                placeholder="Sort by..."
                ariaLabel="Sort recipes"
              />
            </div>
          </div>

          {/* Second Row: Filters - Each takes 1/3 width on desktop */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Dietary Filter - 1/3 width for free users, full width for others when no locked filters */}
            {availableFilters.length > 0 && (
              <div className={featureAccess?.currentPlan === 'free' ? 'sm:flex-[1]' : 'sm:flex-1'}>
                <CustomDropdown
                  value={selectedFilter}
                  onChange={setSelectedFilter}
                  options={[
                    { value: '', label: 'All Dietary Filters', icon: '🍽️' },
                    ...availableFilters.map(filter => ({ value: filter, label: filter, icon: '🥗' }))
                  ]}
                  icon={<Filter className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
                  ariaLabel="Filter by dietary restriction"
                />
              </div>
            )}

            {/* Health Condition Filter - 1/3 width - Only for Master Chef+ plans */}
            {userSettings?.healthConditions && userSettings.healthConditions.length > 0 && featureAccess?.canUseHealthConditions && (
              <div className="sm:flex-1">
                <CustomDropdown
                  value={selectedHealthCondition}
                  onChange={setSelectedHealthCondition}
                  options={[
                    { value: '', label: 'All Health Conditions', icon: '💚' },
                    ...userSettings.healthConditions.map(condition => ({ value: condition, label: condition, icon: '❤️' }))
                  ]}
                  icon={<Heart className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
                  ariaLabel="Filter by health condition"
                />
              </div>
            )}

            {/* Advanced Category Filter - 1/3 width - Only for Chef+ plans */}
            {featureAccess?.canUseAdvancedFilters && (
              <div className="sm:flex-1">
                <CustomDropdown
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={categoryFilters.map(cat => ({
                    value: cat.value,
                    label: cat.label.replace(/^.+?\s/, ''), // Remove emoji from label for cleaner display
                    icon: cat.label.match(/^(.+?)\s/)?.[1] || '📂' // Extract emoji
                  }))}
                  icon={<ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
                  ariaLabel="Filter by category"
                />
              </div>
            )}

            {/* Enhanced Pro Filter Notice for Free Users - Matches Dropdown Height */}
            {!featureAccess?.canUseAdvancedFilters && (
              <div className={`bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl flex items-center shadow-sm h-[46px] sm:h-[50px] ${
                featureAccess?.currentPlan === 'free' ? 'sm:flex-[2]' : 'sm:flex-1'
              }`}>
                <div className="flex items-center w-full px-3 sm:px-4">
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-1.5 sm:p-2 mr-2 sm:mr-3 flex-shrink-0">
                    <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-orange-800">
                    <span className="hidden sm:inline">Chef+ Filters:</span> Health conditions, advanced categories & more
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced Results Counter */}
          {(searchTerm || selectedFilter || selectedHealthCondition || selectedCategory) && (
            <div className="mt-4 pt-4 border-t-2 border-green-100">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="bg-green-100 rounded-lg px-3 py-1.5 flex-shrink-0">
                    <p className="text-sm font-bold text-green-800">
                      {filteredRecipes.length} of {recipes.length}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 font-medium truncate">
                    {searchTerm && <span>matching "<span className="text-green-600 font-bold">{searchTerm}</span>"</span>}
                    {selectedFilter && <span>{searchTerm ? ' • ' : ''}with <span className="text-green-600 font-bold">{selectedFilter}</span></span>}
                    {selectedHealthCondition && <span>{(searchTerm || selectedFilter) ? ' • ' : ''}for <span className="text-green-600 font-bold">{selectedHealthCondition}</span></span>}
                    {selectedCategory && <span>{(searchTerm || selectedFilter || selectedHealthCondition) ? ' • ' : ''}in <span className="text-green-600 font-bold">{categoryFilters.find(c => c.value === selectedCategory)?.label}</span></span>}
                  </p>
                </div>
                {/* Clear Filters Button - Only show if any filters are active (not search or sort) */}
                {(selectedFilter || selectedHealthCondition || selectedCategory) && (
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border-2 border-red-200 rounded-lg hover:border-red-400 hover:shadow-md transition-all duration-300 text-sm font-bold sm:hover:scale-105 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear Filters</span>
                    <span className="sm:hidden">Clear</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recipe Cards - Grid or List View */}
        <div
          data-recipes-grid
          className={`relative z-10 transition-all duration-300 ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
              : 'flex flex-col gap-4'
          } ${isTransitioning ? 'animate-page-out' : 'animate-page-in'}`}
        >
          {isLoadingState ? (
            // Loading skeleton cards
            Array.from({ length: 8 }).map((_, index) => {
              const staggerClass = `stagger-${(index % 8) + 1}`;
              return (
                <div
                  key={`skeleton-${index}`}
                  className={`bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden animate-pulse ${
                    isPageLoaded ? `animate-recipe-card-enter ${staggerClass}` : 'opacity-0'
                  }`}
                >
                  {/* Skeleton Image */}
                  <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-200 to-gray-300"></div>

                  {/* Skeleton Content */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2.5 sm:mb-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>

                    <div className="mb-2 sm:mb-3">
                      <div className="flex flex-wrap gap-1.5">
                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      </div>
                    </div>
                  </div>

                  {/* Skeleton Actions */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-3 sm:px-4 py-3 sm:py-3.5 flex justify-between items-center border-t border-gray-200 gap-2">
                    <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
                    <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              );
            })
          ) : (
            currentRecipes.map((recipe, index) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                viewMode={viewMode}
                onViewRecipe={onViewRecipe}
                onEdit={handleEditRecipe}
                onDelete={handleDeleteClick}
                isPageLoaded={isPageLoaded}
                isTransitioning={isTransitioning}
                filterApplied={filterApplied}
                staggerClass={`stagger-${(index % 8) + 1}`}
              />
            ))
          )}
        </div>

        {/* Pagination Controls with enhanced design */}
        {!isLoadingState && totalPages > 1 && filteredRecipes.length > 0 && (
          <div className={`mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t-2 border-green-100 pt-4 sm:pt-6 ${isPageLoaded ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="flex items-center text-xs sm:text-sm text-gray-700 font-semibold bg-gradient-to-r from-green-50 to-emerald-50 px-3 sm:px-4 py-2 rounded-lg border border-green-200 w-full sm:w-auto justify-center">
              <span>
                <span className="hidden sm:inline">Showing </span>{startIndex + 1} - {Math.min(endIndex, filteredRecipes.length)} <span className="hidden sm:inline">of {filteredRecipes.length}</span>
              </span>
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-2 pagination-mobile-optimized w-full sm:w-auto justify-center">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isTransitioning}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-green-500 rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-green-600 disabled:hover:to-emerald-600 transition-all duration-300 sm:hover:scale-105 sm:hover:shadow-lg shadow-md touch-manipulation active:scale-95"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>

              {/* Page Numbers - Show fewer on mobile */}
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Mobile: Show only current page and adjacent pages
                  const isMobileView = window.innerWidth < 640;
                  const showOnMobile = page === 1 ||
                                       page === totalPages ||
                                       (page >= currentPage - 1 && page <= currentPage + 1);

                  // Desktop: Show current page and 2 pages around it
                  const showOnDesktop = page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 2 && page <= currentPage + 2);

                  if (showOnMobile || showOnDesktop) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={isTransitioning}
                        className={`inline-flex items-center justify-center min-w-[40px] sm:min-w-[42px] px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-bold border-2 rounded-lg sm:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 touch-manipulation active:scale-95 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400 shadow-lg scale-105 sm:scale-110 shadow-green-500/30'
                            : 'text-gray-700 bg-white border-gray-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-300 hover:text-green-700 sm:hover:scale-105 sm:hover:shadow-md'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    (page === currentPage - 2 && currentPage > 3) ||
                    (page === currentPage + 2 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <span key={page} className="px-1 sm:px-2 py-2 text-xs sm:text-sm font-bold text-gray-400">
                        •••
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isTransitioning}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-green-500 rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-green-600 disabled:hover:to-emerald-600 transition-all duration-300 sm:hover:scale-105 sm:hover:shadow-lg shadow-md touch-manipulation active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* No Results with animation */}
        {!isLoadingState && filteredRecipes.length === 0 && recipes.length > 0 && (
          <div className="text-center py-12 animate-no-results">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No recipes found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
        )}

        {/* Empty state - shown only when not loading and no recipes exist */}
        {!isLoadingState && recipes.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <ChefHat className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">No recipes saved yet</h3>
            <p className="text-gray-600 max-w-md mx-auto font-medium">
              Start converting or creating recipes to build your personal collection of delicious dishes!
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleDeleteCancel}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete Recipe
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this recipe? This action cannot be undone and the recipe will be permanently removed from your collection.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteConfirm}
                >
                  Delete Recipe
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={handleDeleteCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Editor Modal */}
      {editingRecipe && (
        <RecipeEditor
          recipe={editingRecipe}
          isOpen={!!editingRecipe}
          onClose={() => setEditingRecipe(null)}
          onUpdate={handleRecipeUpdate}
        />
      )}
    </div>
  );
};
