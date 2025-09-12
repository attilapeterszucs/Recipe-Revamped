export interface UserSettings {
  // Profile settings
  displayName: string;
  email: string;
  profilePictureUrl?: string | null;
  
  // Recipe preferences
  defaultDietaryFilters: string[];
  defaultServingSize: number;
  preferredUnits: 'metric' | 'imperial';
  
  // Health conditions
  healthConditions: string[];
  
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

export const DEFAULT_USER_SETTINGS: Partial<UserSettings> = {
  profilePictureUrl: null,
  defaultDietaryFilters: [],
  defaultServingSize: 4,
  preferredUnits: 'metric',
  healthConditions: [],
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