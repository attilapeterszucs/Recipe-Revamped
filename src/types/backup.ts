export interface BackupData {
  id: string;
  userId: string;
  recipes: any[]; // Array of user's recipes
  settings: any; // User settings
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