import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, ShoppingCart, Printer, ChevronLeft, ChevronRight, X, GripVertical, Save, RefreshCcw, Search, ChefHat, Heart, Zap, Target, TrendingUp, Activity, Flame, Apple, Sparkles } from 'lucide-react';
import type { SavedRecipe } from '../lib/validation';
import type { UserSettings } from '../types/userSettings';
import { getUserRecipes } from '../lib/firestore';
import { useToast } from './ToastContainer';
import { parseNutritionFromRecipe, calculateTotalNutrition, type NutritionInfo } from '../lib/nutritionParser';
import { MealPlanService, type MealPlan } from '../lib/mealPlanService';

interface MealPlannerCalendarProps {
  userId: string;
  userSettings?: UserSettings;
  canUseNutritionAnalysis?: boolean;
  featureAccess?: {
    recipeLimit: number;
    currentRecipeCount: number;
    currentPlan: string;
    canSaveRecipes: boolean;
    canUseAdvancedFilters: boolean;
    canUseHealthConditions: boolean;
    canUseNutritionAnalysis: boolean;
  };
}

interface ShoppingListItem {
  ingredient: string;
  quantity: string;
  recipes: string[];
  category: string;
  isChecked: boolean;
}

interface ShoppingListCategory {
  name: string;
  items: ShoppingListItem[];
  color: string;
}

// Nutrition data is now parsed from actual recipes

