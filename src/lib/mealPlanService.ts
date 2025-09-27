import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { SavedRecipe } from './validation';
import { logger } from './logger';

const MEAL_PLANS_COLLECTION = 'mealPlans';

export interface MealPlan {
  [key: string]: {
    breakfast?: SavedRecipe[]; // Up to 3 breakfast recipes
    lunch?: SavedRecipe[]; // Up to 5 lunch recipes  
    dinner?: SavedRecipe[]; // Up to 3 dinner recipes
    snacks?: SavedRecipe[]; // Unlimited snacks
  };
}

export interface SavedMealPlan {
  id: string;
  userId: string;
  weekStart: string; // ISO date string for Monday of the week
  mealPlan: MealPlan;
  createdAt: Date;
  updatedAt: Date;
}

export class MealPlanService {
  // Get meal plan for a specific week
  static async getMealPlan(userId: string, weekStart: string): Promise<MealPlan | null> {
    try {
      const mealPlanId = `${userId}_${weekStart}`;
      const mealPlanRef = doc(db, MEAL_PLANS_COLLECTION, mealPlanId);
      const mealPlanSnap = await getDoc(mealPlanRef);
      
      if (!mealPlanSnap.exists()) {
        return null;
      }
      
      const data = mealPlanSnap.data();
      const rawMealPlan = data.mealPlan || {};
      
      // Migrate old format to new format (single recipes to arrays)
      const migratedMealPlan: MealPlan = {};
      
      Object.keys(rawMealPlan).forEach(dateKey => {
        const dayMeals = rawMealPlan[dateKey];
        migratedMealPlan[dateKey] = {
          breakfast: dayMeals.breakfast ? (Array.isArray(dayMeals.breakfast) ? dayMeals.breakfast : [dayMeals.breakfast]) : undefined,
          lunch: dayMeals.lunch ? (Array.isArray(dayMeals.lunch) ? dayMeals.lunch : [dayMeals.lunch]) : undefined,
          dinner: dayMeals.dinner ? (Array.isArray(dayMeals.dinner) ? dayMeals.dinner : [dayMeals.dinner]) : undefined,
          snacks: dayMeals.snacks ? (Array.isArray(dayMeals.snacks) ? dayMeals.snacks : [dayMeals.snacks]) : undefined
        };
      });
      
      return migratedMealPlan;
    } catch (error) {
      // Handle network/permission errors gracefully
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isKnownError = errorMsg.includes('permissions') || 
                          errorMsg.includes('blocked') || 
                          errorMsg.includes('network') ||
                          errorMsg.includes('firestore');
      
      if (!isKnownError) {
        logger.error('Error getting meal plan:', { error });
      }
      return null;
    }
  }

  // Save meal plan for a specific week
  static async saveMealPlan(
    userId: string, 
    weekStart: string, 
    mealPlan: MealPlan
  ): Promise<boolean> {
    try {
      const mealPlanId = `${userId}_${weekStart}`;
      const mealPlanRef = doc(db, MEAL_PLANS_COLLECTION, mealPlanId);
      
      // Clean undefined values from meal plan before saving to Firestore
      const cleanedMealPlan: MealPlan = {};
      Object.keys(mealPlan).forEach(dateKey => {
        const dayMeals = mealPlan[dateKey];
        const cleanedDayMeals: any = {};
        
        if (dayMeals.breakfast && dayMeals.breakfast.length > 0) {
          cleanedDayMeals.breakfast = dayMeals.breakfast;
        }
        if (dayMeals.lunch && dayMeals.lunch.length > 0) {
          cleanedDayMeals.lunch = dayMeals.lunch;
        }
        if (dayMeals.dinner && dayMeals.dinner.length > 0) {
          cleanedDayMeals.dinner = dayMeals.dinner;
        }
        if (dayMeals.snacks && dayMeals.snacks.length > 0) {
          cleanedDayMeals.snacks = dayMeals.snacks;
        }
        
        // Only add the day if it has at least one meal
        if (Object.keys(cleanedDayMeals).length > 0) {
          cleanedMealPlan[dateKey] = cleanedDayMeals;
        }
      });
      
      const mealPlanData = {
        id: mealPlanId,
        userId,
        weekStart,
        mealPlan: cleanedMealPlan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(mealPlanRef, mealPlanData, { merge: true });
      return true;
    } catch (error) {
      // Handle network/permission errors gracefully
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isKnownError = errorMsg.includes('permissions') || 
                          errorMsg.includes('blocked') || 
                          errorMsg.includes('network') ||
                          errorMsg.includes('firestore');
      
      if (!isKnownError) {
        logger.error('Error saving meal plan:', { error });
      }
      return false;
    }
  }

  // Helper to get Monday of a given week (for consistent week identification)
  static getMondayOfWeek(date: Date): string {
    const currentDate = new Date(date);
    const dayOfWeek = currentDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days to Monday
    
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + mondayOffset);
    
    return monday.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }
}