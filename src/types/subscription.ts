export type SubscriptionPlan = 'free' | 'chef' | 'master-chef' | 'enterprise';

export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  basePrice: number;
  yearlyDiscount: number;
  recipeLimit: number;
  features: string[];
  conversionLimit: number;
  canExportPdf: boolean;
  canUseAdvancedFilters: boolean;
  canUseNutritionAnalysis: boolean;
  canUseCollections: boolean;
  canUseTeamFeatures: boolean;
  canUseApiAccess: boolean;
  canUseMealPlanning: boolean;
  canSetDefaultPreferences: boolean;
  canBackupRestore: boolean;
  canUploadProfilePicture: boolean;
  canUseHealthConditions: boolean;
}

export interface UserSubscription {
  userId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  startDate: Date;
  endDate?: Date | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  isAdmin?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanDetails> = {
  free: {
    id: 'free',
    name: 'Free',
    basePrice: 0,
    yearlyDiscount: 0,
    recipeLimit: 5,
    conversionLimit: 3,
    canExportPdf: false,
    canUseAdvancedFilters: false,
    canUseNutritionAnalysis: false,
    canUseCollections: false,
    canUseTeamFeatures: false,
    canUseApiAccess: false,
    canUseMealPlanning: false,
    canSetDefaultPreferences: false,
    canBackupRestore: false,
    canUploadProfilePicture: false,
    canUseHealthConditions: false,
    features: [
      '5 recipes in Recipe Book',
      '3 recipe conversions per day',
      'Basic diet filters (Vegan, Gluten-Free, Vegetarian, Dairy-Free)',
      '✗ No meal planning',
      '✗ No default preferences',
      '✗ No backup/restore'
    ]
  },
  chef: {
    id: 'chef',
    name: 'Chef',
    basePrice: 14.99,
    yearlyDiscount: 20,
    recipeLimit: 100,
    conversionLimit: 100,
    canExportPdf: false,
    canUseAdvancedFilters: true,
    canUseNutritionAnalysis: false,
    canUseCollections: false,
    canUseTeamFeatures: false,
    canUseApiAccess: false,
    canUseMealPlanning: true,
    canSetDefaultPreferences: true,
    canBackupRestore: false,
    canUploadProfilePicture: true,
    canUseHealthConditions: false,
    features: [
      'Everything in Free',
      '100 recipes in Recipe Book',
      '100 conversions per day',
      'All diet filters (12+ options)',
      'Meal planning calendar',
      'Default recipe preferences',
      'Custom profile pictures',
      '✗ Backup & restore recipes',
      '✗ Health Conditions'
    ]
  },
  'master-chef': {
    id: 'master-chef',
    name: 'Master Chef',
    basePrice: 19.99,
    yearlyDiscount: 20,
    recipeLimit: 1000,
    conversionLimit: 200,
    canExportPdf: true,
    canUseAdvancedFilters: true,
    canUseNutritionAnalysis: true,
    canUseCollections: true,
    canUseTeamFeatures: false,
    canUseApiAccess: false,
    canUseMealPlanning: true,
    canSetDefaultPreferences: true,
    canBackupRestore: true,
    canUploadProfilePicture: true,
    canUseHealthConditions: true,
    features: [
      'Everything in Chef plan',
      '1,000 recipes in Recipe Book',
      'Advanced nutrition analysis',
      'Recipe collections & tags',
      'Health Conditions',
      'Backup & restore recipes',
      'Priority support'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    basePrice: 39.95,
    yearlyDiscount: 25,
    recipeLimit: 2500,
    conversionLimit: 500,
    canExportPdf: true,
    canUseAdvancedFilters: true,
    canUseNutritionAnalysis: true,
    canUseCollections: true,
    canUseTeamFeatures: true,
    canUseApiAccess: true,
    canUseMealPlanning: true,
    canSetDefaultPreferences: true,
    canBackupRestore: true,
    canUploadProfilePicture: true,
    canUseHealthConditions: true,
    features: [
      '2,500 recipes per user',
      'Everything in Master Chef',
      'Team meal planning',
      'Organization-wide preferences',
      'Enterprise backup/restore',
      'Unlimited cloud storage',
      'Team collaboration',
      'API access',
      '24/7 phone support'
    ]
  }
};

