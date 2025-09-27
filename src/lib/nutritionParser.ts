import type { SavedRecipe } from './validation';
import { logger } from './logger';

export interface NutritionInfo {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar?: number;
  fiber: number;
  sodium?: number;
}

export const parseNutritionFromRecipe = (recipeContent: string): NutritionInfo => {
  // Default values if nutrition info is not found or incomplete
  const defaultNutrition: NutritionInfo = {
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    fiber: 0,
    sodium: 0
  };

  try {
    // First, try to parse as JSON (new format)
    try {
      const jsonData = JSON.parse(recipeContent);
      if (jsonData.nutrition) {
        return {
          calories: jsonData.nutrition.calories || 0,
          protein: jsonData.nutrition.protein || 0,
          carbs: jsonData.nutrition.carbohydrates || 0,
          fat: jsonData.nutrition.fat || 0,
          fiber: jsonData.nutrition.fiber || 0,
          sodium: jsonData.nutrition.sodium || 0
        };
      }
    } catch (error) {
      // Not JSON, continue with markdown parsing
    }

    // Fall back to markdown format parsing
    const nutritionSection = extractNutritionSection(recipeContent);
    if (!nutritionSection) {
      // Silently fall back to ingredient-based estimation
      // Note: This is expected behavior for recipes without explicit nutrition sections
      // Try to estimate from ingredients as fallback
      const ingredients = extractIngredientsFromRecipe(recipeContent);
      if (ingredients.length > 0) {
        return estimateNutritionFromIngredients(ingredients);
      }
      return defaultNutrition;
    }

    // Parse individual nutrition values from markdown
    const nutrition: NutritionInfo = {
      calories: extractNutritionValue(nutritionSection, ['calories', 'kcal']),
      protein: extractNutritionValue(nutritionSection, ['protein']),
      carbs: extractNutritionValue(nutritionSection, ['carbohydrates', 'carbs']),
      fat: extractNutritionValue(nutritionSection, ['fat', 'total fat']),
      fiber: extractNutritionValue(nutritionSection, ['fiber', 'fibre']),
      sodium: extractNutritionValue(nutritionSection, ['sodium'])
    };

    // Validate that we have at least calories
    if (nutrition.calories === 0) {
      logger.warn('No calorie information found in recipe nutrition section, attempting estimation');
      // Try to estimate from ingredients as fallback
      const ingredients = extractIngredientsFromRecipe(recipeContent);
      if (ingredients.length > 0) {
        return estimateNutritionFromIngredients(ingredients);
      }
      return defaultNutrition;
    }

    return nutrition;
  } catch (error) {
    logger.error('Error parsing nutrition information:', { error });
    return defaultNutrition;
  }
};

const extractNutritionSection = (recipeContent: string): string | null => {
  const lines = recipeContent.split('\n');
  let inNutritionSection = false;
  let nutritionLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for nutrition section start - be more flexible with formatting
    if (trimmedLine.match(/^##?\s*Nutrition Information/i) || 
        trimmedLine.match(/^\*\*Nutrition Information\*\*/i) ||
        trimmedLine.match(/^Nutrition Information/i)) {
      inNutritionSection = true;
      continue;
    }

    // Check for next section (end of nutrition section)
    if (inNutritionSection && (
        trimmedLine.match(/^##?\s*[A-Za-z]/i) || 
        trimmedLine.match(/^\*\*[A-Za-z].*\*\*/i) ||
        trimmedLine.match(/^[A-Za-z][^:]*:?\s*$/))) {
      break;
    }

    if (inNutritionSection && trimmedLine) {
      nutritionLines.push(trimmedLine);
    }
  }

  return nutritionLines.length > 0 ? nutritionLines.join('\n') : null;
};

const extractNutritionValue = (nutritionText: string, keywords: string[]): number => {
  for (const keyword of keywords) {
    // Look for patterns like "Calories: 250 kcal" or "• Protein: 25g" or "- Protein: 25g"
    const patterns = [
      new RegExp(`[•\\-*]?\\s*${keyword}[:\\s]+([\\d.]+)`, 'i'),
      new RegExp(`${keyword}[:\\s]+([\\d.]+)`, 'i'),
      new RegExp(`([\\d.]+)[\\s]*${keyword}`, 'i'),
      new RegExp(`[•\\-*]\\s*${keyword}[:\\s]*([\\d.]+)\\s*[a-z]*`, 'i')
    ];

    for (const pattern of patterns) {
      const match = nutritionText.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        if (!isNaN(value) && value > 0) {
          return Math.round(value);
        }
      }
    }
  }
  
  return 0;
};

