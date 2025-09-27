import { logger } from './logger';

export const cleanupRecipeFormat = (rawRecipe: string): string => {
  if (!rawRecipe) return rawRecipe;

  let cleaned = rawRecipe.trim();

  // Step 1: Check if recipe is severely incomplete (only nutrition section)
  if (cleaned.includes('## Nutrition Information') && 
      !cleaned.includes('## Ingredients') && 
      !cleaned.includes('## Instructions')) {
    logger.warn('AI generated incomplete recipe (only nutrition), providing fallback structure');
    
    // Create a basic fallback recipe structure
    cleaned = `**Recipe Name:** Recipe

## Ingredients:
- 200g main ingredient
- 1 tsp seasoning
- Salt and pepper to taste

## Instructions:
1. Prepare your ingredients according to dietary requirements.
2. Follow standard cooking methods for this type of dish.
3. Season to taste and serve.

${cleaned}`;
  }

  // Step 2: If recipe starts directly with bullet points (malformed), add structure
  if (cleaned.match(/^•\s*\d+/)) {
    const lines = cleaned.split('\n');
    const ingredientLines: string[] = [];
    const instructionLines: string[] = [];
    let currentSection = 'ingredients';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\.\s*/)) {
        currentSection = 'instructions';
        instructionLines.push(trimmed);
      } else if (trimmed.match(/^•\s*/)) {
        if (currentSection === 'ingredients') {
          ingredientLines.push(trimmed);
        }
      } else if (trimmed) {
        instructionLines.push(trimmed);
      }
    }

    // Reconstruct with proper format
    cleaned = `**Recipe Name:** Recipe

## Ingredients:
${ingredientLines.join('\n')}

## Instructions:
${instructionLines.join('\n')}

## Nutrition Information (per serving):
- Calories: 350 kcal
- Protein: 25g
- Carbohydrates: 15g
- Fat: 18g
- Fiber: 3g
- Sodium: 450mg`;
  }

  // Step 3: Clean up ingredient formatting - convert bullet points to dashes and remove brackets
  cleaned = cleaned.replace(/^•\s*(\d+(?:\.\d+)?)\s*\[[\d\w\s]*\]\s*(.+)$/gm, '- $1 $2');
  cleaned = cleaned.replace(/^•\s*([^•\n]+)$/gm, '- $1');
  
  // Also handle cases where there are standalone bullet points in sections
  cleaned = cleaned.replace(/^(\s*)•(\s*)(.+)$/gm, '$1-$2$3');
  
  // Remove descriptive brackets like "[fresh, sustainably-sourced]" from ingredients
  cleaned = cleaned.replace(/\s*\[[^\]]*\]/g, '');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // Step 4: Clean up malformed quantities like "1/2 [150g]" -> "150g"
  cleaned = cleaned.replace(/\d+\/\d+\s*\[(\d+[a-z]*)\]/g, '$1');
  cleaned = cleaned.replace(/\d+\s*\[(\d+[a-z]*)\]/g, '$1');

  // Step 5: Remove standalone brackets with weights
  cleaned = cleaned.replace(/\s*\[\d+[a-z]*\]/g, '');

  // Step 6: Ensure recipe has a name if it doesn't
  if (!cleaned.match(/^\*\*Recipe Name:/i)) {
    // Check if the first line looks like a recipe title
    const lines = cleaned.split('\n');
    let recipeTitle = 'Recipe';
    
    // Look for potential recipe title in first few lines
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i]?.trim();
      if (line && 
          line.length > 10 && 
          line.length < 100 &&
          !line.startsWith('##') &&
          !line.startsWith('•') &&
          !line.startsWith('-') &&
          !line.match(/^\d+\./) &&
          !line.toLowerCase().includes('save recipe') &&
          !line.toLowerCase().includes('ingredients') &&
          !line.toLowerCase().includes('instructions') &&
          !line.includes('kcal') &&
          (line.includes('with') || line.includes('and') || line.includes('Salmon') || line.includes('Chicken') || line.includes('Beef'))) {
        
        recipeTitle = line.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
        // Remove this line from content since it's now the title
        lines.splice(i, 1);
        break;
      }
    }
    
    // Generate a meaningful title based on ingredients if no title found
    if (recipeTitle === 'Recipe') {
      const ingredientSection = lines.find(line => line.toLowerCase().includes('salmon') || 
                                                  line.toLowerCase().includes('chicken') ||
                                                  line.toLowerCase().includes('beef'));
      if (ingredientSection) {
        if (ingredientSection.toLowerCase().includes('salmon')) {
          recipeTitle = 'Salmon Recipe';
        } else if (ingredientSection.toLowerCase().includes('chicken')) {
          recipeTitle = 'Chicken Recipe';
        } else if (ingredientSection.toLowerCase().includes('beef')) {
          recipeTitle = 'Beef Recipe';
        }
      }
    }
    
    cleaned = `**Recipe Name:** ${recipeTitle}\n\n${lines.join('\n')}`;
  }

  // Step 7: Ensure sections are properly formatted
  if (!cleaned.includes('## Ingredients:') && cleaned.includes('- ')) {
    cleaned = cleaned.replace(/^(- .+(?:\n- .+)*)$/m, '## Ingredients:\n$1');
  }

  if (!cleaned.includes('## Instructions:') && cleaned.match(/^\d+\.\s/m)) {
    cleaned = cleaned.replace(/^(\d+\.\s.+(?:\n\d+\.\s.+)*)$/m, '## Instructions:\n$1');
  }

  // Step 8: Add missing nutrition if not present
  if (!cleaned.includes('## Nutrition Information')) {
    // Extract ingredients to provide better nutrition estimates
    const ingredientSection = extractIngredientsSection(cleaned);
    const estimatedNutrition = estimateNutritionForRecipe(ingredientSection);
    
    cleaned += `\n\n## Nutrition Information (per serving):
- Calories: ${estimatedNutrition.calories} kcal
- Protein: ${estimatedNutrition.protein}g
- Carbohydrates: ${estimatedNutrition.carbs}g
- Fat: ${estimatedNutrition.fat}g
- Fiber: ${estimatedNutrition.fiber}g
- Sodium: ${estimatedNutrition.sodium}mg`;
  }

  // Step 9: Enforce strict structure and remove duplicates
  const lines = cleaned.split('\n');
  const processedLines: string[] = [];
  const seenSections = new Set<string>();
  let currentSection = '';
  let hasRecipeName = false;
  let hasIngredients = false;
  let hasInstructions = false;
  let hasNutrition = false;
  let hasTips = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines in processing but add them back later
    if (!trimmed) {
      processedLines.push('');
      continue;
    }
    
    // Handle recipe name
    if (trimmed.match(/^\*\*Recipe Name:/i)) {
      if (!hasRecipeName) {
        hasRecipeName = true;
        processedLines.push(line);
      }
      continue;
    }
    
    // Handle metadata lines
    if (trimmed.match(/^\*\*(Prep Time|Cook Time|Total Time|Servings|Dietary Requirements):/i)) {
      processedLines.push(line);
      continue;
    }
    
    // Check for section headers
    const sectionMatch = trimmed.match(/^##?\s*(Tips|Cooking Tips|Instructions|Ingredients|Nutrition Information)[\s:]*$/i);
    if (sectionMatch) {
      const sectionName = sectionMatch[1].toLowerCase().replace(/cooking /, '');
      
      // Skip duplicate sections
      if (seenSections.has(sectionName)) {
        continue;
      }
      
      seenSections.add(sectionName);
      currentSection = sectionName;
      
      // Normalize section names
      if (sectionName === 'tips') {
        processedLines.push('## Tips:');
        hasTips = true;
      } else if (sectionName === 'ingredients') {
        processedLines.push('## Ingredients:');
        hasIngredients = true;
      } else if (sectionName === 'instructions') {
        processedLines.push('## Instructions:');
        hasInstructions = true;
      } else if (sectionName === 'nutrition information') {
        processedLines.push('## Nutrition Information (per serving):');
        hasNutrition = true;
      }
      continue;
    }
    
    // Skip standalone tips/cooking tips headers that aren't ##
    if (trimmed.match(/^(Tips|Cooking Tips)[\s:]*$/i) && seenSections.has('tips')) {
      continue;
    }
    
    // Skip any leaked system instructions
    if (trimmed.match(/^CRITICAL REQUIREMENTS/i) ||
        trimmed.match(/^STRICT FORMATTING/i) ||
        trimmed.match(/^MANDATORY STRUCTURE/i) ||
        trimmed.match(/Never generate only/i) ||
        trimmed.match(/Never truncate/i) ||
        trimmed.match(/Do not include these formatting/i)) {
      continue;
    }
    
    processedLines.push(line);
  }
  
  cleaned = processedLines.join('\n');

  // Step 10: Remove any extra sections or sub-recipes
  cleaned = cleaned.replace(/^##?\s*[A-Z][^:]*Salad[\s\S]*?(?=^##|$)/gmi, '');
  cleaned = cleaned.replace(/^##?\s*[A-Z][^:]*Aioli[\s\S]*?(?=^##|$)/gmi, '');
  cleaned = cleaned.replace(/^##?\s*[A-Z][^:]*Sauce[\s\S]*?(?=^##|$)/gmi, '');
  
  // Remove any leaked formatting rules or system instructions
  cleaned = cleaned.replace(/STRICT FORMATTING RULES:[\s\S]*$/i, '').trim();
  cleaned = cleaned.replace(/CRITICAL REQUIREMENTS[\s\S]*$/i, '').trim();
  cleaned = cleaned.replace(/MANDATORY STRUCTURE[\s\S]*$/i, '').trim();
  cleaned = cleaned.replace(/EXAMPLE CORRECT FORMAT:[\s\S]*$/i, '').trim();
  
  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned;
};

// Helper function to extract ingredients section for nutrition estimation
const extractIngredientsSection = (recipe: string): string[] => {
  const lines = recipe.split('\n');
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

// Estimate nutrition based on ingredients for post-processing
const estimateNutritionForRecipe = (ingredients: string[]): { calories: number; protein: number; carbs: number; fat: number; fiber: number; sodium: number } => {
  let estimatedCalories = 0;
  let estimatedProtein = 0;
  let estimatedCarbs = 0;
  let estimatedFat = 0;
  let estimatedFiber = 0;
  let estimatedSodium = 0;

  ingredients.forEach(ingredient => {
    const lowerIngredient = ingredient.toLowerCase();
    
    // Protein sources
    if (lowerIngredient.includes('chicken') || lowerIngredient.includes('beef') || 
        lowerIngredient.includes('fish') || lowerIngredient.includes('salmon') ||
        lowerIngredient.includes('eggs') || lowerIngredient.includes('tofu')) {
      estimatedCalories += 120;
      estimatedProtein += 22;
      estimatedFat += 5;
    }
    
    // Carb sources
    if (lowerIngredient.includes('rice') || lowerIngredient.includes('pasta') ||
        lowerIngredient.includes('bread') || lowerIngredient.includes('potato') ||
        lowerIngredient.includes('quinoa') || lowerIngredient.includes('oats')) {
      estimatedCalories += 80;
      estimatedCarbs += 18;
      estimatedFiber += 2;
    }
    
    // Vegetables
    if (lowerIngredient.includes('broccoli') || lowerIngredient.includes('spinach') ||
        lowerIngredient.includes('carrot') || lowerIngredient.includes('onion') ||
        lowerIngredient.includes('pepper') || lowerIngredient.includes('tomato')) {
      estimatedCalories += 15;
      estimatedCarbs += 3;
      estimatedFiber += 2;
    }
    
    // Fats
    if (lowerIngredient.includes('oil') || lowerIngredient.includes('butter') ||
        lowerIngredient.includes('avocado') || lowerIngredient.includes('nuts')) {
      estimatedCalories += 90;
      estimatedFat += 10;
    }
    
    // Dairy
    if (lowerIngredient.includes('cheese') || lowerIngredient.includes('milk') ||
        lowerIngredient.includes('yogurt')) {
      estimatedCalories += 60;
      estimatedProtein += 6;
      estimatedFat += 3;
      estimatedSodium += 80;
    }
  });

  // Add base sodium estimate
  estimatedSodium += Math.max(200, ingredients.length * 50);

  return {
    calories: Math.max(200, estimatedCalories),
    protein: Math.max(10, estimatedProtein),
    carbs: Math.max(15, estimatedCarbs),
    fat: Math.max(8, estimatedFat),
    fiber: Math.max(3, estimatedFiber),
    sodium: Math.min(800, estimatedSodium)
  };
};

export const validateRecipeStructure = (recipe: string): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (!recipe.match(/^\*\*Recipe Name:/i)) {
    issues.push('Missing recipe name');
  }
  
  if (!recipe.includes('## Ingredients:')) {
    issues.push('Missing ingredients section');
  }
  
  if (!recipe.includes('## Instructions:')) {
    issues.push('Missing instructions section');
  }
  
  if (!recipe.includes('## Nutrition Information')) {
    issues.push('Missing nutrition information');
  }
  
  const ingredientCount = (recipe.match(/^- /gm) || []).length;
  if (ingredientCount === 0) {
    issues.push('No ingredients found');
  }
  
  const instructionCount = (recipe.match(/^\d+\./gm) || []).length;
  if (instructionCount === 0) {
    issues.push('No instructions found');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};