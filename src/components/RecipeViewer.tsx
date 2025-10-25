import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Filter, Clock, ChefHat, Edit } from 'lucide-react';
import type { SavedRecipe } from '../lib/validation';
import { StructuredRecipeDisplay } from './StructuredRecipeDisplay';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useToast } from './ToastContainer';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface RecipeViewerProps {
  recipe: SavedRecipe;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (recipe: SavedRecipe) => void;
}

// Helper function to format recipe content for copying
const formatRecipeForCopy = (recipe: SavedRecipe): string => {
  try {
    // Try to parse as JSON first (structured format)
    const jsonData = JSON.parse(recipe.convertedRecipe);
    
    let formatted = `${jsonData.recipeName || recipe.title}\n`;
    formatted += '='.repeat(formatted.length - 1) + '\n\n';
    
    if (jsonData.description) {
      formatted += `${jsonData.description}\n\n`;
    }
    
    // Basic Information
    if (jsonData.prepTime || jsonData.cookTime || jsonData.totalTime || jsonData.servings) {
      formatted += 'RECIPE INFO\n';
      formatted += '-----------\n';
      if (jsonData.prepTime) formatted += `Prep Time: ${jsonData.prepTime}\n`;
      if (jsonData.cookTime) formatted += `Cook Time: ${jsonData.cookTime}\n`;
      if (jsonData.totalTime) formatted += `Total Time: ${jsonData.totalTime}\n`;
      if (jsonData.servings) formatted += `Servings: ${jsonData.servings}\n`;
      formatted += '\n';
    }
    
    // Ingredients
    if (jsonData.ingredients && jsonData.ingredients.length > 0) {
      formatted += 'INGREDIENTS\n';
      formatted += '-----------\n';
      jsonData.ingredients.forEach((ingredient: string) => {
        formatted += `• ${ingredient}\n`;
      });
      formatted += '\n';
    }
    
    // Instructions
    if (jsonData.instructions && jsonData.instructions.length > 0) {
      formatted += 'INSTRUCTIONS\n';
      formatted += '------------\n';
      jsonData.instructions.forEach((instruction: string, index: number) => {
        formatted += `${index + 1}. ${instruction}\n\n`;
      });
    }
    
    // Nutritional Information
    if (jsonData.nutritionalInfo) {
      formatted += 'NUTRITIONAL INFORMATION\n';
      formatted += '-----------------------\n';
      Object.entries(jsonData.nutritionalInfo).forEach(([key, value]) => {
        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        formatted += `${capitalizedKey}: ${value}\n`;
      });
      formatted += '\n';
    }
    
    // Tags and Tips
    if (jsonData.tags && jsonData.tags.length > 0) {
      formatted += `Tags: ${jsonData.tags.join(', ')}\n\n`;
    }
    
    if (jsonData.tips && jsonData.tips.length > 0) {
      formatted += 'CHEF\'S TIPS\n';
      formatted += '-----------\n';
      jsonData.tips.forEach((tip: string) => {
        formatted += `• ${tip}\n`;
      });
    }
    
    return formatted;
    
  } catch (error) {
    // If it's not JSON, treat as markdown and convert to plain text
    let formatted = `${recipe.title}\n`;
    formatted += '='.repeat(recipe.title.length) + '\n\n';
    
    // Clean up markdown formatting for better Word compatibility
    let content = recipe.convertedRecipe
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
      .replace(/#{1,6}\s?/g, '') // Remove heading markers
      .replace(/^-\s/gm, '• ') // Convert bullet points
      .replace(/^\d+\.\s/gm, (match, offset, string) => {
        // Keep numbered lists formatted nicely
        return match;
      });
    
    formatted += content;
    return formatted;
  }
};

export const RecipeViewer: React.FC<RecipeViewerProps> = ({ recipe, isOpen, onClose, onEdit }) => {
  const { showSuccess, showError } = useToast();

  // Lock body scroll when viewer is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95 flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header - Show image if available, otherwise simple title bar */}
          {(() => {
            // Check if there's an actual image available
            let imageUrl = null;
            
            // First check recipe.imageUrl (stored directly on recipe)
            if (recipe.imageUrl) {
              imageUrl = recipe.imageUrl;
            } else {
              // Try to extract image from recipe JSON content
              try {
                const recipeData = JSON.parse(recipe.convertedRecipe);
                if (recipeData.imageUrl) {
                  imageUrl = recipeData.imageUrl;
                }
              } catch (error) {
                // JSON parsing failed, no image
              }
            }
            
            if (imageUrl) {
              // Show clean image header without text overlay
              return (
                <div className="relative h-40 sm:h-48 overflow-hidden flex-shrink-0">
                  {/* High-quality dish image only */}
                  <div className="absolute inset-0">
                    <img 
                      src={imageUrl} 
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image if it fails to load
                        e.currentTarget.parentElement.style.display = 'none';
                      }}
                    />
                  </div>
                  
                  {/* Dark blur overlay */}
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
                  
                  {/* Dish name - Bottom Left */}
                  <div className="absolute bottom-3 left-4 right-16">
                    <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
                      {recipe.title}
                    </h2>
                  </div>
                  
                  {/* Close Button - Top Right */}
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-white/90 hover:text-white transition-colors p-2 rounded-lg hover:bg-black/20 backdrop-blur-sm z-10 shadow-lg"
                  >
                    <X className="h-5 w-5 drop-shadow-lg" />
                  </button>
                </div>
              );
            } else {
              // No image - simple title bar
              return (
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center flex-shrink-0">
                  <h2 className="text-xl font-bold text-gray-900 truncate">
                    {recipe.title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              );
            }
          })()}

          {/* Recipe Content - Allow this to grow and scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Check if the recipe is in JSON format */}
            {(() => {
              try {
                JSON.parse(recipe.convertedRecipe);
                // It's JSON, use structured display without header
                return <StructuredRecipeDisplay recipeJson={recipe.convertedRecipe} hideHeader={true} />;
              } catch (error) {
                // It's markdown, use the old renderer with fallback title
                return (
                  <div className="px-6 py-6">
                    {!recipe.convertedRecipe.toLowerCase().includes(recipe.title.toLowerCase()) && (
                      <h1 className="text-2xl font-bold text-green-600 mb-6 text-center border-b-2 border-green-200 pb-3">
                        {recipe.title}
                      </h1>
                    )}
                    <MarkdownRenderer content={recipe.convertedRecipe} />
                  </div>
                );
              }
            })()}
          </div>

          {/* Footer Actions - Fixed at bottom */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end items-center border-t border-gray-200 flex-shrink-0">
            <div className="flex space-x-3">
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(recipe);
                    onClose();
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Recipe
                </button>
              )}
              <button
                onClick={async () => {
                  try {
                    const formattedRecipe = formatRecipeForCopy(recipe);
                    await navigator.clipboard.writeText(formattedRecipe);
                    showSuccess('Recipe Copied!', 'The recipe has been copied to your clipboard in a format perfect for pasting into Microsoft Word.', 'copy');
                  } catch (error) {
                    showError('Copy Failed', 'Unable to copy the recipe to clipboard. Please try again.', 'copy');
                  }
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Copy Recipe
              </button>
            </div>
          </div>
        </div>
      </div>,
    document.body
  );
};

export default RecipeViewer;