import { auth } from './firebase';
import { SubscriptionService } from './subscriptionService';
import { SubscriptionExpiryService } from './subscriptionExpiryService';
import type { UserSubscription } from '../types/subscription';

// Temporary workaround: Use Firebase Functions instead of standalone webhook
const CLOUD_FUNCTION_URL = import.meta.env.VITE_STRIPE_WEBHOOK_URL ||'https://us-central1-reciperevamped.cloudfunctions.net/stripe-webhook';

export interface CancellationRequest {
  userId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  reason?: string;
}

export interface CancellationResponse {
  success: boolean;
  message?: string;
  userId?: string;
  currentPlan?: string; // Plan remains active until expiry
  willDowngradeTo?: string;
  willDowngradeAt?: string;
  cancelledAt?: string;
  error?: string;
  processing_time?: number;
}

export class SubscriptionCancellationService {

  /**
   * Cancel user's subscription in both Stripe and Firestore
   */
  static async cancelSubscription(reason?: string): Promise<CancellationResponse> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log(`🚫 Starting subscription cancellation for user: ${currentUser.uid}`);

      // Get current subscription details
      const currentSubscription = await SubscriptionService.getUserSubscription(currentUser.uid);
      if (!currentSubscription || currentSubscription.plan === 'free') {
        return {
          success: false,
          error: 'No active subscription found to cancel'
        };
      }

      // Prepare cancellation request
      const cancellationRequest: CancellationRequest = {
        userId: currentUser.uid,
        stripeSubscriptionId: currentSubscription.stripeSubscriptionId || undefined,
        stripeCustomerId: currentSubscription.stripeCustomerId || undefined,
        reason: reason || 'User requested cancellation'
      };

      console.log('📋 Cancellation request:', cancellationRequest);

      // Get auth token for authenticated request
      const idToken = await currentUser.getIdToken();

      // Call Cloud Function to cancel subscription
      const response = await fetch(`${CLOUD_FUNCTION_URL}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify(cancellationRequest)
      });

      const result: CancellationResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (result.success) {
        console.log('✅ Subscription cancelled successfully:', result);

        // Force refresh subscription status in UI
        // This will trigger a re-fetch of user subscription data
        window.dispatchEvent(new CustomEvent('subscription-cancelled', {
          detail: result
        }));

        return result;
      } else {
        throw new Error(result.error || 'Cancellation failed');
      }

    } catch (error) {
      console.error('❌ Subscription cancellation error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to cancel subscription. Please try again or contact support.'
      };
    }
  }

  /**
   * Downgrade user to free plan (local Firestore only)
   * Use this as a fallback if Stripe cancellation fails
   */
  static async downgradeToFree(userId: string, reason?: string): Promise<boolean> {
    try {
      console.log(`⬇️ Downgrading user to free plan: ${userId}`);

      const success = await SubscriptionService.setUserSubscription(userId, {
        plan: 'free',
        status: 'active',
        startDate: new Date(),
        endDate: null
      });

      if (success) {
        console.log('✅ User downgraded to free plan locally');

        // Trigger UI refresh
        window.dispatchEvent(new CustomEvent('subscription-downgraded', {
          detail: { userId, newPlan: 'free', reason }
        }));
      }

      return success;
    } catch (error) {
      console.error('❌ Local downgrade failed:', error);
      return false;
    }
  }

  /**
   * Check if user can cancel their subscription
   */
  static async canCancelSubscription(userId: string): Promise<{
    canCancel: boolean;
    reason?: string;
    currentPlan?: string;
  }> {
    try {
      const subscription = await SubscriptionService.getUserSubscription(userId);

      if (!subscription) {
        return {
          canCancel: false,
          reason: 'No subscription found'
        };
      }

      if (subscription.plan === 'free') {
        return {
          canCancel: false,
          reason: 'Already on free plan',
          currentPlan: 'free'
        };
      }

      if (subscription.status === 'cancelled') {
        return {
          canCancel: false,
          reason: 'Subscription already cancelled',
          currentPlan: subscription.plan
        };
      }

      return {
        canCancel: true,
        currentPlan: subscription.plan
      };

    } catch (error) {
      console.error('❌ Error checking cancellation eligibility:', error);
      return {
        canCancel: false,
        reason: 'Error checking subscription status'
      };
    }
  }

  /**
   * Get cancellation preview (what happens when user cancels)
   */
  static async getCancellationPreview(userId: string): Promise<{
    currentPlan: string;
    willLoseAccess: string[];
    willKeepAccess: string[];
    effectiveDate: Date;
    expiryDate?: Date;
    daysUntilExpiry?: number;
    immediateChange: boolean;
  } | null> {
    try {
      const subscription = await SubscriptionService.getUserSubscription(userId);
      if (!subscription || subscription.plan === 'free') {
        return null;
      }

      const currentPlanDetails = SubscriptionService.getPlanDetails(subscription.plan);
      const freePlanDetails = SubscriptionService.getPlanDetails('free');

      // Features they'll lose
      const willLoseAccess = currentPlanDetails.features.filter(feature =>
        !feature.includes('✗') &&
        !freePlanDetails.features.some(freeFeature => freeFeature === feature)
      );

      // Features they'll keep (free plan features)
      const willKeepAccess = freePlanDetails.features.filter(feature =>
        !feature.includes('✗')
      );

      // Check if subscription has an end date (will keep access until then)
      const expiryDate = subscription.endDate;
      const now = new Date();
      const immediateChange = !expiryDate || expiryDate <= now;

      let daysUntilExpiry: number | undefined;
      if (expiryDate && expiryDate > now) {
        daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        currentPlan: subscription.plan,
        willLoseAccess,
        willKeepAccess,
        effectiveDate: expiryDate && expiryDate > now ? expiryDate : now,
        expiryDate,
        daysUntilExpiry,
        immediateChange
      };

    } catch (error) {
      console.error('❌ Error getting cancellation preview:', error);
      return null;
    }
  }

  /**
   * Handle cancellation confirmation with reason
   */
  static async confirmCancellation(reason: string, feedback?: string): Promise<CancellationResponse> {
    try {
      const fullReason = feedback ? `${reason}: ${feedback}` : reason;

      // Log cancellation reason for analytics
      console.log('📊 Cancellation reason:', fullReason);

      return await this.cancelSubscription(fullReason);

    } catch (error) {
      console.error('❌ Cancellation confirmation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Helper function to listen for subscription events
export const setupSubscriptionEventListeners = () => {
  // Listen for subscription cancellation events
  window.addEventListener('subscription-cancelled', (event: CustomEvent) => {
    console.log('🔔 Subscription cancellation event received:', event.detail);

    // Force refresh subscription context
    window.dispatchEvent(new CustomEvent('refresh-subscription'));
  });

  // Listen for subscription downgrade events
  window.addEventListener('subscription-downgraded', (event: CustomEvent) => {
    console.log('🔔 Subscription downgrade event received:', event.detail);

    // Force refresh subscription context
    window.dispatchEvent(new CustomEvent('refresh-subscription'));
  });
};

export default SubscriptionCancellationService;