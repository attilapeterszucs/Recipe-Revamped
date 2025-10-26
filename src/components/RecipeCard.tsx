import React, { memo } from 'react';
import { Calendar, Edit, Clock, Users, Image, ChefHat, Trash2 } from 'lucide-react';
import type { SavedRecipe } from '../lib/validation';

interface RecipeCardProps {
  recipe: SavedRecipe;
  viewMode: 'grid' | 'list';
  onViewRecipe?: (recipe: SavedRecipe) => void;
  onEdit: (recipe: SavedRecipe) => void;
  onDelete: (recipeId: string) => void;
  isPageLoaded: boolean;
  isTransitioning: boolean;
  filterApplied: boolean;
  staggerClass: string;
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

export const RecipeCard = memo<RecipeCardProps>(({
  recipe,
  viewMode,
  onViewRecipe,
  onEdit,
  onDelete,
  isPageLoaded,
  isTransitioning,
  filterApplied,
  staggerClass
}) => {
  const recipeInfo = extractRecipeInfo(recipe.convertedRecipe);

  // List View Layout
  if (viewMode === 'list') {
    return (
      <div
        className={`bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden group transform recipe-card-3d transition-all duration-500 ${
          isPageLoaded && !isTransitioning ? `animate-recipe-card-enter ${staggerClass}` : 'opacity-0'
        } ${filterApplied ? 'animate-filter-change' : ''}`}
      >
        <div className="flex flex-col sm:flex-row sm:h-64">
          {/* List View Image */}
          <div
            className="relative h-48 sm:h-64 sm:w-64 flex-shrink-0 bg-gradient-to-br from-green-400 via-emerald-400 to-blue-500 cursor-pointer overflow-hidden group/image"
            onClick={() => onViewRecipe && onViewRecipe(recipe)}
          >
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ChefHat className="h-16 w-16 text-white opacity-80 transition-transform duration-300 group-hover/image:scale-110 group-hover/image:rotate-12" />
              </div>
            )}
            {!recipe.imageUrl && (
              <div className="absolute top-3 right-3">
                <div className="bg-black/50 rounded-full p-2">
                  <Image className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* List View Content */}
          <div className="flex-1 flex flex-col">
            <div
              className="p-4 sm:p-5 cursor-pointer flex-1"
              onClick={() => onViewRecipe && onViewRecipe(recipe)}
            >
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{recipe.title}</h3>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{recipe.createdAt?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-green-500" />
                  <span>{recipeInfo.totalTime || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-blue-500" />
                  <span>{recipeInfo.servings} servings</span>
                </div>
              </div>

              {recipe.dietaryFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recipe.dietaryFilters.map(filter => (
                    <span
                      key={filter}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                    >
                      {filter}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* List View Actions */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-4 sm:px-5 py-3 sm:py-3.5 flex justify-end items-center border-t border-gray-200 gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(recipe);
                }}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-green-700 font-semibold bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-lg transition-all duration-300 text-sm sm:hover:scale-105 touch-manipulation active:scale-95"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(recipe.id);
                }}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-white font-semibold bg-gradient-to-r from-red-600 to-red-500 border-2 border-transparent rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-300 text-sm sm:hover:scale-105 hover:shadow-lg shadow-red-500/20 touch-manipulation active:scale-95"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View Layout
  return (
    <div
      className={`bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden group transform recipe-card-3d transition-all duration-500 ${
        isPageLoaded && !isTransitioning ? `animate-recipe-card-enter ${staggerClass}` : 'opacity-0'
      } ${filterApplied ? 'animate-filter-change' : ''}`}
    >
      {/* Recipe Image with hover effect */}
      <div
        className="relative h-40 sm:h-48 bg-gradient-to-br from-green-400 via-emerald-400 to-blue-500 cursor-pointer overflow-hidden group/image"
        onClick={() => onViewRecipe && onViewRecipe(recipe)}
      >
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110"
            onError={(e) => {
              // Fallback to default gradient background if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="h-16 w-16 text-white opacity-80 transition-transform duration-300 group-hover/image:scale-110 group-hover/image:rotate-12" />
          </div>
        )}

        {/* Overlay with recipe name */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4 transition-all duration-300 group-hover/image:from-black/80">
          <h3 className="text-sm sm:text-lg font-bold text-white truncate transition-transform duration-300 group-hover/image:translate-x-1" title={recipe.title}>
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
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <div className="flex items-center text-xs sm:text-sm text-gray-500">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
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

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2.5 sm:mb-3 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 text-green-500 flex-shrink-0" />
            <span className="truncate">{recipeInfo.totalTime || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 text-blue-500 flex-shrink-0" />
            <span className="truncate">{recipeInfo.servings} <span className="hidden sm:inline">servings</span></span>
          </div>
        </div>

        {/* Dietary Filters - Enhanced badges matching landing page */}
        {recipe.dietaryFilters.length > 0 && (
          <div className="mb-2 sm:mb-3">
            <div className="flex flex-wrap gap-1.5 dietary-badges">
              {recipe.dietaryFilters.slice(0, 2).map(filter => (
                <span
                  key={filter}
                  className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 transition-all duration-300 hover:border-green-400 hover:shadow-sm"
                >
                  {filter.length > 8 ? filter.substring(0, 8) + '...' : filter}
                </span>
              ))}
              {recipe.dietaryFilters.length > 2 && (
                <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-300 transition-all duration-300 hover:border-gray-400 hover:shadow-sm">
                  +{recipe.dietaryFilters.length - 2}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Actions with enhanced hover effects - matching landing page */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-3 sm:px-4 py-3 sm:py-3.5 flex justify-between items-center border-t border-gray-200 gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(recipe);
          }}
          className="inline-flex items-center justify-center min-h-[44px] px-3 sm:px-3.5 py-2 sm:py-2 text-green-700 font-semibold bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm sm:hover:scale-105 touch-manipulation active:scale-95 flex-1"
        >
          <Edit className="w-4 h-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(recipe.id);
          }}
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 sm:px-3.5 py-2 sm:py-2 text-white font-semibold bg-gradient-to-r from-red-600 to-red-500 border-2 border-transparent rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-300 text-xs sm:text-sm sm:hover:scale-105 hover:shadow-lg shadow-red-500/20 touch-manipulation active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if these specific props changed
  return (
    prevProps.recipe.id === nextProps.recipe.id &&
    prevProps.recipe.title === nextProps.recipe.title &&
    prevProps.recipe.imageUrl === nextProps.recipe.imageUrl &&
    prevProps.recipe.convertedRecipe === nextProps.recipe.convertedRecipe &&
    prevProps.recipe.dietaryFilters.length === nextProps.recipe.dietaryFilters.length &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.isPageLoaded === nextProps.isPageLoaded &&
    prevProps.isTransitioning === nextProps.isTransitioning &&
    prevProps.filterApplied === nextProps.filterApplied
  );
});

RecipeCard.displayName = 'RecipeCard';
