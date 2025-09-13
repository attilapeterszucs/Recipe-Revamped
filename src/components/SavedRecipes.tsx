import React, { useEffect, useState, useCallback } from 'react';
import { getUserRecipes, deleteRecipe } from '../lib/firestore';
import type { SavedRecipe } from '../lib/validation';
import type { UserSettings } from '../types/userSettings';
import { useToast } from './ToastContainer';
import { Search, Eye, Trash2, Calendar, Filter, ChefHat, RefreshCcw, Edit, Clock, Users, Image, Star, Crown, Heart } from 'lucide-react';
import { RecipeEditor } from './RecipeEditor';

interface SavedRecipesProps {
  userId: string;
  onSelect?: (recipe: SavedRecipe) => void;
  onViewRecipe?: (recipe: SavedRecipe) => void;
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

// Helper function to extract timing and serving info from recipe content
const extractRecipeInfo = (content: string) => {
  try {
    // Try parsing as JSON first (new format)
    const jsonData = JSON.parse(content);
    return {
      totalTime: jsonData.totalTime || 'N/A',
      servings: jsonData.servings || 'N/A'
    };
  } catch (error) {
    // Fall back to markdown parsing
    const lines = content.split('\n');
    let totalTime = 'N/A';
    let servings = 'N/A';
    
    for (const line of lines) {
      const totalTimeMatch = line.match(/\*\*Total Time:\*\*\s*(.+)/i);
      if (totalTimeMatch) {
        totalTime = totalTimeMatch[1].trim();
      }
      
      const servingsMatch = line.match(/\*\*Servings:\*\*\s*(.+)/i);
      if (servingsMatch) {
        servings = servingsMatch[1].trim();
      }
    }
    
    return { totalTime, servings };
  }
};

export const SavedRecipes: React.FC<SavedRecipesProps> = ({ userId, onSelect, onViewRecipe, userSettings, featureAccess }) => {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [selectedHealthCondition, setSelectedHealthCondition] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<SavedRecipe | null>(null);
  const { showSuccess, showError } = useToast();

  const loadRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const userRecipes = await getUserRecipes(userId);
      setRecipes(userRecipes);
      setFilteredRecipes(userRecipes);
    } catch (err) {
      setError('Failed to load recipes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Filter and sort recipes
  useEffect(() => {
    let filtered = recipes;
    
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
    
    setFilteredRecipes(filtered);
  }, [recipes, searchTerm, selectedFilter, selectedHealthCondition, selectedCategory, sortBy, sortOrder, featureAccess, userSettings]);

  // Get all unique dietary filters from recipes
  const availableFilters = [...new Set(recipes.flatMap(recipe => recipe.dietaryFilters))].sort();
  
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
  }, [loadRecipes]);

  const handleDeleteClick = (recipeId: string) => {
    setShowDeleteConfirm(recipeId);
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm) return;

