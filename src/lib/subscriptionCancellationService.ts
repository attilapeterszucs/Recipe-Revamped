import { auth } from './firebase';
import { SubscriptionService } from './subscriptionService';
import { SubscriptionExpiryService } from './subscriptionExpiryService';
import type { UserSubscription } from '../types/subscription';

// Use the correct Cloud Run service URL for stripe webhook
const STRIPE_WEBHOOK_URL = import.meta.env.VITE_STRIPE_WEBHOOK_URL || 'https://stripe-webhook-428797186446.us-central1.run.app';

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
  note?: string;
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


      // Get current subscription details
      const currentSubscription = await SubscriptionService.getUserSubscription(currentUser.uid);
      if (!currentSubscription || currentSubscription.plan === 'free') {
        return {
          success: false,
          error: 'No active subscription found to cancel'
        };
      }

      // Check if we have Stripe IDs
      const stripeSubscriptionId = currentSubscription.stripeSubscriptionId;
      const stripeCustomerId = currentSubscription.stripeCustomerId;

      if (!stripeSubscriptionId && !stripeCustomerId) {
        // For subscriptions without Stripe IDs (like admin-set/test subscriptions), delete completely
        const success = await SubscriptionService.deleteSubscription(currentUser.uid);

        if (success) {
          // Trigger UI refresh
          window.dispatchEvent(new CustomEvent('subscription-cancelled', {
            detail: {
              userId: currentUser.uid,
              currentPlan: 'free',
              willDowngradeTo: 'free',
              cancelledAt: new Date().toISOString(),
              note: 'Test/admin subscription deleted - no Stripe subscription found'
            }
          }));

          return {
            success: true,
            message: 'Subscription cancelled successfully',
            userId: currentUser.uid,
            currentPlan: 'free',
            willDowngradeTo: 'free',
            cancelledAt: new Date().toISOString(),
            note: 'Test/admin subscription deleted - immediately reverted to free plan'
          };
        } else {
          return {
            success: false,
            error: 'Failed to delete test/admin subscription'
          };
        }
      }

      // Prepare cancellation request with Stripe IDs
      const cancellationRequest: CancellationRequest = {
        userId: currentUser.uid,
        stripeSubscriptionId: stripeSubscriptionId || undefined,
        stripeCustomerId: stripeCustomerId || undefined,
        reason: reason || 'User requested cancellation'
      };


      // Get auth token for authenticated request
      const idToken = await currentUser.getIdToken();

      // Call Cloud Run webhook service to cancel subscription
      const response = await fetch(`${STRIPE_WEBHOOK_URL}/cancel-subscription`, {
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

      const success = await SubscriptionService.setUserSubscription(userId, {
        plan: 'free',
        status: 'active',
        startDate: new Date(),
        endDate: null
      });

      if (success) {

        // Trigger UI refresh
        window.dispatchEvent(new CustomEvent('subscription-downgraded', {
          detail: { userId, newPlan: 'free', reason }
        }));
      }

      return success;
    } catch (error) {
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
      return null;
    }
  }

  /**
   * Handle cancellation confirmation with reason
   */
  static async confirmCancellation(reason: string, feedback?: string): Promise<CancellationResponse> {
    try {
      const fullReason = feedback ? `${reason}: ${feedback}` : reason;


      return await this.cancelSubscription(fullReason);

    } catch (error) {
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