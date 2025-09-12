import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { getUserRecipes } from './firestore';
import { getUserSettings } from './userSettings';
import type { BackupData, RecoveryOptions } from '../types/backup';

const BACKUP_COLLECTION = 'backups';
const BACKUP_RETENTION_DAYS = 90;

// Create a backup of user's data
export const createBackup = async (userId: string): Promise<string> => {
  try {
    // Get user's recipes and settings
    const [recipes, settings] = await Promise.all([
      getUserRecipes(userId, 1000), // Get up to 1000 recipes
      getUserSettings(userId)
    ]);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + BACKUP_RETENTION_DAYS);

    const backupData = {
      userId,
      recipes: recipes.map(recipe => ({
        id: recipe.id,
        originalRecipe: recipe.originalRecipe,
        convertedRecipe: recipe.convertedRecipe,
        dietaryFilters: recipe.dietaryFilters,
        title: recipe.title,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt
      })),
      settings: {
        ...(settings.displayName !== undefined && { displayName: settings.displayName }),
        ...(settings.defaultDietaryFilters !== undefined && { defaultDietaryFilters: settings.defaultDietaryFilters }),
        ...(settings.defaultServingSize !== undefined && { defaultServingSize: settings.defaultServingSize }),
        ...(settings.preferredUnits !== undefined && { preferredUnits: settings.preferredUnits }),
        ...(settings.theme !== undefined && { theme: settings.theme }),
        ...(settings.language !== undefined && { language: settings.language }),
        ...(settings.compactView !== undefined && { compactView: settings.compactView }),
        ...(settings.emailNotifications !== undefined && { emailNotifications: settings.emailNotifications }),
        ...(settings.recipeReminders !== undefined && { recipeReminders: settings.recipeReminders }),
        ...(settings.profileVisible !== undefined && { profileVisible: settings.profileVisible }),
        ...(settings.shareRecipes !== undefined && { shareRecipes: settings.shareRecipes }),
        ...(settings.aiModelPreference !== undefined && { aiModelPreference: settings.aiModelPreference }),
        ...(settings.saveGeneratedRecipes !== undefined && { saveGeneratedRecipes: settings.saveGeneratedRecipes }),
        ...(settings.autoSaveRecipes !== undefined && { autoSaveRecipes: settings.autoSaveRecipes }),
        ...(settings.backupToCloud !== undefined && { backupToCloud: settings.backupToCloud })
      },
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiryDate)
    };

    const docRef = await addDoc(collection(db, BACKUP_COLLECTION), backupData);
    return docRef.id;
  } catch (error) {
    console.error('Failed to create backup:', error);
    throw new Error('Failed to create backup');
  }
};

// Get user's backup history
export const getUserBackups = async (userId: string): Promise<BackupData[]> => {
  try {
    const q = query(
      collection(db, BACKUP_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const backups: BackupData[] = [];
    const now = new Date();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate();
      
      // Filter out expired backups in application logic
      if (!expiresAt || expiresAt > now) {
        backups.push({
          id: doc.id,
          userId: data.userId,
          recipes: data.recipes,
          settings: data.settings,
          createdAt: data.createdAt?.toDate(),
          expiresAt: expiresAt
        } as BackupData);
      }
    });

    // Sort by createdAt in descending order (most recent first)
    backups.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Return only the first 10 non-expired backups
    return backups.slice(0, 10);
  } catch (error) {
    console.error('Failed to get backups:', error);
    if (error.message && (
      error.message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
      error.message.includes('ERR_BLOCKED_BY_CLIENT') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError')
    )) {
      console.warn('Network request blocked by client (ad blocker or extension). Returning empty backup list.');
      return [];
    }
    // For any other Firebase/network errors, return empty array instead of throwing
    console.warn('Backup retrieval failed, returning empty backup list.');
    return [];
  }
};

// Restore data from backup
export const restoreFromBackup = async (
  userId: string, 
  backupId: string, 
  options: RecoveryOptions
): Promise<{ restoredRecipes: number; restoredSettings: boolean; skippedDuplicates: number }> => {
  try {
    // Get the specific backup
    const backups = await getUserBackups(userId);
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) {
      throw new Error('Backup not found or expired');
    }

    let restoredRecipes = 0;
    let restoredSettings = false;
    let skippedDuplicates = 0;

    // Restore recipes if requested
    if (options.includeRecipes && backup.recipes) {
      const { saveRecipe, getUserRecipes } = await import('./firestore');
      
      // Get existing recipes to check for duplicates
      const existingRecipes = await getUserRecipes(userId, 1000);
      
      for (const recipe of backup.recipes) {
        // Check if recipe falls within date range
        if (recipe.createdAt >= options.dateRange.start && 
            recipe.createdAt <= options.dateRange.end) {
          
          // Check if recipe already exists by comparing content
          const isDuplicate = existingRecipes.some(existing => {
            // Check if the converted recipe content is identical
            const normalizeContent = (content: string) => 
              content.replace(/\s+/g, ' ').trim().toLowerCase();
            
            return normalizeContent(existing.convertedRecipe) === 
                   normalizeContent(recipe.convertedRecipe) ||
                   // Also check if title already exists with "(Restored)" suffix
                   existing.title === `${recipe.title} (Restored)` ||
                   existing.title === recipe.title;
          });
          
          if (!isDuplicate) {
            try {
              await saveRecipe(
                userId,
                recipe.originalRecipe,
                recipe.convertedRecipe,
                recipe.dietaryFilters,
                `${recipe.title} (Restored)`
              );
              restoredRecipes++;
            } catch (error) {
              console.error('Failed to restore recipe:', recipe.title, error);
            }
          } else {
            console.log('Skipping duplicate recipe:', recipe.title);
            skippedDuplicates++;
          }
        }
      }
    }

    // Restore settings if requested
    if (options.includeSettings && backup.settings) {
      try {
        const { updateUserSettings } = await import('./userSettings');
        await updateUserSettings(userId, backup.settings);
        restoredSettings = true;
      } catch (error) {
        console.error('Failed to restore settings:', error);
      }
    }

    return { restoredRecipes, restoredSettings, skippedDuplicates };
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    throw new Error('Failed to restore data from backup');
  }
};

// Delete a specific backup
export const deleteBackup = async (backupId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, BACKUP_COLLECTION, backupId));
  } catch (error) {
    console.error('Failed to delete backup:', error);
    throw new Error('Failed to delete backup');
  }
};

// Clean up expired backups (should be run periodically)
export const cleanupExpiredBackups = async (): Promise<number> => {
  try {
    const q = query(
      collection(db, BACKUP_COLLECTION),
      where('expiresAt', '<=', new Date())
    );

    const querySnapshot = await getDocs(q);
    let deletedCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(doc(db, BACKUP_COLLECTION, docSnapshot.id));
      deletedCount++;
    }

    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup expired backups:', error);
    throw new Error('Failed to cleanup expired backups');
  }
};

// Schedule automatic backup (call when backup setting is enabled)
export const scheduleAutoBackup = async (userId: string): Promise<void> => {
  try {
    // Check if user already has a recent backup (within last 24 hours)
    const recentBackups = await getUserBackups(userId);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const hasRecentBackup = recentBackups.some(backup => 
      backup.createdAt && backup.createdAt > oneDayAgo
    );

    if (!hasRecentBackup) {
      await createBackup(userId);
      console.log('Automatic backup created for user:', userId);
    }
  } catch (error) {
    console.error('Failed to schedule auto backup:', error);
  }
};