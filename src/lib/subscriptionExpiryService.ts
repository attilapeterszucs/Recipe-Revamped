import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { SubscriptionService } from './subscriptionService';
import type { UserSubscription } from '../types/subscription';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

export class SubscriptionExpiryService {

  /**
   * Check if a subscription has expired and handle the downgrade
   */
  static async checkAndHandleExpiredSubscription(userId: string): Promise<{
    wasExpired: boolean;
    downgradedToPlan?: string;
    originalPlan?: string;
  }> {
    try {
      const subscription = await SubscriptionService.getUserSubscription(userId, true); // Skip expiry check to avoid recursion

      if (!subscription) {
        return { wasExpired: false };
      }

      // Skip if already on free plan
      if (subscription.plan === 'free') {
        return { wasExpired: false };
      }

      const now = new Date();
      const endDate = subscription.endDate;

      // Check if subscription has expired
      if (endDate && endDate <= now) {
        // Subscription expired - downgrading to free

        const originalPlan = subscription.plan;

        // Downgrade to free plan
        const success = await SubscriptionService.setUserSubscription(userId, {
          plan: 'free',
          status: 'active',
          startDate: now,
          endDate: null
        });

        if (success) {
          // User downgraded to free due to expiry

          // Trigger UI refresh
          window.dispatchEvent(new CustomEvent('subscription-expired', {
            detail: {
              userId,
              originalPlan,
              newPlan: 'free',
              expiredAt: endDate
            }
          }));

          return {
            wasExpired: true,
            downgradedToPlan: 'free',
            originalPlan
          };
        }
      }

      return { wasExpired: false };

    } catch (error) {
      console.error('❌ Error checking subscription expiry:', error);
      return { wasExpired: false };
    }
  }

  /**
   * Check if subscription is cancelled but still active (before expiry)
   */
  static async getSubscriptionStatus(userId: string): Promise<{
    plan: string;
    status: string;
    isCancelled: boolean;
    isActive: boolean;
    willExpireAt?: Date;
    daysUntilExpiry?: number;
  }> {
    try {
      const subscription = await SubscriptionService.getUserSubscription(userId, true); // Skip expiry check to avoid recursion

      if (!subscription) {
        return {
          plan: 'free',
          status: 'active',
          isCancelled: false,
          isActive: true
        };
      }

      const now = new Date();
      const endDate = subscription.endDate;
      const isCancelled = subscription.status === 'cancelled';

      // Check if still active (not expired)
      const isActive = !endDate || endDate > now;

      let daysUntilExpiry: number | undefined;
      if (endDate && isActive) {
        daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        plan: subscription.plan,
        status: subscription.status || 'active',
        isCancelled,
        isActive,
        willExpireAt: endDate || undefined,
        daysUntilExpiry
      };

    } catch (error) {
      console.error('❌ Error getting subscription status:', error);
      return {
        plan: 'free',
        status: 'active',
        isCancelled: false,
        isActive: true
      };
    }
  }

  /**
   * Check if user has a cancelled subscription that's still active
   */
  static async hasCancelledButActiveSubscription(userId: string): Promise<{
    hasCancelledActive: boolean;
    plan?: string;
    expiresAt?: Date;
    daysRemaining?: number;
  }> {
    try {
      const status = await this.getSubscriptionStatus(userId);

      if (status.isCancelled && status.isActive && status.plan !== 'free') {
        return {
          hasCancelledActive: true,
          plan: status.plan,
          expiresAt: status.willExpireAt,
          daysRemaining: status.daysUntilExpiry
        };
      }

      return { hasCancelledActive: false };

    } catch (error) {
      console.error('❌ Error checking cancelled but active subscription:', error);
      return { hasCancelledActive: false };
    }
  }

  /**
   * Batch check for expired subscriptions (useful for periodic cleanup)
   */
  static async batchCheckExpiredSubscriptions(): Promise<{
    checkedCount: number;
    expiredCount: number;
    downgradedUsers: string[];
  }> {
    try {
      console.log('🔄 Starting batch expiry check...');

      // Query for subscriptions that might be expired
      const now = new Date();
      const subscriptionsQuery = query(
        collection(db, SUBSCRIPTIONS_COLLECTION),
        where('plan', '!=', 'free'),
        where('endDate', '<=', Timestamp.fromDate(now))
      );

      const querySnapshot = await getDocs(subscriptionsQuery);
      const checkedCount = querySnapshot.size;
      const downgradedUsers: string[] = [];

      console.log(`📊 Found ${checkedCount} potentially expired subscriptions`);

      for (const docSnapshot of querySnapshot.docs) {
        const userId = docSnapshot.id;
        const data = docSnapshot.data();

        // Skip if already processed or is a Stripe customer ID
        if (userId.startsWith('cus_') || userId.startsWith('temp_')) {
          continue;
        }

        try {
          const result = await this.checkAndHandleExpiredSubscription(userId);
          if (result.wasExpired) {
            downgradedUsers.push(userId);
          }
        } catch (error) {
          console.error(`❌ Error processing expiry for user ${userId}:`, error);
        }
      }

      // Batch expiry check complete

      return {
        checkedCount,
        expiredCount: downgradedUsers.length,
        downgradedUsers
      };

    } catch (error) {
      console.error('❌ Error in batch expiry check:', error);
      return {
        checkedCount: 0,
        expiredCount: 0,
        downgradedUsers: []
      };
    }
  }

  /**
   * Initialize expiry checking for the current user
   */
  static initializeExpiryCheck(userId: string): NodeJS.Timeout | null {
    try {
      // Check immediately on initialization
      this.checkAndHandleExpiredSubscription(userId);

      // Set up periodic checking (every hour)
      const intervalId = setInterval(() => {
        this.checkAndHandleExpiredSubscription(userId);
      }, 60 * 60 * 1000); // 1 hour

      return intervalId;

    } catch (error) {
      console.error('❌ Error initializing expiry check:', error);
      return null;
    }
  }

  /**
   * Get user-friendly expiry message for cancelled subscriptions
   */
  static getExpiryMessage(daysRemaining: number, plan: string): string {
    if (daysRemaining <= 0) {
      return 'Your subscription has expired and you are now on the free plan.';
    } else if (daysRemaining === 1) {
      return `Your ${plan.replace('-', ' ')} subscription will expire tomorrow and you will be moved to the free plan.`;
    } else if (daysRemaining <= 7) {
      return `Your ${plan.replace('-', ' ')} subscription will expire in ${daysRemaining} days and you will be moved to the free plan.`;
    } else {
      return `Your ${plan.replace('-', ' ')} subscription is cancelled and will expire in ${daysRemaining} days.`;
    }
  }
}

// Helper function to set up expiry event listeners
export const setupExpiryEventListeners = () => {
  // Listen for subscription expiry events
  window.addEventListener('subscription-expired', (event: CustomEvent) => {
    console.log('🔔 Subscription expiry event received:', event.detail);

    // Force refresh subscription context
    window.dispatchEvent(new CustomEvent('refresh-subscription'));
  });
};

export default SubscriptionExpiryService;