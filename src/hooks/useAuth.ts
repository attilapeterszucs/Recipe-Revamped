import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { SubscriptionExpiryChecker } from '../lib/subscriptionExpiryChecker';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        setAuthState({
          user,
          loading: false,
          error: null
        });

        // CHECK SUBSCRIPTION EXPIRY ON EVERY LOGIN
        if (user) {
          console.log('👤 User logged in:', user.uid);

          // Check and update expired subscriptions
          await SubscriptionExpiryChecker.checkAndUpdateExpiredSubscription(user.uid);
        }
      },
      (error) => {
        setAuthState({
          user: null,
          loading: false,
          error: error.message
        });
      }
    );

    return unsubscribe;
  }, []);

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    isEmailVerified: authState.user?.emailVerified ?? false
  };
};