// Extract serving size from recipe content
export const extractServingSizeFromRecipe = (recipeContent: string): number => {
  // First, try to parse as JSON (new format)
  try {
    const jsonData = JSON.parse(recipeContent);
    if (jsonData.servings && typeof jsonData.servings === 'number' && jsonData.servings > 0) {
      return jsonData.servings;
    }
  } catch (error) {
    // Not JSON, continue with markdown parsing
  }

  // Fall back to markdown format parsing
  const servingMatch = recipeContent.match(/\*\*Servings?\*\*:?\s*(\d+)/i) || 
                      recipeContent.match(/Servings?\s*:?\s*(\d+)/i) ||
                      recipeContent.match(/Serves?\s+(\d+)/i);
  
  if (servingMatch) {
    const servings = parseInt(servingMatch[1]);
    return servings > 0 ? servings : 4;
  }
  
  return 4; // Default to 4 servings
};

// Extract ingredients list from recipe content
const extractIngredientsFromRecipe = (recipeContent: string): string[] => {
  // First, try to parse as JSON (new format)
  try {
    const jsonData = JSON.parse(recipeContent);
    if (jsonData.ingredients && Array.isArray(jsonData.ingredients)) {
      return jsonData.ingredients.filter(ingredient => ingredient && typeof ingredient === 'string');
    }
  } catch (error) {
    // Not JSON, continue with markdown parsing
  }

  // Fall back to markdown format parsing
  const lines = recipeContent.split('\n');
  const ingredients: string[] = [];
  let inIngredientsSection = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for ingredients section start
    if (trimmedLine.match(/^##?\s*Ingredients?/i) || 
        trimmedLine.match(/^\*\*Ingredients?\*\*/i)) {
      inIngredientsSection = true;
      continue;
    }
    
    // Check for next section (end of ingredients section)
    if (inIngredientsSection && (
        trimmedLine.match(/^##?\s*[A-Za-z]/i) || 
        trimmedLine.match(/^\*\*[A-Za-z].*\*\*/i) ||
        trimmedLine.match(/^\d+\./))) {
      break;
    }
    
    // Extract ingredient items
    if (inIngredientsSection && trimmedLine.match(/^[-•*]\s+/)) {
      const ingredient = trimmedLine.replace(/^[-•*]\s+/, '').trim();
      if (ingredient) {
        ingredients.push(ingredient);
      }
    }
  }
  
  return ingredients;
};

export const calculateTotalNutrition = (recipes: Array<{ recipe: SavedRecipe, servings?: number }>): NutritionInfo => {
  const total: NutritionInfo = {
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    fiber: 0,
    sodium: 0
  };

  recipes.forEach(({ recipe }) => {
    const nutrition = parseNutritionFromRecipe(recipe.convertedRecipe);
    
    // For meal planning, use per-serving nutrition values
    // The nutrition values from parseNutritionFromRecipe are already per-serving
    // so we add them directly for meal planning totals
    total.calories += Math.round(nutrition.calories);
    total.protein += Math.round(nutrition.protein);
    total.carbs += Math.round(nutrition.carbs);
    total.fat += Math.round(nutrition.fat);
    total.fiber += Math.round(nutrition.fiber);
    total.sodium = (total.sodium || 0) + Math.round(nutrition.sodium || 0);
  });

  return total;
};

// Helper function to estimate nutrition if AI didn't provide it (fallback)
export const estimateNutritionFromIngredients = (ingredients: string[]): NutritionInfo => {
  // Basic estimation based on common ingredient categories
  let estimatedCalories = 0;
  let estimatedProtein = 0;
  let estimatedCarbs = 0;
  let estimatedFat = 0;
  let estimatedFiber = 0;

  ingredients.forEach(ingredient => {
    const lowerIngredient = ingredient.toLowerCase();
    
    // Protein sources
    if (lowerIngredient.includes('chicken') || lowerIngredient.includes('beef') || 
        lowerIngredient.includes('fish') || lowerIngredient.includes('salmon') ||
        lowerIngredient.includes('eggs')) {
      estimatedCalories += 150;
      estimatedProtein += 25;
      estimatedFat += 8;
    }
    
    // Carb sources
    if (lowerIngredient.includes('rice') || lowerIngredient.includes('pasta') ||
        lowerIngredient.includes('bread') || lowerIngredient.includes('potato')) {
      estimatedCalories += 100;
      estimatedCarbs += 25;
      estimatedFiber += 2;
    }
    
    // Vegetables
    if (lowerIngredient.includes('broccoli') || lowerIngredient.includes('spinach') ||
        lowerIngredient.includes('carrot') || lowerIngredient.includes('onion')) {
      estimatedCalories += 25;
      estimatedCarbs += 5;
      estimatedFiber += 3;
    }
    
    // Fats
    if (lowerIngredient.includes('oil') || lowerIngredient.includes('butter') ||
        lowerIngredient.includes('avocado')) {
      estimatedCalories += 120;
      estimatedFat += 14;
    }
  });

  return {
    calories: estimatedCalories,
    protein: estimatedProtein,
    carbs: estimatedCarbs,
    fat: estimatedFat,
    fiber: estimatedFiber,
    sodium: 400 // Rough estimate
  };
};