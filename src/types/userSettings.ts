// Health goal types
export interface HealthGoal {
  id: string;
  type: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'performance' | 'lifestyle' | 'custom';
  title: string;
  description: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate?: Date;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

// Personal profile for enhanced AI personalization
export interface PersonalProfile {
  // Basic demographics
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';

  // Physical metrics
  height?: number;
  weight?: number;
  heightUnit: 'cm' | 'ft_in';
  weightUnit: 'kg' | 'lbs';

  // Health information
  allergies: string[];
  medicalConditions: string[];
  medications: string[];

  // Lifestyle preferences
  cookingSkillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  timeAvailableForCooking: 'under_15_min' | '15_30_min' | '30_60_min' | 'over_60_min';
  budgetPreference: 'budget_friendly' | 'moderate' | 'premium';

  // Health goals
  healthGoals: HealthGoal[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  // Profile settings
  displayName: string;
  email: string;
  profilePictureUrl?: string | null;

  // Personal profile for AI personalization
  personalProfile?: PersonalProfile;

  // Recipe preferences
  defaultDietaryFilters: string[];
  defaultServingSize: number;
  preferredUnits: 'metric' | 'imperial';

  // Health conditions (legacy - moving to personalProfile)
  healthConditions: string[];

  // Religious dietary requirements
  religiousRequirements: string[];

  // UI preferences
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de';
  compactView: boolean;

  // Notification preferences
  emailNotifications: boolean;
  marketingEmails: boolean;
  productUpdates: boolean;
  featuresAnnouncements: boolean;
  promotionalOffers: boolean;

  // Privacy settings
  profileVisible: boolean;
  shareRecipes: boolean;

  // Data settings
  autoSaveRecipes: boolean;
  backupToCloud: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_PERSONAL_PROFILE: Partial<PersonalProfile> = {
  activityLevel: 'moderately_active',
  heightUnit: 'cm',
  weightUnit: 'kg',
  allergies: [],
  medicalConditions: [],
  medications: [],
  cookingSkillLevel: 'intermediate',
  timeAvailableForCooking: '30_60_min',
  budgetPreference: 'moderate',
  healthGoals: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

export const DEFAULT_USER_SETTINGS: Partial<UserSettings> = {
  profilePictureUrl: null,
  personalProfile: DEFAULT_PERSONAL_PROFILE as PersonalProfile,
  defaultDietaryFilters: [],
  defaultServingSize: 4,
  preferredUnits: 'metric',
  healthConditions: [],
  religiousRequirements: [],
  theme: 'system',
  language: 'en',
  compactView: false,
  emailNotifications: true,
  marketingEmails: true,
  productUpdates: true,
  featuresAnnouncements: true,
  promotionalOffers: true,
  profileVisible: true,
  shareRecipes: true,
  autoSaveRecipes: false,
  backupToCloud: true
};

// Helper functions for health goals
export const createHealthGoal = (
  type: HealthGoal['type'],
  title: string,
  description: string,
  options?: Partial<HealthGoal>
): HealthGoal => ({
  id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  title,
  description,
  isActive: true,
  priority: 'medium',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...options
});

// Predefined health goal templates
export const HEALTH_GOAL_TEMPLATES = {
  weight_loss: {
    type: 'weight_loss' as const,
    title: 'Weight Loss Goal',
    description: 'Lose weight in a healthy and sustainable way',
    unit: 'kg'
  },
  weight_gain: {
    type: 'weight_gain' as const,
    title: 'Weight Gain Goal',
    description: 'Gain healthy weight through proper nutrition',
    unit: 'kg'
  },
  muscle_gain: {
    type: 'muscle_gain' as const,
    title: 'Muscle Building',
    description: 'Build lean muscle mass with high-protein nutrition',
    unit: 'kg'
  },
  performance: {
    type: 'performance' as const,
    title: 'Athletic Performance',
    description: 'Optimize nutrition for athletic performance and recovery',
    unit: undefined
  },
  lifestyle: {
    type: 'lifestyle' as const,
    title: 'Lifestyle Goal',
    description: 'Maintain a specific dietary lifestyle or restriction',
    unit: undefined
  }
};