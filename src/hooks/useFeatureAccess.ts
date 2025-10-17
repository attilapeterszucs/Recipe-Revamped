import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSubscriptionStatus } from './useSubscriptionStatus';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionPlan } from '../types/subscription';
import { UsageTracker } from '../lib/usageTracking';
import { SubscriptionService } from '../lib/subscriptionService';
import { logger } from '../lib/logger';

interface FeatureAccess {
  // Recipe features
  canSaveRecipes: boolean;
  recipeLimit: number;
  currentRecipeCount: number;

  // Conversion features
  canConvert: boolean;
  conversionLimit: number;
  conversionsUsedToday: number;
  recordConversion: () => Promise<boolean>;

  // Export features
  canExportPdf: boolean;

  // Filter features
  canUseAdvancedFilters: boolean;

  // Analysis features
  canUseNutritionAnalysis: boolean;

  // Organization features
  canUseCollections: boolean;

  // Team features
  canUseTeamFeatures: boolean;

  // API features
  canUseApiAccess: boolean;

  // Meal planning features
  canUseMealPlanning: boolean;
  canGenerateWeeklyMenu: boolean;

  // Settings features
  canSetDefaultPreferences: boolean;

  // Backup features
  canBackupRestore: boolean;

  // Profile features
  canUploadProfilePicture: boolean;

  // Health features
  canUseHealthConditions: boolean;
  canUseHealthGoals: boolean;

  // Dietary filter features
  availableDietaryFilters: string[];

  // Plan info
  currentPlan: SubscriptionPlan;
  planDetails: typeof SUBSCRIPTION_PLANS[SubscriptionPlan];

  // Refresh function
  refreshFeatures: () => void;
  refreshConversions: () => Promise<void>;
}

export const useFeatureAccess = (
  userId?: string, 
  userEmail?: string,
  currentRecipeCount: number = 0
): FeatureAccess => {
  const { subscription, loading, isAdmin, refresh: refreshSubscription } = useSubscriptionStatus(userId, userEmail);
  const [conversionsUsedToday, setConversionsUsedToday] = useState(0);
  
  // Get all available dietary filters from environment
  const allDietaryFilters = (import.meta.env.VITE_ALLOWED_FILTERS as string).split(',');
  const basicFilters = allDietaryFilters.slice(0, 4); // First 4 filters for Free plan
  const chefFilters = allDietaryFilters.slice(0, 12); // First 12 filters for Chef plan
  
  // Function to fetch conversion count
  const fetchConversions = useCallback(async () => {
    if (userId) {
      try {
        // Validate user can access usage data
        const subscription = await SubscriptionService.getUserSubscriptionSecure(userId);
        if (subscription) {
          const count = await UsageTracker.getTodaysConversions(userId);
          // Fetched today's conversions
          setConversionsUsedToday(count);
        }
      } catch (error) {
        // Error fetching conversions, defaulting to 0
        setConversionsUsedToday(0);
      }
    }
  }, [userId]);

  // Fetch today's conversion count with auth validation
  useEffect(() => {
    fetchConversions();
  }, [userId]);
  
  // Function to record a conversion and update count with auth validation
  const recordConversion = async (): Promise<boolean> => {
    if (!userId) {
      // No userId available for recording conversion
      return false;
    }
    
    try {
      // Checking feature access for conversions
      // Validate user can record conversions
      const hasAccess = await SubscriptionService.canAccessFeature('conversions');
      // Feature access verified
      if (!hasAccess) {
        // User does not have access to conversions feature
        return false;
      }
      
      // Recording conversion
      const success = await UsageTracker.recordConversion(userId);
      // Conversion recording result obtained
      if (success) {
        // Updating local conversion count
        // Update local count immediately
        setConversionsUsedToday(prev => prev + 1);
      }
      return success;
    } catch (error) {
      logger.error('Error recording conversion:', { error });
      return false;
    }
  };
  
  const featureAccess = useMemo(() => {
    const plan = subscription?.plan || 'free';
    const planDetails = SUBSCRIPTION_PLANS[plan];

    // Admins are restricted by their subscription plan, not unlimited access
    // Feature access is determined by subscription plan for all users (including admins)
    return {
      // Recipe features
      canSaveRecipes: currentRecipeCount < planDetails.recipeLimit,
      recipeLimit: planDetails.recipeLimit,
      currentRecipeCount,
      
      // Conversion features
      canConvert: planDetails.conversionLimit === -1 || conversionsUsedToday < planDetails.conversionLimit,
      conversionLimit: planDetails.conversionLimit,
      conversionsUsedToday,
      recordConversion,
      
      // Export features
      canExportPdf: planDetails.canExportPdf,
      
      // Filter features
      canUseAdvancedFilters: planDetails.canUseAdvancedFilters,
      
      // Analysis features
      canUseNutritionAnalysis: planDetails.canUseNutritionAnalysis,
      
      // Organization features
      canUseCollections: planDetails.canUseCollections,
      
      // Team features
      canUseTeamFeatures: planDetails.canUseTeamFeatures,
      
      // API features
      canUseApiAccess: planDetails.canUseApiAccess,
      
      // Meal planning features
      canUseMealPlanning: planDetails.canUseMealPlanning,
      canGenerateWeeklyMenu: planDetails.canGenerateWeeklyMenu,

      // Settings features
      canSetDefaultPreferences: planDetails.canSetDefaultPreferences,
      
      // Backup features
      canBackupRestore: planDetails.canBackupRestore,
      
      // Profile features
      canUploadProfilePicture: planDetails.canUploadProfilePicture,
      
      // Health features
      canUseHealthConditions: planDetails.canUseHealthConditions,
      canUseHealthGoals: planDetails.canUseHealthGoals,
      
      // Dietary filter features - based on plan
      availableDietaryFilters: (() => {
        switch (plan) {
          case 'free':
            return basicFilters;
          case 'chef':
            return chefFilters;
          case 'master-chef':
          case 'enterprise':
            return allDietaryFilters;
          default:
            return basicFilters;
        }
      })(),
      
      // Plan info
      currentPlan: plan,
      planDetails,
      
      // Refresh function
      refreshFeatures: refreshSubscription,
      refreshConversions: fetchConversions
    };
  }, [subscription, isAdmin, currentRecipeCount, conversionsUsedToday, recordConversion, refreshSubscription, fetchConversions]);
  
  return featureAccess;
};