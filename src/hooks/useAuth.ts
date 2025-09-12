import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';

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
      (user) => {
        setAuthState({
          user,
          loading: false,
          error: null
        });
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