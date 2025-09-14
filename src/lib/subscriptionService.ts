import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { auth } from './firebase';
import { db } from './firebase';
import type { 
  UserSubscription, 
  SubscriptionPlan, 
  SubscriptionPlanDetails 
} from '../types/subscription';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import { isUserAdmin } from './adminManagement';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

export class SubscriptionService {
  // Get user's current subscription (without expiry checking to prevent recursion)
  static async getUserSubscription(userId: string, skipExpiryCheck: boolean = false): Promise<UserSubscription | null> {
    try {
      const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, userId);
      const subscriptionSnap = await getDoc(subscriptionRef);
      
      if (!subscriptionSnap.exists()) {
        // Create default free subscription
        const defaultSubscription: UserSubscription = {
          userId,
          plan: 'free',
          status: 'active',
          startDate: new Date()
        };
        
        await this.setUserSubscription(userId, defaultSubscription);
        return defaultSubscription;
      }
      
      const data = subscriptionSnap.data();
      return {
        userId: data.userId,
        plan: data.plan,
        status: data.status,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate(),
        isAdmin: data.isAdmin || false
      };
    } catch (error) {
      // Only log non-network/permission errors to avoid console spam
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isKnownError = errorMsg.includes('permissions') || 
                          errorMsg.includes('blocked') || 
                          errorMsg.includes('network') ||
                          errorMsg.includes('firestore');
      
      if (!isKnownError) {
        console.error('Error getting user subscription:', error);
      }
      // Return default free subscription on any error (including permissions/network)
      return {
        userId,
        plan: 'free',
        status: 'active',
        startDate: new Date(),
        isAdmin: false
      };
    }
  }

  // Set user subscription (for admin testing and actual subscriptions)
  static async setUserSubscription(
    userId: string, 
    subscription: Partial<UserSubscription>
  ): Promise<boolean> {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        
        const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, userId);
        
        const subscriptionData = {
          userId,
          plan: subscription.plan || 'free',
          status: subscription.status || 'active',
          startDate: subscription.startDate ? Timestamp.fromDate(subscription.startDate) : serverTimestamp(),
          endDate: subscription.endDate ? Timestamp.fromDate(subscription.endDate) : null,
          isAdmin: subscription.isAdmin || false,
          updatedAt: serverTimestamp()
        };
        
        
        // Create timeout ID holder
        let timeoutId: NodeJS.Timeout | null = null;
        
        // Create a timeout promise that will reject after 8 seconds
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            console.error('[setUserSubscription] Write operation timed out after 8 seconds');
            reject(new Error('Write operation timeout: setDoc took longer than 8 seconds'));
          }, 8000);
        });
        
        // Wrap setDoc in its own timeout logic
        const writePromise = new Promise<void>(async (resolve, reject) => {
          try {
            await setDoc(subscriptionRef, subscriptionData, { merge: true });
            resolve();
          } catch (error) {
            console.error('[setUserSubscription] setDoc operation failed:', error);
            reject(error);
          }
        });
        
        // Race the write operation against the timeout
        try {
          await Promise.race([writePromise, timeoutPromise]);
          // Clear timeout if write succeeded
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        } catch (error) {
          console.error('[setUserSubscription] Write failed or timed out:', error);
          // Clear timeout on any error
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          throw error;
        }
        
        // Small delay to ensure write propagation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify the write actually succeeded by reading it back with timeout
        const verifyPromise = getDoc(subscriptionRef);
        const verifyTimeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Verification timeout')), 5000)
        );
        
        let verifyDoc;
        try {
          verifyDoc = await Promise.race([verifyPromise, verifyTimeoutPromise]);
        } catch (error) {
          console.error('[setUserSubscription] Verification read failed:', error);
          throw error;
        }
        
        if (verifyDoc.exists()) {
          const writtenData = verifyDoc.data();
          return true;
        } else {
          console.error('[setUserSubscription] Write failed: Document does not exist after write');
          throw new Error('Write verification failed: Document not found after write operation');
        }
        
      } catch (error) {
        console.error(`[setUserSubscription] Attempt ${attempt + 1} failed:`, error);
        
        const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        const isNetworkError = errorMsg.includes('blocked') || 
                              errorMsg.includes('network') ||
                              errorMsg.includes('fetch') ||
                              errorMsg.includes('cors') ||
                              errorMsg.includes('verification timeout') ||
                              errorMsg.includes('verification failed') ||
                              errorMsg.includes('write operation timeout') ||
                              errorMsg.includes('setdoc took longer than') ||
                              (error instanceof Error && error.message.includes('ERR_BLOCKED_BY_CLIENT'));
        
        // If it's a network error and we have retries left, wait and try again
        if (isNetworkError && attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        
        // Log non-network errors or final failures
        const isKnownError = errorMsg.includes('permissions') || 
                            errorMsg.includes('blocked') || 
                            errorMsg.includes('network') ||
                            errorMsg.includes('firestore');
        
        if (!isKnownError) {
          console.error('Error setting user subscription:', error);
        }
        
        // For network errors, throw them so they can be handled properly upstream
        if (isNetworkError) {
          throw new Error(`Network error: Request blocked or failed after ${maxRetries} attempts`);
        }
        
        return false;
      }
    }
    
    return false;
  }

  // Check if user is admin
  static async isUserAdmin(userEmail: string, userId?: string): Promise<boolean> {
    if (!userId || !userEmail) return false;
    return await isUserAdmin(userEmail, userId);
  }

  // Get subscription plan details
  static getPlanDetails(plan: SubscriptionPlan): SubscriptionPlanDetails {
    return SUBSCRIPTION_PLANS[plan];
  }

  // Check if user can save more recipes
  static async canUserSaveRecipe(userId: string, currentRecipeCount: number): Promise<{
    canSave: boolean;
    limit: number;
    plan: SubscriptionPlan;
  }> {
    try {
      const subscription = await this.getUserSubscriptionWithExpiryCheck(userId);
      const plan = subscription?.plan || 'free';
      const planDetails = this.getPlanDetails(plan);
      
      return {
        canSave: currentRecipeCount < planDetails.recipeLimit,
        limit: planDetails.recipeLimit,
        plan
      };
    } catch (error) {
      // Only log non-network/permission errors to avoid console spam
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isKnownError = errorMsg.includes('permissions') || 
                          errorMsg.includes('blocked') || 
                          errorMsg.includes('network') ||
                          errorMsg.includes('firestore');
      
      if (!isKnownError) {
        console.error('Error checking recipe limit:', error);
      }
      // Default to free plan limits on error
      const freePlan = this.getPlanDetails('free');
      return {
        canSave: currentRecipeCount < freePlan.recipeLimit,
        limit: freePlan.recipeLimit,
        plan: 'free'
      };
    }
  }

  // Admin function to set any user's plan (for testing)
  static async adminSetUserPlan(
    adminUserId: string,
    targetUserId: string,
    plan: SubscriptionPlan,
    userEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify admin privileges
      const isAdmin = await this.isUserAdmin(userEmail, adminUserId);
      if (!isAdmin) {
        const error = 'Unauthorized: Admin access required';
        console.error('[AdminSetUserPlan] Authorization failed:', error);
        throw new Error(error);
      }


      const subscription: Partial<UserSubscription> = {
        plan,
        status: 'active',
        startDate: new Date(),
        isAdmin: targetUserId === adminUserId // Mark admin's own account
      };


      const success = await this.setUserSubscription(targetUserId, subscription);
      
      if (success) {
        return { success: true };
      } else {
        const error = 'Failed to update subscription in Firestore';
        console.error('[AdminSetUserPlan] Subscription update failed');
        return { success: false, error };
      }

    } catch (error) {
      console.error('[AdminSetUserPlan] Error setting admin plan:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Network/connectivity errors
        if (errorMessage.includes('network') || 
            errorMessage.includes('blocked') ||
            errorMessage.includes('fetch') ||
            errorMessage.includes('cors') ||
            error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
          return { 
            success: false, 
            error: 'Network error: Request was blocked. Please check your ad blocker or network connection and try again.' 
          };
        }
        
        // Permission errors
        if (errorMessage.includes('permission') || 
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('forbidden')) {
          return { 
            success: false, 
            error: 'Permission denied: You don\'t have admin privileges to perform this action.' 
          };
        }
        
        // Firestore errors
        if (errorMessage.includes('firestore')) {
          return { 
            success: false, 
            error: 'Database error: Unable to update subscription. Please try again later.' 
          };
        }
      }
      
      return { 
        success: false, 
        error: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Validate subscription access for features with Firebase Auth
  static async validateFeatureAccess(
    userId: string,
    requiredPlan: SubscriptionPlan[]
  ): Promise<boolean> {
    try {
      // Ensure user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        console.warn('Feature access denied: User not authenticated or ID mismatch');
        return false;
      }

      // Get subscription with auth validation
      const subscription = await this.getUserSubscriptionSecure(userId);
      if (!subscription) return false;

      return requiredPlan.includes(subscription.plan);
    } catch (error) {
      console.error('Error validating feature access:', error);
      return false;
    }
  }

  // Secure subscription retrieval with auth validation
  static async getUserSubscriptionSecure(userId: string): Promise<UserSubscription | null> {
    try {
      // Verify current user matches requested user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('Access denied: No authenticated user');
        return null;
      }
      
      if (currentUser.uid !== userId) {
        console.warn('Access denied: User ID mismatch');
        return null;
      }

      // Get fresh auth token to ensure user is still valid
      const token = await currentUser.getIdToken(true);
      if (!token) {
        console.warn('Access denied: Invalid auth token');
        return null;
      }

      // Now get subscription data with expiry checking
      return await this.getUserSubscriptionWithExpiryCheck(userId);
    } catch (error) {
      console.error('Error getting secure subscription:', error);
      return null;
    }
  }

  // Cancel subscription (local Firestore only - use SubscriptionCancellationService for full cancellation)
  static async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const subscription: Partial<UserSubscription> = {
        plan: 'free',
        status: 'cancelled',
        startDate: new Date(),
        endDate: null
      };

      return await this.setUserSubscription(userId, subscription);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  // Secure feature check for specific features
  static async canAccessFeature(feature: string): Promise<boolean> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;

      const subscription = await this.getUserSubscriptionSecure(currentUser.uid);
      if (!subscription) return false;

      const planDetails = SUBSCRIPTION_PLANS[subscription.plan];

      switch (feature) {
        case 'mealPlanning':
          return planDetails.canUseMealPlanning;
        case 'defaultPreferences':
          return planDetails.canSetDefaultPreferences;
        case 'backupRestore':
          return planDetails.canBackupRestore;
        case 'advancedFilters':
          return planDetails.canUseAdvancedFilters;
        case 'exportPdf':
          return planDetails.canExportPdf;
        case 'nutritionAnalysis':
          return planDetails.canUseNutritionAnalysis;
        case 'collections':
          return planDetails.canUseCollections;
        case 'teamFeatures':
          return planDetails.canUseTeamFeatures;
        case 'apiAccess':
          return planDetails.canUseApiAccess;
        case 'conversions':
          return true; // All users can record conversions (limits are handled separately)
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  // Get user's current subscription with expiry checking
  static async getUserSubscriptionWithExpiryCheck(userId: string): Promise<UserSubscription | null> {
    try {
      // Import here to avoid circular dependency
      const { SubscriptionExpiryService } = await import('./subscriptionExpiryService');

      // First check if subscription has expired and handle downgrade
      await SubscriptionExpiryService.checkAndHandleExpiredSubscription(userId);

      // Then get the updated subscription
      return await this.getUserSubscription(userId, true);
    } catch (error) {
      console.error('Error getting subscription with expiry check:', error);
      // Fallback to regular subscription check
      return await this.getUserSubscription(userId, true);
    }
  }
}