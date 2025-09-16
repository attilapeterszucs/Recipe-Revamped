import { useState } from 'react';
import { auth } from '../lib/firebase';

interface CheckoutSessionOptions {
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

interface CheckoutSessionResponse {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

const STRIPE_WEBHOOK_URL = import.meta.env.VITE_STRIPE_WEBHOOK_URL || 'https://stripe-webhook-428797186446.us-central1.run.app';

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = async (
    priceId: string,
    options: CheckoutSessionOptions
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Ensure user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to create checkout session');
      }

      // Get Firebase ID token for authentication
      const idToken = await currentUser.getIdToken();

      // Call Stripe webhook service to create checkout session
      const response = await fetch(`${STRIPE_WEBHOOK_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          priceId,
          customerEmail: options.customerEmail,
          successUrl: options.successUrl,
          cancelUrl: options.cancelUrl,
          metadata: {
            userId: currentUser.uid,
            userEmail: options.customerEmail,
            ...options.metadata
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: CheckoutSessionResponse = await response.json();

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = result.url;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Checkout session creation failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createPortalSession = async (): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch(`${STRIPE_WEBHOOK_URL}/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/app`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const result = await response.json();

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Failed to create portal session');
      }

      return result.url;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePlan = async (newPlan: string, billingPeriod: 'monthly' | 'yearly'): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch(`${STRIPE_WEBHOOK_URL}/change-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          newPlan,
          billingPeriod,
          reason: `User requested plan change to ${newPlan} (${billingPeriod})`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to change plan');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Plan change failed');
      }

      // Trigger subscription refresh
      window.dispatchEvent(new CustomEvent('refresh-subscription'));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createCheckoutSession,
    createPortalSession,
    changePlan
  };
};