export const MealPlannerCalendar: React.FC<MealPlannerCalendarProps> = ({ userId, userSettings, canUseNutritionAnalysis = false, featureAccess }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [showRecipeSelector, setShowRecipeSelector] = useState<{ date: string; meal: string } | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showRecipeList, setShowRecipeList] = useState(true);
  const [loading, setLoading] = useState(true);
  const [draggedRecipe, setDraggedRecipe] = useState<SavedRecipe | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState('');
  const [recipeSortBy, setRecipeSortBy] = useState<string>('date-desc');
  const [selectedDietaryFilter, setSelectedDietaryFilter] = useState<string>('');
  const [selectedHealthFilter, setSelectedHealthFilter] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [selectedWeekType, setSelectedWeekType] = useState<string>('balanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [alignWithHealthConditions, setAlignWithHealthConditions] = useState(false);
  const [alignWithDietaryPreferences, setAlignWithDietaryPreferences] = useState(false);
  const { showSuccess, showError } = useToast();

  // Get current week dates (Monday to Sunday)
  const getWeekDates = (date: Date) => {
    const week = [];
    const currentDate = new Date(date);
    
    // Get Monday of current week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = currentDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days to Monday
    
    // Set to Monday of current week
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + mondayOffset);
    
    // Generate 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(monday);
      weekDate.setDate(monday.getDate() + i);
      week.push(weekDate);
    }
    
    return week;
  };

  const weekDates = getWeekDates(currentDate);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) {
      return 'Today';
    } else if (isTomorrow) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Load user recipes
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        const userRecipes = await getUserRecipes(userId, 100);
        setRecipes(userRecipes);
      } catch {
        showError('Failed to Load', 'Could not load your recipes');
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [userId, showError]);

  // Load meal plan for current week
  useEffect(() => {
    const loadMealPlan = async () => {
      try {
        const weekStart = MealPlanService.getMondayOfWeek(currentDate);
        const savedMealPlan = await MealPlanService.getMealPlan(userId, weekStart);
        
        if (savedMealPlan) {
          setMealPlan(savedMealPlan);
          setHasUnsavedChanges(false);
        } else {
          // No saved plan for this week, start fresh
          setMealPlan({});
          setHasUnsavedChanges(false);
        }
      } catch {
        // Continue with empty meal plan if load fails
        setMealPlan({});
        setHasUnsavedChanges(false);
      }
    };

    if (userId) {
      loadMealPlan();
    }
  }, [userId, currentDate]);

  // Save current meal plan
  const saveMealPlan = async () => {
    try {
      setSaving(true);
      const weekStart = MealPlanService.getMondayOfWeek(currentDate);
      const success = await MealPlanService.saveMealPlan(userId, weekStart, mealPlan);
      
      if (success) {
        setHasUnsavedChanges(false);
        showSuccess('Meal Plan Saved', 'Your weekly meal plan has been saved successfully');
      } else {
        showError('Save Failed', 'Could not save your meal plan. Please try again.');
      }
    } catch {
      showError('Save Failed', 'Could not save your meal plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  // Add recipe to meal plan
  const addRecipeToMeal = (dateStr: string, mealType: string, recipe: SavedRecipe) => {
    const mealLimits: { [key: string]: number } = {
      breakfast: 3,
      lunch: 5,
      dinner: 3,
      snacks: 5
    };

    setMealPlan(prev => {
      const currentDay = prev[dateStr] || {};
      const currentMeals = currentDay[mealType as keyof typeof currentDay] as SavedRecipe[] || [];
      
      // Check limits
      const limit = mealLimits[mealType] || 1;
      if (currentMeals.length >= limit) {
        const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1);
        showError(`${mealName} Limit Reached`, `You can only add up to ${limit} ${mealType} per day`);
        return prev;
      }
      
      return {
        ...prev,
        [dateStr]: {
          ...currentDay,
          [mealType]: [...currentMeals, recipe]
        }
      };
    });
    setShowRecipeSelector(null);
    setHasUnsavedChanges(true);
    showSuccess('Recipe Added', `${recipe.title} added to ${mealType}`);
  };

  // Remove recipe from meal plan
  const removeRecipeFromMeal = (dateStr: string, mealType: string, recipeIndex?: number) => {
    setMealPlan(prev => {
      const updated = { ...prev };
      if (updated[dateStr]) {
        // All meal types now support arrays
        const currentMeals = [...(updated[dateStr][mealType as keyof typeof updated[typeof dateStr]] as SavedRecipe[] || [])];
        
        if (recipeIndex !== undefined && recipeIndex < currentMeals.length) {
          // Remove specific recipe by index
          currentMeals.splice(recipeIndex, 1);
          
          if (currentMeals.length === 0) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [mealType]: _, ...restOfDay } = updated[dateStr] as Record<string, unknown>;
            if (Object.keys(restOfDay).length === 0) {
              delete updated[dateStr];
            } else {
              updated[dateStr] = restOfDay;
            }
          } else {
            updated[dateStr] = {
              ...updated[dateStr],
              [mealType]: currentMeals
            };
          }
        } else {
          // Remove entire meal type if no index specified
          const { [mealType]: _, ...restOfDay } = updated[dateStr] as Record<string, unknown>;
          if (Object.keys(restOfDay).length === 0) {
            delete updated[dateStr];
          } else {
            updated[dateStr] = restOfDay as Record<string, SavedRecipe[]>;
          }
        }
      }
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Generate shopping list
  const generateShoppingList = (): ShoppingListItem[] => {
    const ingredients: { [key: string]: ShoppingListItem } = {};

    Object.entries(mealPlan).forEach(([date, meals]) => {
      // Process regular meals (now supporting arrays)
      ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
        const recipes = meals[mealType as keyof typeof meals] as SavedRecipe[];
        if (recipes && Array.isArray(recipes)) {
          recipes.forEach(recipe => {
            processRecipeIngredients(recipe, ingredients);
          });
        }
      });
      
      // Process snacks
      if (meals.snacks) {
        meals.snacks.forEach(recipe => {
          processRecipeIngredients(recipe, ingredients);
        });
      }
    });

    return Object.values(ingredients).sort((a, b) => a.ingredient.localeCompare(b.ingredient));
  };
  
  // Helper function to categorize ingredients
  const categorizeIngredient = (ingredient: string): string => {
    const categories = {
      'Produce': ['tomato', 'onion', 'garlic', 'pepper', 'lettuce', 'spinach', 'carrot', 'celery', 'cucumber', 'avocado', 'lemon', 'lime', 'apple', 'banana', 'berry', 'fruit', 'vegetable', 'herb', 'basil', 'parsley', 'cilantro', 'mint'],
      'Meat & Seafood': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'meat', 'bacon', 'sausage'],
      'Dairy & Eggs': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'eggs', 'dairy'],
      'Pantry & Dry Goods': ['flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'rice', 'pasta', 'bread', 'cereal', 'oats', 'quinoa', 'beans', 'lentil', 'spice', 'seasoning'],
      'Frozen': ['frozen', 'ice cream'],
      'Beverages': ['water', 'juice', 'soda', 'coffee', 'tea', 'wine', 'beer', 'milk']
    };
    
    const lowerIngredient = ingredient.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerIngredient.includes(keyword))) {
        return category;
      }
    }
    return 'Other';
  };

  // Helper function to combine quantities intelligently
  const combineQuantities = (existingQty: string, newQty: string): string => {
    // Try to parse and combine numeric quantities
    const parseQuantity = (qty: string) => {
      const match = qty.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
      return match ? { amount: parseFloat(match[1]), unit: match[2].trim() } : null;
    };

    const existing = parseQuantity(existingQty);
    const newQ = parseQuantity(newQty);

    // If both have the same unit, combine them
    if (existing && newQ && existing.unit.toLowerCase() === newQ.unit.toLowerCase()) {
      const total = existing.amount + newQ.amount;
      return `${total % 1 === 0 ? Math.round(total) : total.toFixed(1)} ${existing.unit}`;
    }

    // If they're different units or can't be parsed, list them separately
    return `${existingQty} + ${newQty}`;
  };

  // Helper function to process recipe ingredients
  const processRecipeIngredients = (recipe: SavedRecipe, ingredients: { [key: string]: ShoppingListItem }) => {
    let ingredientList: string[] = [];

    // First, try to parse as JSON (new format)
    try {
      const jsonData = JSON.parse(recipe.convertedRecipe);
      if (jsonData.ingredients && Array.isArray(jsonData.ingredients)) {
        ingredientList = jsonData.ingredients.filter(ingredient => ingredient && typeof ingredient === 'string');
      }
    } catch (error) {
      // Not JSON, fall back to markdown parsing
      const lines = recipe.convertedRecipe.split('\n');
      let inIngredientsSection = false;
      const ingredientLines: string[] = [];

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check for ingredients section start
        if (trimmedLine.match(/^##?\s*Ingredients?/i) || 
            trimmedLine.match(/^\*\*Ingredients?\*\*/i)) {
          inIngredientsSection = true;
          continue;
        }

        // Check for next section (end of ingredients)
        if (inIngredientsSection && (
            trimmedLine.match(/^##?\s*[A-Za-z]/i) || 
            trimmedLine.match(/^\*\*[A-Za-z].*\*\*/i))) {
          break;
        }

        if (inIngredientsSection && trimmedLine.match(/^[-•*]\s+/)) {
          ingredientLines.push(trimmedLine.replace(/^[-•*]\s+/, '').trim());
        }
      }
      ingredientList = ingredientLines;
    }

    // Process the ingredients list
    ingredientList.forEach(ingredient => {
      if (!ingredient || ingredient.trim() === '') return;
      
      // Extract quantity and ingredient name more carefully
      // Look for patterns like "200g salmon" or "2 cups flour" or "1 large onion"
      const quantityMatch = ingredient.match(/^(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|cups?|tbsp|tsp|oz|lbs?|pieces?|large|medium|small)?)\s+(.+)$/i);
      
      if (quantityMatch) {
        const quantity = quantityMatch[1].trim();
        const name = quantityMatch[2].toLowerCase().trim();
        const displayName = quantityMatch[2].trim();
        
        // Create a cleaner key for grouping (remove descriptors like "fresh", "chopped")
        const cleanName = name
          .replace(/\b(fresh|chopped|diced|sliced|minced|finely|roughly|organic|free-range)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (ingredients[cleanName]) {
          if (!ingredients[cleanName].recipes.includes(recipe.title)) {
            ingredients[cleanName].recipes.push(recipe.title);
            ingredients[cleanName].quantity = combineQuantities(ingredients[cleanName].quantity, quantity);
          }
        } else {
          ingredients[cleanName] = {
            ingredient: displayName,
            quantity,
            recipes: [recipe.title],
            category: categorizeIngredient(displayName),
            isChecked: checkedItems.has(cleanName)
          };
        }
      } else {
        // Handle ingredients without clear quantities
        const name = ingredient.toLowerCase().trim();
        if (ingredients[name]) {
          if (!ingredients[name].recipes.includes(recipe.title)) {
            ingredients[name].recipes.push(recipe.title);
          }
        } else {
          ingredients[name] = {
            ingredient: ingredient,
            quantity: 'as needed',
            recipes: [recipe.title],
            category: categorizeIngredient(ingredient),
            isChecked: checkedItems.has(name)
          };
        }
      }
    });
  };

  // Group shopping list by category
  const getShoppingListByCategory = (): ShoppingListCategory[] => {
    const shoppingList = generateShoppingList();
    const categories: { [key: string]: ShoppingListItem[] } = {};
    
    shoppingList.forEach(item => {
      const category = item.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    });
    
    const categoryColors: { [key: string]: string } = {
      'Produce': 'bg-green-100 text-green-800',
      'Meat & Seafood': 'bg-red-100 text-red-800',
      'Dairy & Eggs': 'bg-blue-100 text-blue-800',
      'Pantry & Dry Goods': 'bg-yellow-100 text-yellow-800',
      'Frozen': 'bg-cyan-100 text-cyan-800',
      'Beverages': 'bg-purple-100 text-purple-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    
    return Object.entries(categories)
      .map(([name, items]) => ({
        name,
        items: items.sort((a, b) => a.ingredient.localeCompare(b.ingredient)),
        color: categoryColors[name] || categoryColors['Other']
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Toggle item checked state
  const toggleItemChecked = (itemName: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  // Calculate daily nutrition from actual recipes
  const getDayNutrition = (date: string): NutritionInfo => {
    const dayMeals = mealPlan[date] || {};
    const recipesToCalculate: Array<{ recipe: SavedRecipe }> = [];
    
    // Add regular meals (now supporting arrays)
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      const recipes = dayMeals[mealType as keyof typeof dayMeals] as SavedRecipe[] | undefined;
      if (recipes && Array.isArray(recipes)) {
        recipes.forEach(recipe => {
          recipesToCalculate.push({ recipe });
        });
      }
    });
    
    // Add snacks
    if (dayMeals.snacks) {
      dayMeals.snacks.forEach(snack => {
        recipesToCalculate.push({ recipe: snack });
      });
    }
    
    if (recipesToCalculate.length === 0) {
      return { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sodium: 0 };
    }

    // Calculate total nutrition from actual recipes
    return calculateTotalNutrition(recipesToCalculate);
  };

  // Filter and sort recipes for display
  const getFilteredAndSortedRecipes = () => {
    let filtered = recipes;

    // Apply search filter
    if (recipeSearchTerm) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(recipeSearchTerm.toLowerCase()) ||
        recipe.convertedRecipe.toLowerCase().includes(recipeSearchTerm.toLowerCase()) ||
        recipe.dietaryFilters.some(filter => 
          filter.toLowerCase().includes(recipeSearchTerm.toLowerCase())
        )
      );
    }

    // Apply dietary filter
    if (selectedDietaryFilter) {
      filtered = filtered.filter(recipe =>
        recipe.dietaryFilters.includes(selectedDietaryFilter)
      );
    }

    // Apply health condition filter
    if (selectedHealthFilter && userSettings?.healthConditions.includes(selectedHealthFilter)) {
      filtered = filtered.filter(recipe => {
        const recipeContent = recipe.convertedRecipe.toLowerCase();
        switch (selectedHealthFilter.toLowerCase()) {
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
            return true;
        }
      });
    }

    // Apply category filter
    if (selectedCategoryFilter) {
      filtered = filtered.filter(recipe => {
        return recipe.category === selectedCategoryFilter;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (recipeSortBy) {
        case 'name-asc':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'name-desc':
          comparison = b.title.localeCompare(a.title);
          break;
        case 'date-asc':
          comparison = (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
          break;
        case 'date-desc':
          comparison = (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
          break;
        case 'rating-asc':
          comparison = (a.title.length || 0) - (b.title.length || 0);
          break;
        case 'rating-desc':
          comparison = (b.title.length || 0) - (a.title.length || 0);
          break;
        default:
          comparison = (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
      }
      
      return comparison;
    });

    return filtered;
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, recipe: SavedRecipe) => {
    setDraggedRecipe(recipe);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dateStr: string, mealType: string) => {
    e.preventDefault();
    if (draggedRecipe) {
      addRecipeToMeal(dateStr, mealType, draggedRecipe);
      setDraggedRecipe(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedRecipe(null);
  };

  // Calculate weekly nutrition
  const getWeekNutrition = (): NutritionInfo => {
    const weekNutrition = weekDates.reduce((total, date) => {
      const dayNutrition = getDayNutrition(formatDate(date));
      return {
        calories: total.calories + dayNutrition.calories,
        carbs: total.carbs + dayNutrition.carbs,
        protein: total.protein + dayNutrition.protein,
        fat: total.fat + dayNutrition.fat,
        sugar: total.sugar + (dayNutrition.sugar || 0),
        fiber: total.fiber + dayNutrition.fiber,
        sodium: (total.sodium || 0) + (dayNutrition.sodium || 0)
      };
    }, { calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0 });

    return weekNutrition;
  };

  // Clear entire meal plan for the current week
  const clearWeeklyPlan = async () => {
    if (Object.keys(mealPlan).length === 0) {
      showError('Nothing to Clear', 'The calendar is already empty');
      return;
    }

    setIsClearing(true);

    try {
      setMealPlan({});
      setHasUnsavedChanges(true);
      showSuccess('Calendar Cleared', 'All meals have been removed from this week');
    } catch (error) {
      showError('Clear Failed', 'Could not clear the calendar. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  // Generate weekly meal plan based on selected week type
  const generateWeeklyPlan = async () => {
    if (recipes.length === 0) {
      showError('No Recipes Available', 'You need to save some recipes first before generating a meal plan');
      return;
    }

    setIsGenerating(true);

    try {
      // Get recipes filtered by week type preferences
      const filteredRecipes = getRecipesByWeekType(selectedWeekType);

      if (filteredRecipes.length < 7) {
        const filterInfo = [];
        if (alignWithHealthConditions && userSettings?.healthConditions?.length) {
          filterInfo.push(`health conditions (${userSettings.healthConditions.join(', ')})`);
        }
        if (alignWithDietaryPreferences && userSettings?.defaultDietaryFilters?.length) {
          filterInfo.push(`dietary preferences (${userSettings.defaultDietaryFilters.join(', ')})`);
        }

        const filterText = filterInfo.length > 0 ? ` and ${filterInfo.join(' and ')}` : '';
        showError('Not Enough Recipes', `You need at least 7 recipes that match the ${selectedWeekType} criteria${filterText} to generate a full week. Found ${filteredRecipes.length} matching recipes.`);
        setIsGenerating(false);
        return;
      }

      const newMealPlan: MealPlan = {};

      // Generate meals for each day
      weekDates.forEach((date, dayIndex) => {
        const dateStr = formatDate(date);
        const dayRecipes = selectDayRecipes(filteredRecipes, selectedWeekType, dayIndex);

        newMealPlan[dateStr] = {
          breakfast: dayRecipes.breakfast ? [dayRecipes.breakfast] : [],
          lunch: dayRecipes.lunch ? [dayRecipes.lunch] : [],
          dinner: dayRecipes.dinner ? [dayRecipes.dinner] : [],
          snacks: dayRecipes.snacks ? [dayRecipes.snacks] : []
        };
      });

      setMealPlan(newMealPlan);
      setHasUnsavedChanges(true);
      showSuccess('Weekly Plan Generated', `Created a ${selectedWeekType} meal plan for the week`);

    } catch (error) {
      showError('Generation Failed', 'Could not generate meal plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter recipes based on user settings alignment
  const filterRecipesByUserSettings = (recipeList: SavedRecipe[]): SavedRecipe[] => {
    let filteredRecipes = recipeList;

    // Filter by health conditions if enabled
    if (alignWithHealthConditions && userSettings?.healthConditions && userSettings.healthConditions.length > 0) {
      filteredRecipes = filteredRecipes.filter(recipe => {
        const recipeContent = recipe.convertedRecipe.toLowerCase();

        return userSettings.healthConditions.every(condition => {
          switch (condition.toLowerCase()) {
            case 'diabetes':
              return recipeContent.includes('low sugar') || recipeContent.includes('sugar-free') ||
                     recipeContent.includes('diabetic') || recipeContent.includes('low carb') ||
                     (!recipeContent.includes('high sugar') && !recipeContent.includes('dessert'));

            case 'heart disease':
              return recipeContent.includes('low sodium') || recipeContent.includes('heart healthy') ||
                     recipeContent.includes('low cholesterol') || recipeContent.includes('lean') ||
                     (!recipeContent.includes('fried') && !recipeContent.includes('butter'));

            case 'hypertension':
              return recipeContent.includes('low sodium') || recipeContent.includes('no salt') ||
                     recipeContent.includes('dash diet') || !recipeContent.includes('high sodium');

            case 'celiac disease':
              return recipeContent.includes('gluten-free') || recipeContent.includes('gluten free') ||
                     recipe.dietaryFilters.includes('Gluten-Free') ||
                     (!recipeContent.includes('wheat') && !recipeContent.includes('flour') && !recipeContent.includes('bread'));

            case 'kidney disease':
              return recipeContent.includes('low protein') || recipeContent.includes('kidney friendly') ||
                     recipeContent.includes('low potassium') || recipeContent.includes('low phosphorus');

            default:
              return true; // If condition not recognized, don't filter
          }
        });
      });
    }

    // Filter by dietary preferences if enabled
    if (alignWithDietaryPreferences && userSettings?.defaultDietaryFilters && userSettings.defaultDietaryFilters.length > 0) {
      filteredRecipes = filteredRecipes.filter(recipe => {
        // Recipe must match at least one of the user's dietary preferences
        return userSettings.defaultDietaryFilters.some(preference =>
          recipe.dietaryFilters.includes(preference)
        );
      });
    }

    return filteredRecipes;
  };

  // Filter and sort recipes based on week type for optimal compliance
  const getRecipesByWeekType = (weekType: string): SavedRecipe[] => {
    let filteredRecipes: SavedRecipe[] = [];

    switch (weekType) {
      case 'protein-focused':
        // Get all recipes and sort by protein content (highest first)
        filteredRecipes = recipes
          .map(recipe => ({
            ...recipe,
            nutrition: parseNutritionFromRecipe(recipe.convertedRecipe)
          }))
          .filter(recipe => {
            const content = recipe.convertedRecipe.toLowerCase();
            return recipe.nutrition.protein > 15 || content.includes('protein') || content.includes('chicken') ||
                   content.includes('beef') || content.includes('fish') || content.includes('eggs') ||
                   content.includes('meat') || recipe.dietaryFilters.includes('High-Protein');
          })
          .sort((a, b) => b.nutrition.protein - a.nutrition.protein); // Highest protein first
        break;

      case 'low-carb':
        // Sort by lowest carb content
        filteredRecipes = recipes
          .map(recipe => ({
            ...recipe,
            nutrition: parseNutritionFromRecipe(recipe.convertedRecipe)
          }))
          .filter(recipe => {
            const content = recipe.convertedRecipe.toLowerCase();
            return recipe.nutrition.carbs < 35 || content.includes('low carb') || content.includes('keto') ||
                   recipe.dietaryFilters.includes('Keto') || recipe.dietaryFilters.includes('Low-Carb');
          })
          .sort((a, b) => a.nutrition.carbs - b.nutrition.carbs); // Lowest carbs first
        break;

      case 'vegetarian':
        // Prioritize vegan, then vegetarian
        filteredRecipes = recipes
          .filter(recipe =>
            recipe.dietaryFilters.includes('Vegetarian') || recipe.dietaryFilters.includes('Vegan')
          )
          .sort((a, b) => {
            if (a.dietaryFilters.includes('Vegan') && !b.dietaryFilters.includes('Vegan')) return -1;
            if (!a.dietaryFilters.includes('Vegan') && b.dietaryFilters.includes('Vegan')) return 1;
            return 0;
          });
        break;

      case 'comfort-food':
        // Prioritize by calorie content and comfort food keywords
        filteredRecipes = recipes
          .map(recipe => ({
            ...recipe,
            nutrition: parseNutritionFromRecipe(recipe.convertedRecipe),
            comfortScore: getComfortFoodScore(recipe)
          }))
          .filter(recipe => recipe.comfortScore > 0)
          .sort((a, b) => b.comfortScore - a.comfortScore); // Highest comfort score first
        break;

      case 'quick-easy':
        // Prioritize by quick cooking indicators
        filteredRecipes = recipes
          .map(recipe => ({
            ...recipe,
            quickScore: getQuickEasyScore(recipe)
          }))
          .filter(recipe => recipe.quickScore > 0)
          .sort((a, b) => b.quickScore - a.quickScore); // Highest quick score first
        break;

      case 'balanced':
      default:
        // For balanced, ensure variety across nutrition profiles
        filteredRecipes = [...recipes].sort(() => Math.random() - 0.5);
        break;
    }

    // Apply user settings filtering to the final result
    return filterRecipesByUserSettings(filteredRecipes);
  };

  // Helper function to score comfort food recipes
  const getComfortFoodScore = (recipe: SavedRecipe): number => {
    const content = recipe.convertedRecipe.toLowerCase();
    let score = 0;

    if (content.includes('comfort')) score += 10;
    if (content.includes('pasta')) score += 8;
    if (content.includes('soup')) score += 8;
    if (content.includes('casserole')) score += 9;
    if (content.includes('stew')) score += 8;
    if (content.includes('cheese')) score += 6;
    if (content.includes('cream')) score += 6;
    if (content.includes('hearty')) score += 7;
    if (content.includes('homestyle') || content.includes('home-style')) score += 8;
    if (recipe.category === 'main-dish') score += 5;

    const nutrition = parseNutritionFromRecipe(recipe.convertedRecipe);
    if (nutrition.calories > 400) score += 3; // Higher calorie = more comfort

    return score;
  };

  // Helper function to score quick and easy recipes
  const getQuickEasyScore = (recipe: SavedRecipe): number => {
    const content = recipe.convertedRecipe.toLowerCase();
    let score = 0;

    if (content.includes('quick')) score += 10;
    if (content.includes('easy')) score += 9;
    if (content.includes('simple')) score += 8;
    if (content.includes('15 min') || content.includes('15-min')) score += 15;
    if (content.includes('20 min') || content.includes('20-min')) score += 12;
    if (content.includes('30 min') || content.includes('30-min')) score += 8;
    if (content.includes('one pot') || content.includes('one-pot')) score += 10;
    if (content.includes('microwave')) score += 12;
    if (content.includes('no cook') || content.includes('no-cook')) score += 15;
    if (content.includes('instant')) score += 10;
    if (content.includes('fast')) score += 8;

    return score;
  };

  // Select specific recipes for a day based on week type
  const selectDayRecipes = (availableRecipes: SavedRecipe[], weekType: string, dayIndex: number) => {
    // For protein-focused and low-carb, take from the top sorted recipes
    // For others, add some randomness but still favor the better-scoring recipes
    const shouldPrioritizeBest = ['protein-focused', 'low-carb'].includes(weekType);

    let recipesToUse: SavedRecipe[];
    if (shouldPrioritizeBest) {
      // Take the best recipes from the sorted list
      recipesToUse = availableRecipes;
    } else {
      // Take the top 70% of sorted recipes and shuffle them for variety
      const topCount = Math.ceil(availableRecipes.length * 0.7);
      const topRecipes = availableRecipes.slice(0, topCount);
      recipesToUse = [...topRecipes].sort(() => Math.random() - 0.5);
    }

    // Separate by meal type preferences
    const breakfastRecipes = recipesToUse.filter(recipe => {
      const content = recipe.convertedRecipe.toLowerCase();
      return content.includes('breakfast') || content.includes('morning') ||
             content.includes('oatmeal') || content.includes('cereal') || content.includes('toast') ||
             content.includes('pancake') || content.includes('waffle') || content.includes('egg');
    });

    const lunchRecipes = recipesToUse.filter(recipe => {
      const content = recipe.convertedRecipe.toLowerCase();
      return content.includes('lunch') || content.includes('salad') || content.includes('sandwich') ||
             content.includes('wrap') || recipe.category === 'appetizer' || content.includes('bowl');
    });

    const dinnerRecipes = recipesToUse.filter(recipe => {
      const content = recipe.convertedRecipe.toLowerCase();
      return content.includes('dinner') || content.includes('main') || recipe.category === 'main-dish' ||
             content.includes('entree') || content.includes('entrée');
    });

    const snackRecipes = recipesToUse.filter(recipe => {
      const content = recipe.convertedRecipe.toLowerCase();
      return content.includes('snack') || content.includes('appetizer') || recipe.category === 'appetizer' ||
             content.includes('bite') || content.includes('finger food');
    });

    // Smart selection: for protein-focused, prefer from top of list; others get variety
    const getRecipeAtIndex = (recipeList: SavedRecipe[], index: number) => {
      if (recipeList.length === 0) return null;

      if (shouldPrioritizeBest) {
        // Cycle through the best recipes
        return recipeList[index % recipeList.length];
      } else {
        // Add some randomness but still favor earlier (better) recipes
        const adjustedIndex = Math.floor(index * 0.7) % recipeList.length;
        return recipeList[adjustedIndex];
      }
    };

    // Use fallback with intelligent distribution
    const getFallbackRecipe = (offset: number) => {
      if (recipesToUse.length === 0) return null;

      if (shouldPrioritizeBest) {
        return recipesToUse[(dayIndex + offset) % recipesToUse.length];
      } else {
        // Pick from top recipes with some variety
        const index = (dayIndex + offset) % Math.min(recipesToUse.length, 20);
        return recipesToUse[index];
      }
    };

    return {
      breakfast: getRecipeAtIndex(breakfastRecipes, dayIndex) || getFallbackRecipe(0),
      lunch: getRecipeAtIndex(lunchRecipes, dayIndex) || getFallbackRecipe(1),
      dinner: getRecipeAtIndex(dinnerRecipes, dayIndex) || getFallbackRecipe(2),
      snacks: getRecipeAtIndex(snackRecipes, dayIndex) || getFallbackRecipe(3)
    };
  };

  // Enhanced nutrition analysis functions
  const getDailyAverage = (weekNutrition: NutritionInfo) => {
    const daysWithMeals = weekDates.filter(date => {
      const dateStr = formatDate(date);
      const dayMeals = mealPlan[dateStr] || {};
      return Object.values(dayMeals).some(meals => meals && Array.isArray(meals) && meals.length > 0);
    }).length;

    if (daysWithMeals === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 };

    return {
      calories: Math.round(weekNutrition.calories / daysWithMeals),
      protein: Math.round(weekNutrition.protein / daysWithMeals),
      carbs: Math.round(weekNutrition.carbs / daysWithMeals),
      fat: Math.round(weekNutrition.fat / daysWithMeals),
      fiber: Math.round(weekNutrition.fiber / daysWithMeals),
      sodium: Math.round((weekNutrition.sodium || 0) / daysWithMeals)
    };
  };

  const getMacroPercentages = (nutrition: NutritionInfo) => {
    const totalCalories = nutrition.calories;
    if (totalCalories === 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0 };

    const proteinCals = nutrition.protein * 4;
    const carbsCals = nutrition.carbs * 4;
    const fatCals = nutrition.fat * 9;

    return {
      proteinPct: Math.round((proteinCals / totalCalories) * 100),
      carbsPct: Math.round((carbsCals / totalCalories) * 100),
      fatPct: Math.round((fatCals / totalCalories) * 100)
    };
  };

  const getNutritionRecommendations = (dailyAvg: any) => {
    const recommendations = [];

    if (dailyAvg.calories < 1200) {
      recommendations.push({ type: 'warning', text: 'Daily calories may be too low for most adults' });
    } else if (dailyAvg.calories > 2500) {
      recommendations.push({ type: 'info', text: 'High calorie intake - ensure adequate activity level' });
    }

    if (dailyAvg.protein < 50) {
      recommendations.push({ type: 'suggestion', text: 'Consider adding more protein sources' });
    }

    if (dailyAvg.fiber < 25) {
      recommendations.push({ type: 'suggestion', text: 'Increase fiber with more fruits and vegetables' });
    }

    if ((dailyAvg.sodium || 0) > 2300) {
      recommendations.push({ type: 'warning', text: 'High sodium intake - consider reducing salt' });
    }

    return recommendations;
  };

  // Print shopping list (only unchecked items)
  const printShoppingList = () => {
    const categorizedList = getShoppingListByCategory();
    const uncheckedItems: ShoppingListItem[] = [];
    
    // Collect all unchecked items
    categorizedList.forEach(category => {
      category.items.forEach(item => {
        const itemKey = item.ingredient.toLowerCase();
        if (!checkedItems.has(itemKey)) {
          uncheckedItems.push(item);
        }
      });
    });
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Shopping List - Week of ${weekDates[0].toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; }
              h1 { color: #16a34a; border-bottom: 3px solid #16a34a; padding-bottom: 15px; margin-bottom: 20px; }
              .header-info { color: #6b7280; font-size: 0.9rem; margin-bottom: 25px; }
              .category { margin-bottom: 25px; }
              .category-title { 
                font-size: 1.1rem; 
                font-weight: bold; 
                color: #374151; 
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #d1d5db;
              }
              .item { 
                margin: 8px 0; 
                padding: 12px; 
                background: #f9fafb; 
                border-radius: 6px;
                border-left: 4px solid #16a34a;
              }
              .quantity { 
                font-weight: bold; 
                color: #1f2937; 
                font-size: 1rem;
              }
              .recipes { 
                font-size: 0.85rem; 
                color: #6b7280; 
                margin-top: 6px;
                font-style: italic;
              }
              .summary {
                margin-top: 30px;
                padding: 15px;
                background: #f0f9ff;
                border-radius: 6px;
                border-left: 4px solid #0ea5e9;
              }
              .checkbox { 
                display: inline-block; 
                width: 15px; 
                height: 15px; 
                border: 2px solid #d1d5db; 
                border-radius: 3px; 
                margin-right: 10px;
                vertical-align: middle;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                color: #9ca3af;
                font-size: 0.8rem;
                border-top: 1px solid #e5e7eb;
                padding-top: 15px;
              }
            </style>
          </head>
          <body>
            <h1>🛒 Shopping List</h1>
            <div class="header-info">
              <strong>Week:</strong> ${weekDates[0].toLocaleDateString()} - ${weekDates[6].toLocaleDateString()}<br>
              <strong>Items to buy:</strong> ${uncheckedItems.length}
            </div>
            
            ${uncheckedItems.length === 0 ? 
              '<div style="text-align: center; padding: 40px; color: #6b7280;"><h3>🎉 All items completed!</h3><p>Nothing left to buy for this week.</p></div>' :
              (() => {
                // Group unchecked items by category
                const categorizedUnchecked: { [key: string]: ShoppingListItem[] } = {};
                uncheckedItems.forEach(item => {
                  if (!categorizedUnchecked[item.category]) {
                    categorizedUnchecked[item.category] = [];
                  }
                  categorizedUnchecked[item.category].push(item);
                });
                
                return Object.entries(categorizedUnchecked)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([categoryName, items]) => `
                    <div class="category">
                      <div class="category-title">${categoryName} (${items.length} items)</div>
                      ${items.map(item => `
                        <div class="item">
                          <span class="checkbox"></span>
                          <span class="quantity">${item.quantity} ${item.ingredient}</span>
                          <div class="recipes">For: ${item.recipes.join(', ')}</div>
                        </div>
                      `).join('')}
                    </div>
                  `).join('');
              })()
            }
            
            <div class="summary">
              <strong>Shopping Summary:</strong><br>
              Total categories: ${Object.keys(categorizedList.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {})).length}<br>
              Items to buy: ${uncheckedItems.length}<br>
              Items already completed: ${checkedItems.size}
            </div>
            
            <div class="footer">
              Generated by Recipe Revamped<br>
              ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="ml-4 text-gray-600">Loading meal planner...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meal Planning</h1>
            <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Plan your weekly meals and generate shopping lists</p>
            <p className="text-sm text-gray-600 sm:hidden">Weekly meal planner</p>
          </div>
        </div>
      </div>

      {/* Enhanced Weekly Nutrition Summary - Only for Master Chef+ plans */}
      {canUseNutritionAnalysis ? (
        <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 sm:p-6 rounded-xl border border-green-200 shadow-lg">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mr-2" />
              Weekly Nutrition Analytics
            </h3>
            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              Advanced Analysis
            </div>
          </div>

          {Object.keys(mealPlan).length > 0 ? (
            (() => {
              const weekNutrition = getWeekNutrition();
              const dailyAvg = getDailyAverage(weekNutrition);
              const macroPercentages = getMacroPercentages(dailyAvg);
              const recommendations = getNutritionRecommendations(dailyAvg);

              return (
                <div className="space-y-6">
                  {/* Primary Nutrition Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-l-orange-500 shadow-sm">
                      <div className="flex items-center mb-2">
                        <Flame className="w-4 h-4 text-orange-500 mr-2" />
                        <span className="text-xs sm:text-sm font-medium text-gray-600">Daily Avg Calories</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">{dailyAvg.calories}</div>
                      <div className="text-xs text-gray-500">kcal/day</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-l-blue-500 shadow-sm">
                      <div className="flex items-center mb-2">
                        <Zap className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-xs sm:text-sm font-medium text-gray-600">Protein</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">{dailyAvg.protein}g</div>
                      <div className="text-xs text-green-600 font-medium">{macroPercentages.proteinPct}% of calories</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-l-green-500 shadow-sm">
                      <div className="flex items-center mb-2">
                        <Apple className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-xs sm:text-sm font-medium text-gray-600">Carbs</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">{dailyAvg.carbs}g</div>
                      <div className="text-xs text-green-600 font-medium">{macroPercentages.carbsPct}% of calories</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 sm:p-4 border-l-4 border-l-purple-500 shadow-sm">
                      <div className="flex items-center mb-2">
                        <Target className="w-4 h-4 text-purple-500 mr-2" />
                        <span className="text-xs sm:text-sm font-medium text-gray-600">Fat</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">{dailyAvg.fat}g</div>
                      <div className="text-xs text-green-600 font-medium">{macroPercentages.fatPct}% of calories</div>
                    </div>
                  </div>

                  {/* Macro Distribution Visualization */}
                  <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Macronutrient Distribution</h4>
                    <div className="flex rounded-lg overflow-hidden h-3 mb-3">
                      <div
                        className="bg-blue-500"
                        style={{ width: `${macroPercentages.proteinPct}%` }}
                        title={`Protein: ${macroPercentages.proteinPct}%`}
                      />
                      <div
                        className="bg-green-500"
                        style={{ width: `${macroPercentages.carbsPct}%` }}
                        title={`Carbs: ${macroPercentages.carbsPct}%`}
                      />
                      <div
                        className="bg-purple-500"
                        style={{ width: `${macroPercentages.fatPct}%` }}
                        title={`Fat: ${macroPercentages.fatPct}%`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Protein {macroPercentages.proteinPct}%</span>
                      <span>Carbs {macroPercentages.carbsPct}%</span>
                      <span>Fat {macroPercentages.fatPct}%</span>
                    </div>
                  </div>

                  {/* Additional Nutrition Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <div className="text-sm font-medium text-gray-600 mb-1">Fiber</div>
                      <div className="text-lg font-bold text-gray-900">{dailyAvg.fiber}g</div>
                      <div className="text-xs text-gray-500">per day</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <div className="text-sm font-medium text-gray-600 mb-1">Sodium</div>
                      <div className="text-lg font-bold text-gray-900">{dailyAvg.sodium}mg</div>
                      <div className="text-xs text-gray-500">per day</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 text-center shadow-sm col-span-2 sm:col-span-1">
                      <div className="text-sm font-medium text-gray-600 mb-1">Weekly Total</div>
                      <div className="text-lg font-bold text-gray-900">{Math.round(weekNutrition.calories)}</div>
                      <div className="text-xs text-gray-500">calories</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                      <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        Nutrition Insights
                      </h4>
                      <div className="space-y-2">
                        {recommendations.map((rec, index) => (
                          <div key={index} className={`text-xs sm:text-sm flex items-start ${
                            rec.type === 'warning' ? 'text-red-700' :
                            rec.type === 'info' ? 'text-blue-700' : 'text-amber-700'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mt-2 mr-2 flex-shrink-0" />
                            {rec.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-600 mb-2">No Nutrition Data Yet</h4>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Add meals to your weekly plan to see comprehensive nutrition analytics, macro breakdowns, and personalized recommendations.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6 text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
              <Heart className="h-6 w-6 text-orange-600" />
            </div>
            <h4 className="text-lg font-bold text-orange-800 mb-2">
              Premium Nutrition Analysis
            </h4>
            <p className="text-orange-700 max-w-md mx-auto leading-relaxed">
              Unlock detailed weekly nutrition tracking with Master Chef or Enterprise plan. Get comprehensive nutritional insights for your meal plans.
            </p>
          </div>
          <button 
            data-upgrade-plan
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Upgrade for Nutrition Analysis
          </button>
        </div>
      )}

      {/* Recipe List Sidebar - Hidden on mobile */}
      {showRecipeList && (
        <div className="hidden md:block mb-6 bg-white rounded-lg shadow border">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <GripVertical className="w-5 h-5 mr-2 text-gray-400" />
              Your Recipes - Drag to Calendar
            </h3>
            <button
              onClick={() => setShowRecipeList(!showRecipeList)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search and Sort Controls */}
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
            {/* First Row: Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              {/* Search Input - 2/3 width on desktop */}
              <div className="relative flex-1 sm:flex-[2]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={recipeSearchTerm}
                  onChange={(e) => setRecipeSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
              
              {/* Sort By - 1/3 width on desktop */}
              <div className="sm:flex-1">
                <select
                  value={recipeSortBy}
                  onChange={(e) => setRecipeSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="date-asc">📅 Date (Oldest First)</option>
                  <option value="date-desc">📅 Date (Newest First)</option>
                  <option value="name-asc">📝 Name (A-Z)</option>
                  <option value="name-desc">📝 Name (Z-A)</option>
                  <option value="rating-asc">⭐ Rating (Lowest First)</option>
                  <option value="rating-desc">⭐ Rating (Highest First)</option>
                </select>
              </div>
            </div>
            
            {/* Second Row: Filters - Each takes 1/3 width on desktop */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Dietary Filter - 1/3 width */}
              <div className="sm:flex-1">
                <select
                  value={selectedDietaryFilter}
                  onChange={(e) => setSelectedDietaryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="">All Dietary Preferences</option>
                  <option value="Vegetarian">🌱 Vegetarian</option>
                  <option value="Vegan">🥬 Vegan</option>
                  <option value="Gluten-Free">🌾 Gluten-Free</option>
                  <option value="Dairy-Free">🥛 Dairy-Free</option>
                  <option value="Keto">🥓 Keto</option>
                  <option value="Paleo">🥩 Paleo</option>
                  <option value="Low-Carb">🍖 Low-Carb</option>
                  <option value="High-Protein">💪 High-Protein</option>
                </select>
              </div>
              
              {/* Health Condition Filter - Only for Master Chef+ plans */}
              {featureAccess?.canUseHealthConditions && (
                <div className="sm:flex-1">
                  <select
                    value={selectedHealthFilter}
                    onChange={(e) => setSelectedHealthFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                  >
                    <option value="">All Health Conditions</option>
                    <option value="Diabetes">🩺 Diabetes-Friendly</option>
                    <option value="Heart Disease">❤️ Heart-Healthy</option>
                    <option value="Hypertension">💓 Low-Sodium</option>
                    <option value="Celiac Disease">🌾 Celiac-Safe</option>
                    <option value="Kidney Disease">🫘 Kidney-Friendly</option>
                  </select>
                </div>
              )}
              
              {/* Category Filter - 1/3 width */}
              <div className="sm:flex-1">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="appetizer">🥗 Appetizers</option>
                  <option value="main-dish">🍽️ Main Dishes</option>
                  <option value="side-dish">🥘 Side Dishes</option>
                  <option value="dessert">🍰 Desserts</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-3 sm:p-4 max-h-48 sm:max-h-60 overflow-y-auto">
            {(() => {
              const filteredRecipes = getFilteredAndSortedRecipes();
              return filteredRecipes.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  {recipes.length === 0 ? (
                    <p>No saved recipes found. Create some recipes first!</p>
                  ) : (
                    <div>
                      <p>No recipes match your search.</p>
                      <button
                        onClick={() => setRecipeSearchTerm('')}
                        className="mt-2 text-green-600 hover:text-green-700 text-sm underline"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-xs text-gray-500 mb-3">
                    Showing {filteredRecipes.length} of {recipes.length} recipes
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                    {filteredRecipes.map(recipe => (
                      <div
                        key={recipe.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, recipe)}
                        onDragEnd={handleDragEnd}
                        className="bg-white rounded-lg border border-gray-200 hover:border-green-500 hover:shadow-md transition-all cursor-move shadow-sm overflow-hidden group"
                      >
                        {/* Recipe Image */}
                        <div className="relative h-16 sm:h-20 bg-gradient-to-br from-green-400 to-blue-500">
                          {recipe.imageUrl ? (
                            <img 
                              src={recipe.imageUrl} 
                              alt={recipe.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ChefHat className="w-4 h-4 sm:w-6 sm:h-6 text-white opacity-80" />
                            </div>
                          )}
                        </div>
                        
                        {/* Recipe Details */}
                        <div className="p-1.5 sm:p-2">
                          <div className="font-medium text-gray-900 text-xs sm:text-sm truncate" title={recipe.title}>
                            {recipe.title}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 truncate hidden sm:block">
                            {recipe.dietaryFilters.slice(0, 2).join(', ')}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ~{Math.round(parseNutritionFromRecipe(recipe.convertedRecipe).calories)} kcal
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {!showRecipeList && (
        <div className="hidden md:block mb-4">
          <button
            onClick={() => setShowRecipeList(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <GripVertical className="w-4 h-4 mr-2" />
            Show Recipe List
          </button>
        </div>
      )}

      {/* Weekly Recipe Generator */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900">Generate Weekly Menu</h3>
              <p className="text-sm text-purple-700">Auto-fill your calendar with recipes based on your preferences</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left Side: Week Selector and Settings Toggles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Health Conditions and Dietary Preferences */}
              <div className="flex flex-col gap-2">
                {userSettings?.healthConditions && userSettings.healthConditions.length > 0 && (
                  <label className="flex items-center text-sm cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={alignWithHealthConditions}
                      onChange={(e) => setAlignWithHealthConditions(e.target.checked)}
                      className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-purple-300 rounded"
                    />
                    <span className="text-purple-800 font-medium">🩺 Health Conditions</span>
                    <span className="ml-1 text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">
                      {userSettings.healthConditions.length}
                    </span>
                  </label>
                )}

                {userSettings?.defaultDietaryFilters && userSettings.defaultDietaryFilters.length > 0 && (
                  <label className="flex items-center text-sm cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={alignWithDietaryPreferences}
                      onChange={(e) => setAlignWithDietaryPreferences(e.target.checked)}
                      className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-purple-300 rounded"
                    />
                    <span className="text-purple-800 font-medium">🌱 Dietary Preferences</span>
                    <span className="ml-1 text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">
                      {userSettings.defaultDietaryFilters.length}
                    </span>
                  </label>
                )}

                {(!userSettings?.healthConditions || userSettings.healthConditions.length === 0) &&
                 (!userSettings?.defaultDietaryFilters || userSettings.defaultDietaryFilters.length === 0) && (
                  <div className="text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                    💡 Set health conditions and dietary preferences in Settings
                  </div>
                )}
              </div>

            </div>

            {/* Right Side: Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Week Type Selector */}
              <select
                value={selectedWeekType}
                onChange={(e) => setSelectedWeekType(e.target.value)}
                className="px-3 py-2 border border-purple-300 rounded-lg bg-white text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium min-w-[140px]"
              >
                <option value="balanced">🌟 Balanced</option>
                <option value="protein-focused">💪 Protein</option>
                <option value="low-carb">🥩 Low Carb</option>
                <option value="vegetarian">🌱 Vegetarian</option>
                <option value="comfort-food">🍲 Comfort</option>
                <option value="quick-easy">⚡ Quick</option>
              </select>

              {/* Clear Calendar Button */}
              <button
                onClick={clearWeeklyPlan}
                disabled={isClearing || Object.keys(mealPlan).length === 0}
                className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
                  isClearing || Object.keys(mealPlan).length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md transform hover:scale-105'
                }`}
              >
                {isClearing ? (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-1 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </>
                )}
              </button>

              {/* Generate Button */}
              <button
                onClick={generateWeeklyPlan}
                disabled={isGenerating || recipes.length === 0}
                className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
                  isGenerating || recipes.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md transform hover:scale-105'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {recipes.length === 0 && (
          <div className="mt-3 text-center">
            <p className="text-sm text-purple-600 bg-purple-100 rounded-lg px-3 py-2 inline-block">
              💡 Save some recipes first to generate meal plans
            </p>
          </div>
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow mb-6">
        <button
          onClick={() => navigateWeek('prev')}
          className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous Week
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-sm text-gray-600">
            {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
          </p>
        </div>

        <button
          onClick={() => navigateWeek('next')}
          className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Next Week
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Mobile Calendar View */}
        <div className="md:hidden">
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const dayMeals = mealPlan[dateStr] || {};
            const isToday = date.toDateString() === new Date().toDateString();
            const dayNutrition = getDayNutrition(dateStr);
            
            return (
              <div key={dateStr} className="border-b border-gray-200 last:border-b-0">
                {/* Day Header */}
                <div className={`p-4 border-b border-gray-200 ${
                  isToday ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-bold ${isToday ? 'text-green-700' : 'text-gray-900'}`}>
                        {formatDisplayDate(date)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    {dayNutrition.calories > 0 && (
                      <div className="text-xs text-white bg-green-500 px-2 py-1 rounded-full font-medium">
                        {Math.round(dayNutrition.calories)} kcal
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Mobile Meals */}
                <div className="p-3 space-y-3">
                  {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
                    const mealIcons = { breakfast: '🥞', lunch: '🥗', dinner: '🍽️', snacks: '🍿' };
                    const recipes = dayMeals[mealType as keyof typeof dayMeals] as SavedRecipe[] | undefined;
                    
                    return (
                      <div key={mealType} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <span className="mr-2">{mealIcons[mealType as keyof typeof mealIcons]}</span>
                            {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                          </h4>
                          <button
                            onClick={() => setShowRecipeSelector({ date: dateStr, meal: mealType })}
                            className="text-green-600 hover:text-green-700 bg-green-100 hover:bg-green-200 rounded-full p-1 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {recipes && recipes.length > 0 ? (
                          <div className="space-y-2">
                            {recipes.map((recipe, index) => (
                              <div key={`${recipe.id}-${index}`} className="bg-white rounded p-2 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                                    <ChefHat className="w-3 h-3 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 truncate">{recipe.title}</p>
                                    <p className="text-xs text-gray-600">
                                      ~{Math.round(parseNutritionFromRecipe(recipe.convertedRecipe).calories)} kcal
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeRecipeFromMeal(dateStr, mealType, index)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-sm text-gray-500">No meals planned</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Desktop Grid Header */}
        <div className="hidden md:grid grid-cols-8 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="p-5 bg-gradient-to-br from-green-500 to-blue-500 border-r border-gray-200">
            <div className="font-bold text-white text-center flex items-center justify-center">
              <Calendar className="w-5 h-5 mr-2" />
              Meals
            </div>
          </div>
          {weekDates.map((date, index) => {
            const dateStr = formatDate(date);
            const dayNutrition = getDayNutrition(dateStr);
            const isToday = date.toDateString() === new Date().toDateString();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            return (
              <div key={dateStr} className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
                isToday 
                  ? 'bg-gradient-to-br from-green-100 to-blue-100 border-l-4 border-l-green-500' 
                  : isWeekend 
                    ? 'bg-gradient-to-br from-purple-50 to-pink-50' 
                    : 'bg-white'
              }`}>
                <div className={`font-bold ${isToday ? 'text-green-700' : 'text-gray-900'}`}>
                  {formatDisplayDate(date)}
                </div>
                <div className={`text-sm mt-1 ${isToday ? 'text-green-600' : 'text-gray-600'}`}>
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                {dayNutrition.calories > 0 && (
                  <div className="text-xs text-white bg-green-500 px-2 py-1 rounded-full mt-2 font-medium inline-block">
                    {Math.round(dayNutrition.calories)} kcal
                  </div>
                )}
                {isToday && (
                  <div className="text-xs text-green-700 font-medium mt-1">Today</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Grid Body */}
        <div className="hidden md:block">
        {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType, mealIndex) => {
          const mealIcons = {
            breakfast: '🥞',
            lunch: '🥗', 
            dinner: '🍽️',
            snacks: '🍿'
          };
          const mealColors = {
            breakfast: 'bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-l-yellow-400',
            lunch: 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-400',
            dinner: 'bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-l-purple-400',
            snacks: 'bg-gradient-to-r from-pink-50 to-rose-50 border-l-4 border-l-pink-400'
          };
          
          return (
            <div key={mealType} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0 hover:bg-gray-25 transition-colors">
              {/* Meal Label */}
              <div className={`p-5 border-r border-gray-200 flex items-center justify-center ${mealColors[mealType as keyof typeof mealColors]}`}>
                <div className="text-center">
                  <div className="text-2xl mb-1">{mealIcons[mealType as keyof typeof mealIcons]}</div>
                  <div className="font-bold text-gray-900 capitalize text-sm">
                    {mealType === 'snacks' ? 'Snacks' : mealType}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {mealType === 'lunch' ? 'Up to 5' : mealType === 'snacks' ? 'Up to 5' : 'Up to 3'}
                  </div>
                </div>
              </div>
            
            {/* Day Columns */}
            {weekDates.map((date, dayIndex) => {
              const dateStr = formatDate(date);
              const dayMeals = mealPlan[dateStr] || {};
              
              const isToday = date.toDateString() === new Date().toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              
              return (
                <div 
                  key={`${dateStr}-${mealType}`}
                  className={`p-4 border-r border-gray-200 last:border-r-0 min-h-28 transition-all duration-200 ${
                    isToday 
                      ? 'bg-gradient-to-br from-green-25 to-blue-25 border-2 border-green-200' 
                      : isWeekend 
                        ? 'bg-gradient-to-br from-purple-25 to-pink-25' 
                        : 'bg-gray-25 hover:bg-gray-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dateStr, mealType)}
                >
                  {mealType === 'snacks' ? (
                    // Snacks rendering
                    <div className="space-y-2">
                      {dayMeals.snacks && dayMeals.snacks.length > 0 && (
                        dayMeals.snacks.map((snack, snackIndex) => (
                          <div key={`${snack.id}-${snackIndex}`} className="relative group">
                            <div className="bg-orange-50 border border-orange-200 rounded p-2 hover:bg-orange-100 transition-colors">
                              {/* Snack Image */}
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="relative w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded flex-shrink-0">
                                  {snack.imageUrl ? (
                                    <img 
                                      src={snack.imageUrl} 
                                      alt={snack.title}
                                      className="w-full h-full object-cover rounded"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <ChefHat className="w-4 h-4 text-white opacity-80" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-800 text-sm truncate" title={snack.title}>
                                    {snack.title}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                ~{Math.round(parseNutritionFromRecipe(snack.convertedRecipe).calories)} kcal/serving
                              </div>
                              <button
                                onClick={() => removeRecipeFromMeal(dateStr, 'snacks', snackIndex)}
                                className="absolute top-1 right-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                      
                      {(!dayMeals.snacks || dayMeals.snacks.length < 5) && (
                        <div className="border-2 border-dashed border-orange-300 rounded p-4 text-center hover:border-orange-400 transition-colors min-h-16 flex items-center justify-center">
                          <span className="text-orange-600 text-sm">
                            Drop snack here ({dayMeals.snacks?.length || 0}/5)
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular meals rendering (now supporting arrays)
                    <div className="space-y-2">
                      {(() => {
                        const recipes = dayMeals[mealType as keyof typeof dayMeals] as SavedRecipe[] | undefined;
                        const maxRecipes = mealType === 'lunch' ? 5 : 3; // 5 for lunch, 3 for breakfast/dinner
                        
                        return (
                          <>
                            {recipes && recipes.length > 0 && (
                              recipes.map((recipe, recipeIndex) => (
                                <div key={`${recipe.id}-${recipeIndex}`} className="relative group">
                                  <div className="bg-green-50 border border-green-200 rounded p-2 hover:bg-green-100 transition-colors">
                                    {/* Recipe Image */}
                                    <div className="flex items-center space-x-2 mb-2">
                                      <div className="relative w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded flex-shrink-0">
                                        {recipe.imageUrl ? (
                                          <img 
                                            src={recipe.imageUrl} 
                                            alt={recipe.title}
                                            className="w-full h-full object-cover rounded"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                        ) : (
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <ChefHat className="w-4 h-4 text-white opacity-80" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-800 text-sm truncate" title={recipe.title}>
                                          {recipe.title}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      ~{Math.round(parseNutritionFromRecipe(recipe.convertedRecipe).calories)} kcal/serving
                                    </div>
                                    <button
                                      onClick={() => removeRecipeFromMeal(dateStr, mealType, recipeIndex)}
                                      className="absolute top-1 right-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                            
                            {(!recipes || recipes.length < maxRecipes) && (
                              <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center hover:border-green-400 transition-colors min-h-16 flex items-center justify-center">
                                <span className="text-gray-500 text-sm">
                                  Drop recipe here ({recipes?.length || 0}/{maxRecipes})
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
        </div>
      </div>

      {/* Action Buttons - Positioned under calendar right side */}
      <div className="flex justify-end mt-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowShoppingList(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Shopping List
          </button>
          <button
            onClick={saveMealPlan}
            disabled={saving || !hasUnsavedChanges}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              hasUnsavedChanges
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {hasUnsavedChanges ? 'Save Plan' : 'Saved'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Recipe Selector Modal */}
      {showRecipeSelector && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowRecipeSelector(null)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Header */}
              <div className="bg-green-600 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">
                    Add {showRecipeSelector.meal} for {formatDisplayDate(new Date(showRecipeSelector.date))}
                  </h3>
                  <button
                    onClick={() => setShowRecipeSelector(null)}
                    className="text-white hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Filters */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    value={recipeSearchTerm}
                    onChange={(e) => setRecipeSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <select
                  value={recipeSortBy}
                  onChange={(e) => setRecipeSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="date-desc">📅 Newest First</option>
                  <option value="date-asc">📅 Oldest First</option>
                  <option value="name-asc">📝 A-Z</option>
                  <option value="name-desc">📝 Z-A</option>
                </select>
                
                <select
                  value={selectedDietaryFilter}
                  onChange={(e) => setSelectedDietaryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="">All Dietary Preferences</option>
                  <option value="Vegetarian">🌱 Vegetarian</option>
                  <option value="Vegan">🥬 Vegan</option>
                  <option value="Gluten-Free">🌾 Gluten-Free</option>
                  <option value="Dairy-Free">🥛 Dairy-Free</option>
                  <option value="Keto">🥓 Keto</option>
                  <option value="Paleo">🥩 Paleo</option>
                </select>
              </div>
              
              {/* Recipe List */}
              <div className="max-h-80 overflow-y-auto p-4">
                {(() => {
                  const filteredRecipes = getFilteredAndSortedRecipes();
                  return filteredRecipes.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recipes match your search</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredRecipes.map(recipe => (
                        <button
                          key={recipe.id}
                          onClick={() => {
                            addRecipeToMeal(showRecipeSelector.date, showRecipeSelector.meal, recipe);
                            setShowRecipeSelector(null);
                          }}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-300 transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500 rounded flex items-center justify-center flex-shrink-0">
                              {recipe.imageUrl ? (
                                <img 
                                  src={recipe.imageUrl} 
                                  alt={recipe.title}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <ChefHat className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{recipe.title}</h4>
                              <p className="text-sm text-gray-600 truncate">
                                {recipe.dietaryFilters.slice(0, 2).join(', ')}
                              </p>
                              <p className="text-xs text-gray-500">
                                ~{Math.round(parseNutritionFromRecipe(recipe.convertedRecipe).calories)} kcal
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopping List Modal */}
      {showShoppingList && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowShoppingList(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="h-6 w-6 text-white" />
                    <h3 className="text-lg font-medium text-white">Shopping List</h3>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={printShoppingList}
                      className="flex items-center px-3 py-1 bg-white text-green-600 rounded text-sm hover:bg-gray-100 transition-colors"
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      Print
                    </button>
                    <button
                      onClick={() => setShowShoppingList(false)}
                      className="text-white hover:text-gray-200"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <p className="text-green-100 text-sm mt-1">
                  Week of {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
                </p>
              </div>
              
              <div className="max-h-96 overflow-y-auto p-6">
                {(() => {
                  const categorizedList = getShoppingListByCategory();
                  return categorizedList.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No meal plans found for this week. Add some recipes to your calendar first!
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {categorizedList.map(category => (
                        <div key={category.name} className="space-y-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                            {category.name} ({category.items.length})
                          </div>
                          <div className="space-y-2">
                            {category.items.map((item, index) => {
                              const itemKey = item.ingredient.toLowerCase();
                              const isChecked = checkedItems.has(itemKey);
                              return (
                                <div key={`${category.name}-${index}`} className={`flex items-start p-3 rounded-lg border transition-all ${
                                  isChecked ? 'bg-gray-100 opacity-60' : 'bg-white hover:bg-gray-50'
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleItemChecked(itemKey)}
                                    className="mt-1 mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                  />
                                  <div className="flex-1">
                                    <div className={`font-medium ${
                                      isChecked ? 'text-gray-500 line-through' : 'text-gray-900'
                                    }`}>
                                      <span className="text-blue-600 font-bold">{item.quantity}</span> {item.ingredient}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      For: {item.recipes.join(', ')}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      
                      {/* Shopping List Stats */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Total Items: {categorizedList.reduce((sum, cat) => sum + cat.items.length, 0)}</span>
                          <span>Checked: {checkedItems.size}</span>
                          <span>Remaining: {categorizedList.reduce((sum, cat) => sum + cat.items.length, 0) - checkedItems.size}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};