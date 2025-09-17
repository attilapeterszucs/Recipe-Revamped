import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useStripeCheckout } from '../hooks/useStripeCheckout';

// Mock Firebase auth
const mockGetIdToken = vi.fn().mockResolvedValue('mock-firebase-token');
const mockCurrentUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  getIdToken: mockGetIdToken
};

// Mock auth module
vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: mockCurrentUser
  }
}));

// Mock the auth import in the hook
vi.mock('../lib/firebase', async () => {
  return {
    auth: {
      get currentUser() {
        return mockCurrentUser;
      }
    }
  };
});

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_STRIPE_WEBHOOK_URL: 'https://stripe-webhook-428797186446.us-central1.run.app'
  }
});

describe('useStripeCheckout Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const mockResponse = {
        success: true,
        url: 'https://checkout.stripe.com/session_123',
        sessionId: 'cs_123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Mock window.location.href assignment
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
      });

      const { result } = renderHook(() => useStripeCheckout());

      const options = {
        customerEmail: 'test@example.com',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel'
      };

      await result.current.createCheckoutSession('price_123', options);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://stripe-webhook-428797186446.us-central1.run.app/create-checkout-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-firebase-token',
            'Origin': 'http://localhost:3000'
          },
          body: JSON.stringify({
            priceId: 'price_123',
            customerEmail: 'test@example.com',
            successUrl: 'https://app.com/success',
            cancelUrl: 'https://app.com/cancel',
            metadata: {
              userId: 'test-user-id',
              userEmail: 'test@example.com'
            }
          })
        }
      );

      expect(window.location.href).toBe('https://checkout.stripe.com/session_123');
    });

    it('should handle authentication errors', async () => {
      vi.mocked(mockCurrentUser.getIdToken).mockRejectedValueOnce(new Error('Auth failed'));

      const { result } = renderHook(() => useStripeCheckout());

      const options = {
        customerEmail: 'test@example.com',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel'
      };

      await expect(
        result.current.createCheckoutSession('price_123', options)
      ).rejects.toThrow('Auth failed');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid price ID' })
      });

      const { result } = renderHook(() => useStripeCheckout());

      const options = {
        customerEmail: 'test@example.com',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel'
      };

      await expect(
        result.current.createCheckoutSession('invalid_price', options)
      ).rejects.toThrow('Invalid price ID');
    });

    it('should require authenticated user', async () => {
      // Mock no current user
      vi.mock('../lib/firebase', () => ({
        auth: {
          currentUser: null
        }
      }));

      const { result } = renderHook(() => useStripeCheckout());

      const options = {
        customerEmail: 'test@example.com',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel'
      };

      await expect(
        result.current.createCheckoutSession('price_123', options)
      ).rejects.toThrow('User must be authenticated');
    });
  });

  describe('createPortalSession', () => {
    it('should create portal session successfully', async () => {
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/portal/session_123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { result } = renderHook(() => useStripeCheckout());

      const portalUrl = await result.current.createPortalSession();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://stripe-webhook-428797186446.us-central1.run.app/create-portal-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-firebase-token',
            'Origin': 'http://localhost:3000'
          },
          body: JSON.stringify({
            returnUrl: 'http://localhost:3000/app'
          })
        }
      );

      expect(portalUrl).toBe('https://billing.stripe.com/portal/session_123');
    });

    it('should handle portal creation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'No subscription found' })
      });

      const { result } = renderHook(() => useStripeCheckout());

      await expect(result.current.createPortalSession()).rejects.toThrow('No subscription found');
    });
  });

  describe('changePlan', () => {
    it('should change plan successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Plan changed successfully'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Mock custom event dispatch
      const mockDispatchEvent = vi.fn();
      Object.defineProperty(window, 'dispatchEvent', {
        value: mockDispatchEvent
      });

      const { result } = renderHook(() => useStripeCheckout());

      await result.current.changePlan('master-chef', 'monthly');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://stripe-webhook-428797186446.us-central1.run.app/change-plan',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-firebase-token',
            'Origin': 'http://localhost:3000'
          },
          body: JSON.stringify({
            userId: 'test-user-id',
            newPlan: 'master-chef',
            billingPeriod: 'monthly',
            reason: 'User requested plan change to master-chef (monthly)'
          })
        }
      );

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'refresh-subscription'
        })
      );
    });

    it('should handle plan change errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Plan change failed' })
      });

      const { result } = renderHook(() => useStripeCheckout());

      await expect(
        result.current.changePlan('invalid-plan', 'monthly')
      ).rejects.toThrow('Plan change failed');
    });
  });

  describe('Hook State Management', () => {
    it('should manage loading state correctly', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, url: 'https://checkout.stripe.com' })
        }), 100))
      );

      const { result } = renderHook(() => useStripeCheckout());

      expect(result.current.loading).toBe(false);

      const promise = result.current.createCheckoutSession('price_123', {
        customerEmail: 'test@example.com',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel'
      });

      // Should be loading during request
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await promise;

      // Should not be loading after request
      expect(result.current.loading).toBe(false);
    });

    it('should manage error state correctly', async () => {
      const { result } = renderHook(() => useStripeCheckout());

      expect(result.current.error).toBe(null);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' })
      });

      try {
        await result.current.createCheckoutSession('price_123', {
          customerEmail: 'test@example.com',
          successUrl: 'https://app.com/success',
          cancelUrl: 'https://app.com/cancel'
        });
      } catch (error) {
        // Expected to throw
      }

      expect(result.current.error).toBe('Server error');
    });

    it('should clear error state on new requests', async () => {
      const { result } = renderHook(() => useStripeCheckout());

      // First request fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'First error' })
      });

      try {
        await result.current.createCheckoutSession('price_123', {
          customerEmail: 'test@example.com',
          successUrl: 'https://app.com/success',
          cancelUrl: 'https://app.com/cancel'
        });
      } catch (error) {
        // Expected
      }

      expect(result.current.error).toBe('First error');

      // Second request succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, url: 'https://checkout.stripe.com' })
      });

      await result.current.createCheckoutSession('price_456', {
        customerEmail: 'test@example.com',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel'
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Security', () => {
    it('should include proper authentication headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, url: 'https://checkout.stripe.com' })
      });

      const { result } = renderHook(() => useStripeCheckout());

      await result.current.createCheckoutSession('price_123', {
        customerEmail: 'test@example.com',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel'
      });

      const fetchCall = mockFetch.mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['Authorization']).toBe('Bearer mock-firebase-token');
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Origin']).toBe('http://localhost:3000');
    });

    it('should include user metadata in requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, url: 'https://checkout.stripe.com' })
      });

      const { result } = renderHook(() => useStripeCheckout());

      await result.current.createCheckoutSession('price_123', {
        customerEmail: 'test@example.com',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel'
      });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.metadata).toEqual({
        userId: 'test-user-id',
        userEmail: 'test@example.com'
      });
    });
  });
});