import { auth } from './firebase';

// Use the correct Cloud Run service URL for stripe webhook
const STRIPE_WEBHOOK_URL = import.meta.env.VITE_STRIPE_WEBHOOK_URL || 'https://stripe-webhook-428797186446.us-central1.run.app';

export interface CancellationRequest {
  userId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  reason?: string;
  immediate?: boolean; // For account deletion - terminate immediately
}

export interface CancellationResponse {
  success: boolean;
  message?: string;
  userId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  immediate?: boolean;
  processing_time?: number;
  operationId?: string;
  note?: string;
  error?: string;
}

export class SubscriptionCancellationService {

  /**
   * Cancel user's subscription (end-of-period)
   * ONLY CALLS WEBHOOK - DOES NOT UPDATE FIRESTORE
   */
  static async cancelSubscription(reason?: string): Promise<CancellationResponse> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Cancelling subscription (end-of-period)

      // Prepare cancellation request
      const cancellationRequest: CancellationRequest = {
        userId: currentUser.uid,
        reason: reason || 'User requested cancellation',
        immediate: false // End-of-period cancellation
      };

      // Get auth token
      const idToken = await currentUser.getIdToken();

      // Call webhook ONLY - do not update Firestore
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
        // Cancellation request sent successfully

        // Trigger UI refresh event (Firestore will be updated by webhook)
        window.dispatchEvent(new CustomEvent('subscription-cancellation-requested', {
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
        note: 'Failed to cancel subscription. Please try again or contact support.'
      };
    }
  }

  /**
   * Cancel user's subscription immediately (for account deletion)
   * ONLY CALLS WEBHOOK - DOES NOT UPDATE FIRESTORE
   */
  static async cancelSubscriptionImmediately(reason?: string): Promise<CancellationResponse> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Cancelling subscription (immediate)

      // Prepare immediate cancellation request
      const cancellationRequest: CancellationRequest = {
        userId: currentUser.uid,
        reason: reason || 'Account deletion - immediate termination required',
        immediate: true // Immediate cancellation
      };

      // Get auth token
      const idToken = await currentUser.getIdToken();

      // Call webhook ONLY - do not update Firestore
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
        // Immediate cancellation request sent successfully

        // Trigger UI refresh event (Firestore will be updated by webhook)
        window.dispatchEvent(new CustomEvent('subscription-cancellation-requested', {
          detail: result
        }));

        return result;
      } else {
        throw new Error(result.error || 'Immediate cancellation failed');
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        note: 'Failed to cancel subscription immediately. Please try again or contact support.'
      };
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
  // Listen for subscription cancellation requests (webhook will update Firestore)
  window.addEventListener('subscription-cancellation-requested', () => {
    // Force refresh subscription context after a delay to allow webhook to process
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('refresh-subscription'));
    }, 2000);
  });

  // Listen for subscription expiry events
  window.addEventListener('subscription-expired', () => {
    // Force refresh subscription context
    window.dispatchEvent(new CustomEvent('refresh-subscription'));
  });
};

export default SubscriptionCancellationService;