    try {
      await deleteRecipe(showDeleteConfirm);
      setRecipes(prev => prev.filter(r => r.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
      showSuccess('Recipe Deleted', 'The recipe has been successfully removed from your collection', 'delete');
    } catch (err) {
      setError('Failed to delete recipe');
      console.error(err);
      showError('Delete Failed', 'Could not delete the recipe. Please try again.', 'delete');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  const handleEditRecipe = (recipe: SavedRecipe) => {
    setEditingRecipe(recipe);
  };

  const handleRecipeUpdate = (updatedRecipe: SavedRecipe) => {
    
    // Update the recipes array immediately
    setRecipes(prev => {
      const updated = prev.map(recipe => 
        recipe.id === updatedRecipe.id ? updatedRecipe : recipe
      );
      return updated;
    });
    
    setEditingRecipe(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-green-600" />
              <h2 className="text-3xl font-bold text-gray-900">My Saved Recipes</h2>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading your delicious recipes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-green-600" />
              <h2 className="text-3xl font-bold text-gray-900">My Saved Recipes</h2>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button 
                onClick={loadRecipes}
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
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

  if (recipes.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-green-600" />
              <h2 className="text-3xl font-bold text-gray-900">My Saved Recipes</h2>
            </div>
          </div>
          <div className="text-center py-16">
            <ChefHat className="mx-auto h-24 w-24 text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipes saved yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Start converting or creating recipes to build your personal collection of delicious dishes!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl lg:text-3xl font-bold text-gray-900">My Saved Recipes</h2>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {featureAccess && (
              <span className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full ${
                featureAccess.canSaveRecipes 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {featureAccess.currentRecipeCount}/{featureAccess.recipeLimit}
              </span>
            )}
            <button
              onClick={loadRecipes}
              className="inline-flex items-center justify-center px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-green-600 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
            >
              <RefreshCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
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

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          {/* First Row: Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
            {/* Search Input - 2/3 width on desktop */}
            <div className="relative flex-1 sm:flex-[2]">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm h-10 sm:h-11"
              />
            </div>
            
            {/* Sort Options - 1/3 width on desktop */}
            <div className="sm:flex-1">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy as 'date' | 'name' | 'rating');
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                }}
                className="w-full px-2.5 sm:px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-xs sm:text-sm h-10 sm:h-11"
              >
                <option value="date-desc">📅 Newest First</option>
                <option value="date-asc">📅 Oldest First</option>
                <option value="name-asc">🔤 A-Z</option>
                <option value="name-desc">🔤 Z-A</option>
                <option value="rating-desc">⭐ Most Popular</option>
                <option value="rating-asc">⭐ Least Popular</option>
              </select>
            </div>
          </div>

          {/* Second Row: Filters - Each takes 1/3 width on desktop */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Dietary Filter - 1/3 width for free users, full width for others when no locked filters */}
            {availableFilters.length > 0 && (
              <div className={`relative ${
                featureAccess?.currentPlan === 'free' ? 'sm:flex-[1]' : 'sm:flex-1'
              }`}>
                <Filter className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white text-xs sm:text-sm h-10 sm:h-11"
                >
                  <option value="">All Dietary Filters</option>
                  {availableFilters.map(filter => (
                    <option key={filter} value={filter}>{filter}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Health Condition Filter - 1/3 width - Only for Master Chef+ plans */}
            {userSettings?.healthConditions && userSettings.healthConditions.length > 0 && featureAccess?.canUseHealthConditions && (
              <div className="relative sm:flex-1">
                <Heart className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <select
                  value={selectedHealthCondition}
                  onChange={(e) => setSelectedHealthCondition(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white text-xs sm:text-sm h-10 sm:h-11"
                >
                  <option value="">All Health Conditions</option>
                  {userSettings.healthConditions.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Advanced Category Filter - 1/3 width - Only for Chef+ plans */}
            {featureAccess?.canUseAdvancedFilters && (
              <div className="relative sm:flex-1">
                <ChefHat className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white text-xs sm:text-sm h-10 sm:h-11"
                >
                  {categoryFilters.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Pro Filter Notice for Free Users - 2/3 width */}
            {!featureAccess?.canUseAdvancedFilters && (
              <div className={`bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-2.5 sm:p-3 flex items-center ${
                featureAccess?.currentPlan === 'free' ? 'sm:flex-[2]' : 'sm:flex-1'
              }`}>
                <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-yellow-700">
                  <strong>Chef+ Filters:</strong> Health conditions, advanced categories & more
                </span>
              </div>
            )}
          </div>
          
          {/* Results Counter */}
          {(searchTerm || selectedFilter || selectedHealthCondition || selectedCategory) && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {filteredRecipes.length} of {recipes.length} recipes
                {searchTerm && <span className="font-medium"> matching "{searchTerm}"</span>}
                {selectedFilter && <span className="font-medium"> with {selectedFilter} filter</span>}
                {selectedHealthCondition && <span className="font-medium"> suitable for {selectedHealthCondition}</span>}
                {selectedCategory && <span className="font-medium"> in {categoryFilters.find(c => c.value === selectedCategory)?.label} category</span>}
              </p>
            </div>
          )}
        </div>

        {/* Recipe Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredRecipes.map(recipe => {
            const recipeInfo = extractRecipeInfo(recipe.convertedRecipe);
            return (
              <div 
                key={recipe.id} 
                className="bg-white rounded-xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-gray-200 overflow-hidden group transform"
              >
                {/* Recipe Image */}
                <div 
                  className="relative h-40 sm:h-48 bg-gradient-to-br from-green-400 to-blue-500 cursor-pointer"
                  onClick={() => onViewRecipe && onViewRecipe(recipe)}
                >
                  {recipe.imageUrl ? (
                    <img 
                      src={recipe.imageUrl} 
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to default gradient background if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="h-16 w-16 text-white opacity-80" />
                    </div>
                  )}
                  
                  {/* Overlay with recipe name */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4">
                    <h3 className="text-sm sm:text-lg font-bold text-white truncate" title={recipe.title}>
                      {recipe.title}
                    </h3>
                  </div>
                  
                  {/* Image indicator */}
                  {!recipe.imageUrl && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-black/50 rounded-full p-2">
                        <Image className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Recipe Metadata */}
                <div 
                  className="p-3 sm:p-4 cursor-pointer"
                  onClick={() => onViewRecipe && onViewRecipe(recipe)}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center text-xs sm:text-sm text-gray-500">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">{recipe.createdAt?.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                      <span className="sm:hidden">{recipe.createdAt?.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-3 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-500" />
                      <span className="truncate">{recipeInfo.totalTime || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-blue-500" />
                      <span className="truncate">{recipeInfo.servings} <span className="hidden sm:inline">servings</span></span>
                    </div>
                  </div>
                  
                  {/* Dietary Filters */}
                  {recipe.dietaryFilters.length > 0 && (
                    <div className="mb-2 sm:mb-3">
                      <div className="flex flex-wrap gap-1">
                        {recipe.dietaryFilters.slice(0, 2).map(filter => (
                          <span 
                            key={filter}
                            className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                          >
                            {filter.length > 8 ? filter.substring(0, 8) + '...' : filter}
                          </span>
                        ))}
                        {recipe.dietaryFilters.length > 2 && (
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{recipe.dietaryFilters.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Card Actions */}
                <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center border-t border-gray-200">
                  <div className="flex space-x-1 sm:space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewRecipe && onViewRecipe(recipe);
                      }}
                      className="inline-flex items-center px-2 sm:px-3 py-1 text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors text-xs sm:text-sm"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRecipe(recipe);
                      }}
                      className="inline-flex items-center px-2 sm:px-3 py-1 text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors text-xs sm:text-sm"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(recipe.id);
                    }}
                    className="inline-flex items-center px-2 sm:px-3 py-1 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors text-xs sm:text-sm"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredRecipes.length === 0 && recipes.length > 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No recipes found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters to find what you're looking for.
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
