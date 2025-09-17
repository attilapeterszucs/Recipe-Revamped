export interface BackupRecipe {
  id: string;
  originalRecipe: string;
  convertedRecipe: string;
  dietaryFilters?: string[];
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackupData {
  id: string;
  userId: string;
  recipes: BackupRecipe[]; // Array of user's recipes
  settings: Record<string, unknown>; // User settings
  createdAt: Date;
  expiresAt: Date; // 90 days from creation
}

export interface RecoveryOptions {
  includeRecipes: boolean;
  includeSettings: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
}