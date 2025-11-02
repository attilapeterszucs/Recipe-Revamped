import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import { Calendar, Plus, Trash2, ShoppingCart, Printer, ChevronLeft, ChevronRight, X, GripVertical, Save, RefreshCcw, Search, ChefHat, Heart, Zap, Target, TrendingUp, Activity, Flame, Apple, Sparkles, ArrowUpDown, Filter, Utensils, AlertTriangle, Info, CheckCircle, Crown, Check } from 'lucide-react';
import type { SavedRecipe } from '../lib/validation';
import type { UserSettings } from '../types/userSettings';
import { getUserRecipes } from '../lib/firestore';
import { useToast } from './ToastContainer';
import { parseNutritionFromRecipe, calculateTotalNutrition, type NutritionInfo } from '../lib/nutritionParser';
import { MealPlanService, type MealPlan } from '../lib/mealPlanService';
import { CustomDropdown } from './CustomDropdown';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

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
    canGenerateWeeklyMenu: boolean;
  };
  onShowUpgradeModal?: () => void;
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

export const MealPlannerCalendar: React.FC<MealPlannerCalendarProps> = ({ userId, userSettings, canUseNutritionAnalysis = false, featureAccess, onShowUpgradeModal }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [showRecipeSelector, setShowRecipeSelector] = useState<{ date: string; meal: string } | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showRecipeList, setShowRecipeList] = useState(true);
  const [draggedRecipe, setDraggedRecipe] = useState<SavedRecipe | null>(null);
  const [draggedPlacedRecipe, setDraggedPlacedRecipe] = useState<{recipe: SavedRecipe; sourceDate: string; sourceMeal: string; sourceIndex: number} | null>(null);
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

  // Lock body scroll when shopping list is open
  useBodyScrollLock(showShoppingList);

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
        const userRecipes = await getUserRecipes(userId, 100);
        setRecipes(userRecipes);
      } catch {
        showError('Failed to Load', 'Could not load your recipes');
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

    Object.entries(mealPlan).forEach(([_, meals]) => {
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
    } catch {
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
    
    if (draggedPlacedRecipe) {
      // Moving a recipe from calendar to calendar
      const { recipe, sourceDate, sourceMeal, sourceIndex } = draggedPlacedRecipe;
      
      // Check if moving to same location
      if (sourceDate === dateStr && sourceMeal === mealType) {
        setDraggedPlacedRecipe(null);
        return;
      }
      
      // Remove from source
      removeRecipeFromMeal(sourceDate, sourceMeal, sourceIndex);
      // Add to destination
      addRecipeToMeal(dateStr, mealType, recipe);
      setDraggedPlacedRecipe(null);
    } else if (draggedRecipe) {
      // Adding a recipe from recipe list
      addRecipeToMeal(dateStr, mealType, draggedRecipe);
      setDraggedRecipe(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedRecipe(null);
    setDraggedPlacedRecipe(null);
  };

  // Drag handler for recipes already in calendar
  const handleDragStartFromCalendar = (e: React.DragEvent, recipe: SavedRecipe, sourceDate: string, sourceMeal: string, sourceIndex: number) => {
    setDraggedPlacedRecipe({ recipe, sourceDate, sourceMeal, sourceIndex });
    e.dataTransfer.effectAllowed = 'move';
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
    } catch {
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

    } catch {
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

  const getNutritionRecommendations = (dailyAvg: { calories: number; protein: number; carbs: number; fat: number; fiber?: number; sodium?: number }) => {
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
      const htmlContent = `
        <html>
          <head>
            <title>Shopping List - Week of ${weekDates[0].toLocaleDateString()}</title>
            <style>
              @page {
                margin: 1.5cm;
                size: A4;
              }

              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
                color: #1f2937;
                line-height: 1.6;
                background: linear-gradient(to bottom, rgba(16, 185, 129, 0.03) 0%, white 100%);
              }

              .page-header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                padding: 32px;
                border-radius: 20px;
                margin-bottom: 32px;
                box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);
                position: relative;
                overflow: hidden;
              }

              .header-pattern {
                position: absolute;
                inset: 0;
                opacity: 0.1;
                background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 1px);
                background-size: 24px 24px;
              }

              .header-content {
                position: relative;
                z-index: 1;
              }

              h1 {
                color: white;
                font-size: 2.25rem;
                font-weight: 900;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                letter-spacing: -0.02em;
              }

              .header-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                color: white;
                padding: 8px 16px;
                border-radius: 100px;
                font-size: 0.85rem;
                font-weight: 700;
                margin-bottom: 12px;
              }

              .header-info {
                color: rgba(255, 255, 255, 0.95);
                font-size: 1rem;
                line-height: 1.9;
                font-weight: 500;
              }

              .header-info strong {
                color: white;
                font-weight: 800;
              }

              .print-date {
                color: rgba(255, 255, 255, 0.75);
                font-size: 0.8rem;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                font-style: italic;
              }

              .tips-section {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                padding: 20px 24px;
                border-radius: 16px;
                margin-bottom: 32px;
                border-left: 4px solid #10b981;
              }

              .tips-title {
                font-size: 1rem;
                font-weight: 800;
                color: #059669;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .tips-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
              }

              .tip-item {
                font-size: 0.85rem;
                color: #065f46;
                display: flex;
                align-items: start;
                gap: 8px;
              }

              .tip-icon {
                color: #10b981;
                font-weight: 900;
                flex-shrink: 0;
              }

              .category {
                margin-bottom: 28px;
                page-break-inside: avoid;
              }

              .category-header {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                padding: 14px 18px;
                border-radius: 14px;
                margin-bottom: 12px;
                border-left: 5px solid #10b981;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
              }

              .category-title {
                font-size: 1.25rem;
                font-weight: 900;
                color: #059669;
                letter-spacing: -0.01em;
              }

              .category-count {
                background: white;
                color: #10b981;
                padding: 6px 14px;
                border-radius: 100px;
                font-size: 0.85rem;
                font-weight: 800;
                box-shadow: 0 2px 4px rgba(16, 185, 129, 0.15);
              }

              .items-container {
                display: grid;
                gap: 10px;
              }

              .item {
                padding: 16px 18px;
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                display: flex;
                align-items: flex-start;
                gap: 14px;
                transition: all 0.2s;
              }

              .checkbox {
                flex-shrink: 0;
                width: 22px;
                height: 22px;
                border: 3px solid #10b981;
                border-radius: 6px;
                margin-top: 1px;
                background: white;
              }

              .item-content {
                flex: 1;
              }

              .ingredient-line {
                display: flex;
                flex-wrap: wrap;
                align-items: baseline;
                gap: 8px;
                margin-bottom: 6px;
              }

              .quantity {
                font-weight: 900;
                color: #10b981;
                font-size: 1.1rem;
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                padding: 2px 10px;
                border-radius: 8px;
              }

              .ingredient-name {
                font-weight: 700;
                color: #1f2937;
                font-size: 1.05rem;
              }

              .recipes {
                font-size: 0.85rem;
                color: #6b7280;
                padding-left: 0;
                display: flex;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
              }

              .recipes-label {
                font-weight: 700;
                color: #4b5563;
              }

              .recipe-tag {
                background: #f3f4f6;
                padding: 3px 10px;
                border-radius: 6px;
                font-weight: 600;
                color: #374151;
              }

              .summary-section {
                margin-top: 40px;
                padding: 28px;
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                border-radius: 20px;
                border-left: 5px solid #3b82f6;
                page-break-inside: avoid;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
              }

              .summary-title {
                font-size: 1.4rem;
                font-weight: 900;
                color: #1e40af;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                letter-spacing: -0.01em;
              }

              .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 16px;
              }

              .summary-item {
                background: white;
                padding: 16px 18px;
                border-radius: 14px;
                border: 2px solid #93c5fd;
                text-align: center;
              }

              .summary-label {
                color: #6b7280;
                font-size: 0.85rem;
                font-weight: 700;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.03em;
              }

              .summary-value {
                color: #1e40af;
                font-size: 2rem;
                font-weight: 900;
                letter-spacing: -0.02em;
              }

              .footer {
                margin-top: 48px;
                padding-top: 24px;
                border-top: 2px solid #e5e7eb;
                text-align: center;
              }

              .brand {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 900;
                font-size: 1.3rem;
                margin-bottom: 8px;
                letter-spacing: -0.02em;
              }

              .footer-info {
                color: #9ca3af;
                font-size: 0.9rem;
                font-weight: 600;
              }

              .footer-note {
                color: #d1d5db;
                font-size: 0.75rem;
                margin-top: 8px;
                font-style: italic;
              }

              .empty-state {
                text-align: center;
                padding: 80px 20px;
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-radius: 20px;
                border: 3px dashed #10b981;
              }

              .empty-state-icon {
                font-size: 5rem;
                margin-bottom: 20px;
                animation: bounce 2s infinite;
              }

              .empty-state-title {
                color: #059669;
                font-size: 1.75rem;
                font-weight: 900;
                margin-bottom: 12px;
                letter-spacing: -0.02em;
              }

              .empty-state-text {
                color: #6b7280;
                font-size: 1.05rem;
                font-weight: 500;
              }

              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }

              @media print {
                body {
                  padding: 0;
                  background: white;
                }

                .page-header {
                  box-shadow: none;
                }

                .summary-section {
                  page-break-before: auto;
                  box-shadow: none;
                }

                .category-header {
                  box-shadow: none;
                }

                .tips-section {
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="page-header">
              <div class="header-pattern"></div>
              <div class="header-content">
                <div class="header-badge">🛒 Weekly Shopping List</div>
                <h1>Shopping List</h1>
                <div class="header-info">
                  <strong>Week:</strong> ${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<br>
                  <strong>Total Items:</strong> ${uncheckedItems.length} ${uncheckedItems.length === 1 ? 'item' : 'items'} to buy
                </div>
                <div class="print-date">📅 Printed on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            ${uncheckedItems.length > 0 ? `
              <div class="tips-section">
                <div class="tips-title">💡 Shopping Tips</div>
                <div class="tips-grid">
                  <div class="tip-item"><span class="tip-icon">✓</span> Check your pantry before leaving</div>
                  <div class="tip-item"><span class="tip-icon">✓</span> Follow the store layout order</div>
                  <div class="tip-item"><span class="tip-icon">✓</span> Look for seasonal alternatives</div>
                  <div class="tip-item"><span class="tip-icon">✓</span> Check expiration dates</div>
                </div>
              </div>
            ` : ''}

            ${uncheckedItems.length === 0 ?
              '<div class="empty-state"><div class="empty-state-icon">🎉</div><h2 class="empty-state-title">All Items Completed!</h2><p class="empty-state-text">Nothing left to buy for this week. Great job planning ahead!</p></div>' :
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
                      <div class="category-header">
                        <div class="category-title">${categoryName}</div>
                        <div class="category-count">${items.length} ${items.length === 1 ? 'item' : 'items'}</div>
                      </div>
                      <div class="items-container">
                        ${items.map(item => `
                          <div class="item">
                            <span class="checkbox"></span>
                            <div class="item-content">
                              <div class="ingredient-line">
                                <span class="quantity">${item.quantity}</span>
                                <span class="ingredient-name">${item.ingredient}</span>
                              </div>
                              <div class="recipes">
                                <span class="recipes-label">For:</span>
                                ${item.recipes.map(recipe => `<span class="recipe-tag">${recipe}</span>`).join(' ')}
                              </div>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  `).join('');
              })()
            }

            ${uncheckedItems.length > 0 ? `
              <div class="summary-section">
                <div class="summary-title">📊 Shopping Summary</div>
                <div class="summary-grid">
                  <div class="summary-item">
                    <div class="summary-label">Categories</div>
                    <div class="summary-value">${Object.keys((() => {
                      const cats: { [key: string]: boolean } = {};
                      uncheckedItems.forEach(item => { cats[item.category] = true; });
                      return cats;
                    })()).length}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Items to Buy</div>
                    <div class="summary-value">${uncheckedItems.length}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Completed</div>
                    <div class="summary-value">${checkedItems.size}</div>
                  </div>
                </div>
              </div>
            ` : ''}

            <div class="footer">
              <div class="brand">Recipe Revamped</div>
              <div class="footer-info">Your AI-Powered Recipe & Meal Planning Assistant</div>
              <div class="footer-note">Powered by AI • Made with ❤️ for home cooks</div>
            </div>
          </body>
        </html>
      `;

      // Write HTML content directly to print window
      // Note: This is safe because all content is generated from controlled data (weekDates, uncheckedItems)
      // and doesn't include any user-generated HTML
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header - Landing Page Style */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 rounded-3xl shadow-2xl">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="relative px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white mb-1">Meal Planning</h1>
                <p className="text-white/90 text-sm font-medium">Plan your weekly meals, track nutrition, and generate shopping lists</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
              <ChefHat className="w-4 h-4" />
              Weekly Planner
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Meals Planned</p>
                  <p className="text-2xl font-black text-white">
                    {Object.values(mealPlan).reduce((total, day) => {
                      return total + Object.values(day).reduce((dayTotal, meals) => {
                        return dayTotal + (Array.isArray(meals) ? meals.length : 0);
                      }, 0);
                    }, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Days Planned</p>
                  <p className="text-2xl font-black text-white">
                    {Object.keys(mealPlan).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Shopping Items</p>
                  <p className="text-2xl font-black text-white">
                    {generateShoppingList().length}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Recipes Available</p>
                  <p className="text-2xl font-black text-white">
                    {recipes.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Weekly Nutrition Summary - Only for Master Chef+ plans */}
      {canUseNutritionAnalysis ? (
        <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-green-200 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out delay-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <div className="bg-gradient-to-br from-green-600 to-purple-600 p-2 rounded-lg mr-3">
                <Activity className="w-6 h-6 text-white" />
              </div>
              Weekly Nutrition Analytics
            </h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-bold shadow-md">
              <TrendingUp className="w-4 h-4" />
              Advanced
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border-2 border-orange-200 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                      <div className="flex items-center mb-3">
                        <div className="bg-orange-100 p-2 rounded-lg mr-2">
                          <Flame className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Daily Avg Calories</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{dailyAvg.calories}</div>
                      <div className="text-xs text-gray-600 font-semibold mt-1">kcal/day</div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                      <div className="flex items-center mb-3">
                        <div className="bg-blue-100 p-2 rounded-lg mr-2">
                          <Zap className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Protein</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{dailyAvg.protein}g</div>
                      <div className="text-xs text-green-600 font-bold mt-1">{macroPercentages.proteinPct}% of calories</div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                      <div className="flex items-center mb-3">
                        <div className="bg-green-100 p-2 rounded-lg mr-2">
                          <Apple className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Carbs</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{dailyAvg.carbs}g</div>
                      <div className="text-xs text-green-600 font-bold mt-1">{macroPercentages.carbsPct}% of calories</div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                      <div className="flex items-center mb-3">
                        <div className="bg-purple-100 p-2 rounded-lg mr-2">
                          <Target className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Fat</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{dailyAvg.fat}g</div>
                      <div className="text-xs text-green-600 font-bold mt-1">{macroPercentages.fatPct}% of calories</div>
                    </div>
                  </div>

                  {/* Macro Distribution Visualization */}
                  <div className="bg-white rounded-xl p-5 shadow-md border-2 border-gray-200">
                    <h4 className="text-base sm:text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      Macronutrient Distribution
                    </h4>
                    <div className="flex rounded-xl overflow-hidden h-4 mb-4 shadow-sm">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 hover:opacity-90"
                        style={{ width: `${macroPercentages.proteinPct}%` }}
                        title={`Protein: ${macroPercentages.proteinPct}%`}
                      />
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500 hover:opacity-90"
                        style={{ width: `${macroPercentages.carbsPct}%` }}
                        title={`Carbs: ${macroPercentages.carbsPct}%`}
                      />
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-500 hover:opacity-90"
                        style={{ width: `${macroPercentages.fatPct}%` }}
                        title={`Fat: ${macroPercentages.fatPct}%`}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center p-2 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                          <span className="text-xs font-bold text-gray-700">Protein</span>
                        </div>
                        <span className="text-lg font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{macroPercentages.proteinPct}%</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600"></div>
                          <span className="text-xs font-bold text-gray-700">Carbs</span>
                        </div>
                        <span className="text-lg font-black bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">{macroPercentages.carbsPct}%</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-lg bg-purple-50 border border-purple-200">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-600"></div>
                          <span className="text-xs font-bold text-gray-700">Fat</span>
                        </div>
                        <span className="text-lg font-black bg-gradient-to-r from-purple-600 to-pink-700 bg-clip-text text-transparent">{macroPercentages.fatPct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Nutrition Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-green-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
                      <div className="flex items-center justify-center mb-2">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Apple className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-700 mb-1">Fiber</div>
                      <div className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{dailyAvg.fiber}g</div>
                      <div className="text-xs text-gray-600 font-semibold mt-1">per day</div>
                    </div>

                    <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-blue-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
                      <div className="flex items-center justify-center mb-2">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-700 mb-1">Sodium</div>
                      <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{dailyAvg.sodium}mg</div>
                      <div className="text-xs text-gray-600 font-semibold mt-1">per day</div>
                    </div>

                    <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-purple-200 hover:shadow-lg transition-all duration-200 hover:scale-105 col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-center mb-2">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-700 mb-1">Weekly Total</div>
                      <div className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{Math.round(weekNutrition.calories)}</div>
                      <div className="text-xs text-gray-600 font-semibold mt-1">calories</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200 shadow-md">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2.5 rounded-xl shadow-lg">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-base sm:text-lg font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                          Nutrition Insights
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {recommendations.map((rec, index) => (
                          <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md ${
                            rec.type === 'warning'
                              ? 'bg-red-50 border-l-red-500' :
                            rec.type === 'info'
                              ? 'bg-blue-50 border-l-blue-500'
                              : 'bg-amber-50 border-l-amber-500'
                          }`}>
                            <div className={`flex-shrink-0 mt-0.5 ${
                              rec.type === 'warning' ? 'text-red-600' :
                              rec.type === 'info' ? 'text-blue-600' : 'text-amber-600'
                            }`}>
                              {rec.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                              {rec.type === 'info' && <Info className="w-4 h-4" />}
                              {rec.type === 'success' && <CheckCircle className="w-4 h-4" />}
                            </div>
                            <p className={`text-sm font-semibold flex-1 ${
                              rec.type === 'warning' ? 'text-red-700' :
                              rec.type === 'info' ? 'text-blue-700' : 'text-amber-700'
                            }`}>
                              {rec.text}
                            </p>
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
        <div className="relative bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-300 rounded-2xl p-6 sm:p-8 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
          {/* Decorative background pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(249, 115, 22, 0.3) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}></div>
          </div>

          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            {/* Premium Badge Icon */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-lg ring-4 ring-orange-200 group-hover:ring-orange-300 transition-all duration-300">
                  <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
                </div>
                {/* Premium Crown Badge */}
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl p-2 shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform duration-300">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 text-orange-800 px-3 py-1.5 rounded-full text-xs font-bold mb-3 shadow-sm">
                <Crown className="w-3 h-3" />
                <span>Premium Feature</span>
              </div>

              <h4 className="text-lg sm:text-xl font-black text-gray-900 mb-3 leading-tight">
                Premium Nutrition Analysis
              </h4>

              <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                Unlock detailed weekly nutrition tracking with <span className="font-bold text-orange-600">Master Chef plan</span>. Get comprehensive nutritional insights for your meal plans.
              </p>

              {/* Feature List */}
              <div className="flex flex-wrap gap-2 mb-5">
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                  <span className="font-medium">Weekly tracking</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                  <span className="font-medium">Macro breakdowns</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                  <span className="font-medium">AI insights</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                data-upgrade-plan
                onClick={() => onShowUpgradeModal?.()}
                className="group/btn relative bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-3.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 text-sm touch-friendly min-h-[44px] w-full sm:w-auto shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Crown className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                  Upgrade for Nutrition Analysis
                </span>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe List Sidebar - Hidden on mobile */}
      {showRecipeList && (
        <div className="hidden md:block mb-6 bg-white rounded-2xl shadow-lg border-2 border-green-200 animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out delay-200">
          <div className="flex items-center justify-between p-5 border-b-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <h3 className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-2 rounded-lg mr-3">
                <GripVertical className="w-5 h-5 text-white" />
              </div>
              Your Recipes - Drag to Calendar
            </h3>
            <button
              onClick={() => setShowRecipeList(!showRecipeList)}
              className="text-gray-500 hover:text-green-600 transition-colors duration-200 p-2 hover:bg-green-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Search and Sort Controls */}
          <div className="p-5 border-b-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            {/* First Row: Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              {/* Search Input - 2/3 width on desktop */}
              <div className="relative flex-1 sm:flex-[2]">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500 z-10" strokeWidth={2.5} />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={recipeSearchTerm}
                  onChange={(e) => setRecipeSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm font-semibold shadow-sm hover:border-green-300 hover:shadow-md transition-all duration-200"
                />
              </div>

              {/* Sort By - 1/3 width on desktop */}
              <div className="sm:flex-1">
                <CustomDropdown
                  value={recipeSortBy}
                  onChange={(value) => setRecipeSortBy(value)}
                  options={[
                    { value: 'date-asc', label: 'Date (Oldest First)', icon: '📅' },
                    { value: 'date-desc', label: 'Date (Newest First)', icon: '📅' },
                    { value: 'name-asc', label: 'Name (A-Z)', icon: '📝' },
                    { value: 'name-desc', label: 'Name (Z-A)', icon: '📝' },
                    { value: 'rating-asc', label: 'Rating (Lowest First)', icon: '⭐' },
                    { value: 'rating-desc', label: 'Rating (Highest First)', icon: '⭐' }
                  ]}
                  placeholder="Sort by..."
                  icon={<ArrowUpDown className="w-5 h-5 text-green-500" strokeWidth={2.5} />}
                  ariaLabel="Sort recipes"
                />
              </div>
            </div>

            {/* Second Row: Filters - Each takes 1/3 width on desktop */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Dietary Filter - 1/3 width */}
              <div className="sm:flex-1">
                <CustomDropdown
                  value={selectedDietaryFilter}
                  onChange={(value) => setSelectedDietaryFilter(value)}
                  options={[
                    { value: '', label: 'All Dietary Preferences' },
                    { value: 'Vegetarian', label: 'Vegetarian', icon: '🌱' },
                    { value: 'Vegan', label: 'Vegan', icon: '🥬' },
                    { value: 'Gluten-Free', label: 'Gluten-Free', icon: '🌾' },
                    { value: 'Dairy-Free', label: 'Dairy-Free', icon: '🥛' },
                    { value: 'Keto', label: 'Keto', icon: '🥓' },
                    { value: 'Paleo', label: 'Paleo', icon: '🥩' },
                    { value: 'Low-Carb', label: 'Low-Carb', icon: '🍖' },
                    { value: 'High-Protein', label: 'High-Protein', icon: '💪' }
                  ]}
                  placeholder="All Dietary Preferences"
                  icon={<Filter className="w-5 h-5 text-green-500" strokeWidth={2.5} />}
                  ariaLabel="Filter by dietary preference"
                />
              </div>

              {/* Health Condition Filter - Only for Master Chef+ plans */}
              {featureAccess?.canUseHealthConditions && (
                <div className="sm:flex-1">
                  <CustomDropdown
                    value={selectedHealthFilter}
                    onChange={(value) => setSelectedHealthFilter(value)}
                    options={[
                      { value: '', label: 'All Health Conditions' },
                      { value: 'Diabetes', label: 'Diabetes-Friendly', icon: '🩺' },
                      { value: 'Heart Disease', label: 'Heart-Healthy', icon: '❤️' },
                      { value: 'Hypertension', label: 'Low-Sodium', icon: '💓' },
                      { value: 'Celiac Disease', label: 'Celiac-Safe', icon: '🌾' },
                      { value: 'Kidney Disease', label: 'Kidney-Friendly', icon: '🫘' }
                    ]}
                    placeholder="All Health Conditions"
                    icon={<Heart className="w-5 h-5 text-green-500" strokeWidth={2.5} />}
                    ariaLabel="Filter by health condition"
                  />
                </div>
              )}

              {/* Category Filter - 1/3 width */}
              <div className="sm:flex-1">
                <CustomDropdown
                  value={selectedCategoryFilter}
                  onChange={(value) => setSelectedCategoryFilter(value)}
                  options={[
                    { value: '', label: 'All Categories' },
                    { value: 'appetizer', label: 'Appetizers', icon: '🥗' },
                    { value: 'main-dish', label: 'Main Dishes', icon: '🍽️' },
                    { value: 'side-dish', label: 'Side Dishes', icon: '🥘' },
                    { value: 'dessert', label: 'Desserts', icon: '🍰' }
                  ]}
                  placeholder="All Categories"
                  icon={<Utensils className="w-5 h-5 text-green-500" strokeWidth={2.5} />}
                  ariaLabel="Filter by category"
                />
              </div>
            </div>
          </div>
          
          <div className="p-5 max-h-60 overflow-y-auto bg-white">
            {(() => {
              const filteredRecipes = getFilteredAndSortedRecipes();
              return filteredRecipes.length === 0 ? (
                <div className="text-center py-8">
                  {recipes.length === 0 ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <ChefHat className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-semibold">No saved recipes found</p>
                      <p className="text-sm text-gray-500">Create some recipes first!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-orange-500" />
                      </div>
                      <p className="text-gray-600 font-semibold">No recipes match your search</p>
                      <button
                        onClick={() => setRecipeSearchTerm('')}
                        className="mt-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-green-100">
                    <span className="text-sm font-bold text-gray-700">
                      Showing <span className="text-green-600">{filteredRecipes.length}</span> of {recipes.length} recipes
                    </span>
                    {(recipeSearchTerm || selectedDietaryFilter || selectedHealthFilter || selectedCategoryFilter) && (
                      <button
                        onClick={() => {
                          setRecipeSearchTerm('');
                          setSelectedDietaryFilter('');
                          setSelectedHealthFilter('');
                          setSelectedCategoryFilter('');
                        }}
                        className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 px-2 py-1 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Clear filters
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                    {filteredRecipes.map(recipe => (
                      <div
                        key={recipe.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, recipe)}
                        onDragEnd={handleDragEnd}
                        className="bg-white rounded-xl border-2 border-gray-200 hover:border-green-400 hover:shadow-xl transition-all duration-300 cursor-move shadow-md overflow-hidden group transform hover:scale-105 hover:-rotate-1"
                      >
                        {/* Recipe Image */}
                        <div className="relative h-20 sm:h-24 bg-gradient-to-br from-green-400 via-emerald-400 to-blue-500 overflow-hidden">
                          {recipe.imageUrl ? (
                            <img
                              src={recipe.imageUrl}
                              alt={recipe.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        draggable={false}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-80 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                            </div>
                          )}
                          {/* Drag indicator */}
                          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <GripVertical className="w-3 h-3 text-white" />
                          </div>
                        </div>

                        {/* Recipe Details */}
                        <div className="p-2 sm:p-3">
                          <div className="font-black text-gray-900 text-xs sm:text-sm truncate mb-1" title={recipe.title}>
                            {recipe.title}
                          </div>
                          {recipe.dietaryFilters.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {recipe.dietaryFilters.slice(0, 1).map(filter => (
                                <span
                                  key={filter}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                                >
                                  {filter.length > 8 ? filter.substring(0, 8) + '...' : filter}
                                </span>
                              ))}
                              {recipe.dietaryFilters.length > 1 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border border-gray-200">
                                  +{recipe.dietaryFilters.length - 1}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-600 font-semibold">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span>~{Math.round(parseNutritionFromRecipe(recipe.convertedRecipe).calories)} kcal</span>
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
      {featureAccess?.canGenerateWeeklyMenu ? (
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 border-2 border-purple-300 rounded-2xl p-6 mb-6 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out delay-300">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 mb-5">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Generate Weekly Menu</h3>
                <p className="text-sm text-purple-700 font-semibold mt-1">Auto-fill your calendar with smart recipe recommendations</p>
              </div>
            </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            {/* Left Side: Week Selector and Settings Toggles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Health Conditions and Dietary Preferences */}
              <div className="flex flex-col gap-3">
                {userSettings?.healthConditions && userSettings.healthConditions.length > 0 && (
                  <label className="flex items-center text-sm cursor-pointer whitespace-nowrap group">
                    <input
                      type="checkbox"
                      checked={alignWithHealthConditions}
                      onChange={(e) => setAlignWithHealthConditions(e.target.checked)}
                      className="mr-3 h-5 w-5 text-purple-600 focus:ring-2 focus:ring-purple-500 border-2 border-purple-400 rounded transition-all duration-200"
                    />
                    <span className="text-purple-900 font-bold group-hover:text-purple-700 transition-colors">🩺 Health Conditions</span>
                    <span className="ml-2 text-xs text-white bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-1 rounded-lg font-bold shadow-sm">
                      {userSettings.healthConditions.length}
                    </span>
                  </label>
                )}

                {userSettings?.defaultDietaryFilters && userSettings.defaultDietaryFilters.length > 0 && (
                  <label className="flex items-center text-sm cursor-pointer whitespace-nowrap group">
                    <input
                      type="checkbox"
                      checked={alignWithDietaryPreferences}
                      onChange={(e) => setAlignWithDietaryPreferences(e.target.checked)}
                      className="mr-3 h-5 w-5 text-purple-600 focus:ring-2 focus:ring-purple-500 border-2 border-purple-400 rounded transition-all duration-200"
                    />
                    <span className="text-purple-900 font-bold group-hover:text-purple-700 transition-colors">🌱 Dietary Preferences</span>
                    <span className="ml-2 text-xs text-white bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-1 rounded-lg font-bold shadow-sm">
                      {userSettings.defaultDietaryFilters.length}
                    </span>
                  </label>
                )}

                {(!userSettings?.healthConditions || userSettings.healthConditions.length === 0) &&
                 (!userSettings?.defaultDietaryFilters || userSettings.defaultDietaryFilters.length === 0) && (
                  <div className="text-sm text-purple-700 bg-white border-2 border-purple-200 px-4 py-2.5 rounded-xl font-semibold shadow-sm">
                    💡 Set health conditions and dietary preferences in Settings
                  </div>
                )}
              </div>

            </div>

            {/* Right Side: Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Week Type Selector */}
              <div className="min-w-[180px]">
                <CustomDropdown
                  value={selectedWeekType}
                  onChange={(value) => setSelectedWeekType(value)}
                  options={[
                    { value: 'balanced', label: 'Balanced', icon: '🌟' },
                    { value: 'protein-focused', label: 'Protein', icon: '💪' },
                    { value: 'low-carb', label: 'Low Carb', icon: '🥩' },
                    { value: 'vegetarian', label: 'Vegetarian', icon: '🌱' },
                    { value: 'comfort-food', label: 'Comfort', icon: '🍲' },
                    { value: 'quick-easy', label: 'Quick', icon: '⚡' }
                  ]}
                  placeholder="Select week type"
                  icon={<Sparkles className="w-5 h-5 text-purple-500" strokeWidth={2.5} />}
                  ariaLabel="Select week type"
                />
              </div>

              {/* Clear Calendar Button */}
              <button
                onClick={clearWeeklyPlan}
                disabled={isClearing || Object.keys(mealPlan).length === 0}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all duration-200 text-sm whitespace-nowrap shadow-lg ${
                  isClearing || Object.keys(mealPlan).length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 hover:shadow-xl hover:scale-105 shadow-red-500/30'
                }`}
              >
                {isClearing ? (
                  <>
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Clear
                  </>
                )}
              </button>

              {/* Generate Button */}
              <button
                onClick={generateWeeklyPlan}
                disabled={isGenerating || recipes.length === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-200 text-sm whitespace-nowrap shadow-lg ${
                  isGenerating || recipes.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-xl hover:scale-105 shadow-purple-500/30'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

          {recipes.length === 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl px-4 py-2.5 inline-block font-bold shadow-lg">
                💡 Save some recipes first to generate meal plans
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-300 rounded-2xl p-6 sm:p-8 mb-6 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
          {/* Decorative background pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(249, 115, 22, 0.3) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}></div>
          </div>

          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            {/* Premium Badge Icon */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-lg ring-4 ring-orange-200 group-hover:ring-orange-300 transition-all duration-300">
                  <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
                </div>
                {/* Premium Crown Badge */}
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl p-2 shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform duration-300">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 text-orange-800 px-3 py-1.5 rounded-full text-xs font-bold mb-3 shadow-sm">
                <Crown className="w-3 h-3" />
                <span>Premium Feature</span>
              </div>

              <h4 className="text-lg sm:text-xl font-black text-gray-900 mb-3 leading-tight">
                Generate Weekly Menu
              </h4>

              <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                Auto-generate weekly meal plans with <span className="font-bold text-orange-600">Master Chef plan</span>. Get AI-powered recipe recommendations tailored to your preferences.
              </p>

              {/* Feature List */}
              <div className="flex flex-wrap gap-2 mb-5">
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                  <span className="font-medium">AI-powered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                  <span className="font-medium">Auto-fill calendar</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                  <span className="font-medium">Smart suggestions</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                data-upgrade-plan
                onClick={() => onShowUpgradeModal?.()}
                className="group/btn relative bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-3.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 text-sm touch-friendly min-h-[44px] w-full sm:w-auto shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Crown className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                  Upgrade for Weekly Menus
                </span>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200 shadow-lg mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out delay-[400ms]">
        <button
          onClick={() => navigateWeek('prev')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 hover:text-green-600 border-2 border-gray-300 hover:border-green-400 rounded-lg transition-all duration-200 font-bold shadow-sm hover:shadow-md"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-sm text-gray-700 font-semibold mt-1">
            {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
          </p>
        </div>

        <button
          onClick={() => navigateWeek('next')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 hover:text-green-600 border-2 border-gray-300 hover:border-green-400 rounded-lg transition-all duration-200 font-bold shadow-sm hover:shadow-md"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-green-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out delay-500">
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
                <div className={`p-4 border-b-2 ${
                  isToday
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b-green-300'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 border-b-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-black text-lg ${
                        isToday
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'
                          : 'text-gray-900'
                      }`}>
                        {formatDisplayDate(date)}
                      </h3>
                      <p className="text-sm text-gray-600 font-semibold mt-0.5">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    {dayNutrition.calories > 0 && (
                      <div className="text-xs text-white bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1.5 rounded-lg font-bold shadow-md">
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
                              <div key={`${recipe.id}-${index}`} className="relative group">
                                <div 
                                  className="bg-white rounded-xl border-2 border-gray-200 hover:border-green-400 hover:shadow-xl transition-all duration-300 shadow-md overflow-hidden cursor-move select-none"
                                  draggable={true}
                                  onDragStart={(e) => handleDragStartFromCalendar(e, recipe, dateStr, mealType, index)}
                                  onDragEnd={handleDragEnd}
                                >
                                  {/* Recipe Image */}
                                  <div className="relative h-20 bg-gradient-to-br from-green-400 via-emerald-400 to-blue-500 overflow-hidden">
                                    {recipe.imageUrl ? (
                                      <img
                                        src={recipe.imageUrl}
                                        alt={recipe.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        draggable={false}
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <ChefHat className="w-6 h-6 text-white opacity-80 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Recipe Details */}
                                  <div className="p-2">
                                    <div className="font-black text-gray-900 text-sm truncate mb-1" title={recipe.title}>
                                      {recipe.title}
                                    </div>
                                    {recipe.dietaryFilters.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-1.5">
                                        {recipe.dietaryFilters.slice(0, 1).map(filter => (
                                          <span
                                            key={filter}
                                            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                                          >
                                            {filter.length > 8 ? filter.substring(0, 8) + '...' : filter}
                                          </span>
                                        ))}
                                        {recipe.dietaryFilters.length > 1 && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border border-gray-200">
                                            +{recipe.dietaryFilters.length - 1}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-gray-600 font-semibold">
                                      <Flame className="w-3 h-3 text-orange-500" />
                                      <span>~{Math.round(parseNutritionFromRecipe(recipe.convertedRecipe).calories)} kcal</span>
                                    </div>
                                  </div>

                                  {/* Drag Handle */}
                                  <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full cursor-move pointer-events-none">
                                    <GripVertical className="w-3 h-3" />
                                  </div>

                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeRecipeFromMeal(dateStr, mealType, index); }}
                                    className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full hover:scale-110 pointer-events-auto"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
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
        <div className="hidden md:grid grid-cols-8 border-b-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="p-5 bg-gradient-to-br from-green-600 to-emerald-600 border-r-2 border-green-300">
            <div className="font-black text-white text-center flex items-center justify-center text-lg">
              <Calendar className="w-6 h-6 mr-2" />
              Meals
            </div>
          </div>
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const dayNutrition = getDayNutrition(dateStr);
            const isToday = date.toDateString() === new Date().toDateString();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div key={dateStr} className={`p-4 text-center border-r-2 border-green-200 last:border-r-0 transition-all duration-200 ${
                isToday
                  ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                  : isWeekend
                    ? 'bg-gradient-to-br from-purple-50 to-pink-50'
                    : 'bg-white'
              }`}>
                <div className={`font-black text-base ${
                  isToday
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'
                    : 'text-gray-900'
                }`}>
                  {formatDisplayDate(date)}
                </div>
                <div className={`text-sm mt-1 font-semibold ${isToday ? 'text-green-600' : 'text-gray-600'}`}>
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                {dayNutrition.calories > 0 && (
                  <div className="text-xs text-white bg-gradient-to-r from-green-500 to-emerald-500 px-2.5 py-1 rounded-lg mt-2 font-bold inline-block shadow-sm">
                    {Math.round(dayNutrition.calories)} kcal
                  </div>
                )}
                {isToday && (
                  <div className="text-xs bg-green-100 text-green-700 font-bold mt-2 px-2 py-0.5 rounded-full inline-block">Today</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Grid Body */}
        <div className="hidden md:block">
        {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
          const mealIcons = {
            breakfast: '🥞',
            lunch: '🥗',
            dinner: '🍽️',
            snacks: '🍿'
          };
          const mealColors = {
            breakfast: 'bg-gradient-to-br from-yellow-50 to-orange-50 border-l-4 border-l-yellow-500',
            lunch: 'bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-500',
            dinner: 'bg-gradient-to-br from-purple-50 to-indigo-50 border-l-4 border-l-purple-500',
            snacks: 'bg-gradient-to-br from-pink-50 to-rose-50 border-l-4 border-l-pink-500'
          };

          return (
            <div key={mealType} className="grid grid-cols-8 border-b-2 border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
              {/* Meal Label */}
              <div className={`p-5 border-r-2 border-green-200 flex items-center justify-center ${mealColors[mealType as keyof typeof mealColors]}`}>
                <div className="text-center">
                  <div className="text-3xl mb-2">{mealIcons[mealType as keyof typeof mealIcons]}</div>
                  <div className="font-black text-gray-900 capitalize text-base">
                    {mealType === 'snacks' ? 'Snacks' : mealType}
                  </div>
                  <div className="text-xs text-gray-600 font-semibold mt-1">
                    {mealType === 'lunch' ? 'Up to 5' : mealType === 'snacks' ? 'Up to 5' : 'Up to 3'}
                  </div>
                </div>
              </div>
            
            {/* Day Columns */}
            {weekDates.map((date) => {
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
                            <div 
                              className="bg-white rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 shadow-md overflow-hidden transform hover:scale-105 cursor-move select-none"
                              draggable={true}
                              onDragStart={(e) => handleDragStartFromCalendar(e, snack, dateStr, 'snacks', snackIndex)}
                              onDragEnd={handleDragEnd}
                            >
                              {/* Snack Image */}
                              <div className="relative h-16 sm:h-20 bg-gradient-to-br from-orange-400 via-pink-400 to-pink-500 overflow-hidden">
                                {snack.imageUrl ? (
                                  <img
                                    src={snack.imageUrl}
                                    alt={snack.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        draggable={false}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <ChefHat className="w-4 h-4 sm:w-6 sm:h-6 text-white opacity-80 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                                  </div>
                                )}
                              </div>

                              {/* Snack Details */}
                              <div className="p-2">
                                <div className="font-black text-gray-900 text-xs sm:text-sm truncate mb-1" title={snack.title}>
                                  {snack.title}
                                </div>
                                {snack.dietaryFilters.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-1.5">
                                    {snack.dietaryFilters.slice(0, 1).map(filter => (
                                      <span
                                        key={filter}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-orange-50 to-pink-50 text-orange-700 border border-orange-200"
                                      >
                                        {filter.length > 8 ? filter.substring(0, 8) + '...' : filter}
                                      </span>
                                    ))}
                                    {snack.dietaryFilters.length > 1 && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border border-gray-200">
                                        +{snack.dietaryFilters.length - 1}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-xs text-gray-600 font-semibold">
                                  <Flame className="w-3 h-3 text-orange-500" />
                                  <span>~{Math.round(parseNutritionFromRecipe(snack.convertedRecipe).calories)} kcal</span>
                                </div>
                              </div>

                              {/* Drag Handle */}
                              <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full cursor-move pointer-events-none">
                                <GripVertical className="w-3 h-3" />
                              </div>

                              <button
                                onClick={(e) => { e.stopPropagation(); removeRecipeFromMeal(dateStr, 'snacks', snackIndex); }}
                                className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full hover:scale-110 pointer-events-auto"
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
                                  <div 
                                    className="bg-white rounded-xl border-2 border-gray-200 hover:border-green-400 hover:shadow-xl transition-all duration-300 shadow-md overflow-hidden transform hover:scale-105 cursor-move select-none"
                                    draggable={true}
                                    onDragStart={(e) => handleDragStartFromCalendar(e, recipe, dateStr, mealType, recipeIndex)}
                                    onDragEnd={handleDragEnd}
                                  >
                                    {/* Recipe Image */}
                                    <div className="relative h-16 sm:h-20 bg-gradient-to-br from-green-400 via-emerald-400 to-blue-500 overflow-hidden">
                                      {recipe.imageUrl ? (
                                        <img
                                          src={recipe.imageUrl}
                                          alt={recipe.title}
                                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        draggable={false}
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <ChefHat className="w-4 h-4 sm:w-6 sm:w-6 text-white opacity-80 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Recipe Details */}
                                    <div className="p-2">
                                      <div className="font-black text-gray-900 text-xs sm:text-sm truncate mb-1" title={recipe.title}>
                                        {recipe.title}
                                      </div>
                                      {recipe.dietaryFilters.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-1.5">
                                          {recipe.dietaryFilters.slice(0, 1).map(filter => (
                                            <span
                                              key={filter}
                                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                                            >
                                              {filter.length > 8 ? filter.substring(0, 8) + '...' : filter}
                                            </span>
                                          ))}
                                          {recipe.dietaryFilters.length > 1 && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border border-gray-200">
                                              +{recipe.dietaryFilters.length - 1}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1 text-xs text-gray-600 font-semibold">
                                        <Flame className="w-3 h-3 text-orange-500" />
                                        <span>~{Math.round(parseNutritionFromRecipe(recipe.convertedRecipe).calories)} kcal</span>
                                      </div>
                                  </div>

                                  {/* Drag Handle */}
                                  <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full cursor-move pointer-events-none">
                                    <GripVertical className="w-3 h-3" />
                                  </div>

                                  <button onClick={(e) => { e.stopPropagation(); removeRecipeFromMeal(dateStr, mealType, recipeIndex); }}
                                      className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full hover:scale-110 pointer-events-auto"
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
      <div className="flex justify-end mt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShoppingList(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105"
          >
            <ShoppingCart className="w-5 h-5" />
            Shopping List
          </button>
          <button
            onClick={saveMealPlan}
            disabled={saving || !hasUnsavedChanges}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-200 font-bold shadow-lg ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-green-500/30 hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <RefreshCcw className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
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
      {showShoppingList && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200" onClick={() => setShowShoppingList(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-6 relative overflow-hidden">
              {/* Decorative pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                      <ShoppingCart className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">Shopping List</h3>
                      <p className="text-green-100 text-sm mt-0.5">
                        Week of {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={printShoppingList}
                      className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </button>
                    <button
                      onClick={() => setShowShoppingList(false)}
                      className="text-white/90 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/20 backdrop-blur-sm"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-green-50/30">
              {(() => {
                const categorizedList = getShoppingListByCategory();
                return categorizedList.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <ShoppingCart className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-semibold text-lg">No meal plans yet</p>
                    <p className="text-gray-500 text-sm mt-1">Add some recipes to your calendar to generate a shopping list!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {categorizedList.map((category, categoryIndex) => (
                      <div
                        key={category.name}
                        className="space-y-3 animate-in slide-in-from-bottom duration-300"
                        style={{ animationDelay: `${categoryIndex * 50}ms` }}
                      >
                        {/* Category header with gradient badge */}
                        <div className="flex items-center justify-between">
                          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg ${category.color}`}>
                            {category.name}
                            <span className="ml-2 bg-white/40 px-2 py-0.5 rounded-full text-xs font-black">
                              {category.items.length}
                            </span>
                          </div>
                        </div>

                        {/* Category items */}
                        <div className="space-y-2">
                          {category.items.map((item, index) => {
                            const itemKey = item.ingredient.toLowerCase();
                            const isChecked = checkedItems.has(itemKey);
                            return (
                              <div
                                key={`${category.name}-${index}`}
                                onClick={() => toggleItemChecked(itemKey)}
                                className={`flex items-start p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                                  isChecked
                                    ? 'bg-gray-100 border-gray-200 opacity-60'
                                    : 'bg-white border-green-100 hover:border-green-300 hover:shadow-md hover:scale-[1.01]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleItemChecked(itemKey);
                                  }}
                                  className="mt-1 mr-4 h-5 w-5 flex-shrink-0 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 border-2 rounded cursor-pointer transition-all appearance-none bg-white outline-none"
                                  style={{
                                    backgroundColor: isChecked ? '#10b981' : 'white',
                                    borderColor: isChecked ? '#10b981' : '#9ca3af',
                                    backgroundImage: isChecked ? 'url("data:image/svg+xml,%3csvg viewBox=\'0 0 16 16\' fill=\'white\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3cpath d=\'M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z\'/%3e%3c/svg%3e")' : 'none',
                                    backgroundSize: '100% 100%',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                  }}
                                />
                                <div className="flex-1">
                                  <div className={`font-semibold text-base leading-relaxed ${
                                    isChecked ? 'text-gray-500 line-through' : 'text-gray-900'
                                  }`}>
                                    <span className="text-green-600 font-black">{item.quantity}</span>{' '}
                                    <span>{item.ingredient}</span>
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1.5 flex items-center">
                                    <span className="font-medium text-gray-500">For:</span>
                                    <span className="ml-1.5 text-gray-700">{item.recipes.join(', ')}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Shopping List Stats */}
                    <div className="mt-6 pt-6 border-t-2 border-gray-200">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                          <div className="text-2xl font-black text-blue-600">
                            {categorizedList.reduce((sum, cat) => sum + cat.items.length, 0)}
                          </div>
                          <div className="text-xs font-semibold text-blue-700 mt-1">Total Items</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 shadow-sm">
                          <div className="text-2xl font-black text-green-600">
                            {checkedItems.size}
                          </div>
                          <div className="text-xs font-semibold text-green-700 mt-1">Checked Off</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200 shadow-sm">
                          <div className="text-2xl font-black text-orange-600">
                            {categorizedList.reduce((sum, cat) => sum + cat.items.length, 0) - checkedItems.size}
                          </div>
                          <div className="text-xs font-semibold text-orange-700 mt-1">Remaining</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};