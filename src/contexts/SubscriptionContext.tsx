import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { initializeSubscriptionSync, handlePaymentReturn } from '../lib/subscriptionSyncService';

interface SubscriptionContextType {
  refreshTrigger: number;
  refreshSubscription: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshSubscription = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let unsubscribeSync: (() => void) | null = null;

    // Monitor authentication state and initialize subscription sync
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('🔄 User authenticated, starting subscription sync service...');
        
        // Initialize subscription sync service for authenticated user
        unsubscribeSync = initializeSubscriptionSync();
        
        // Check for payment return (success redirect from Stripe)
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const success = urlParams.get('success');
        
        console.log('🔍 Checking URL parameters:', { 
          sessionId, 
          success, 
          userEmail: user.email,
          fullUrl: window.location.href 
        });
        
        if (sessionId && success === 'true' && user.email) {
          console.log('🎉 Payment success detected, initiating sync check...');
          
          // Handle payment return - sync subscription data
          try {
            const syncSuccess = await handlePaymentReturn(user.email);
            if (syncSuccess) {
              console.log('✅ Payment sync successful!');
              
              // Show success message
              alert('🎉 Payment successful! Your subscription is now active.');
              
              // Trigger subscription refresh in UI
              refreshSubscription();
              
              // Clean up URL parameters
              const newUrl = window.location.pathname;
              window.history.replaceState({}, '', newUrl);
            } else {
              console.log('⚠️ Payment sync failed, subscription data not found yet.');
              alert('⏳ Payment received! Your subscription will be activated shortly.');
            }
          } catch (error) {
            console.error('❌ Error handling payment return:', error);
            alert('⚠️ Payment processed, but there was an issue activating your subscription. Please contact support.');
          }
        } else if (sessionId || success) {
          console.log('⚠️ Incomplete payment parameters:', { sessionId, success, userEmail: user.email });
        }
      } else {
        console.log('🔒 User signed out, stopping subscription sync service...');
        
        // Clean up subscription sync when user signs out
        if (unsubscribeSync) {
          unsubscribeSync();
          unsubscribeSync = null;
        }
      }
    });

    // Cleanup on component unmount
    return () => {
      unsubscribeAuth();
      if (unsubscribeSync) {
        unsubscribeSync();
      }
    };
  }, []);

  return (
    <SubscriptionContext.Provider value={{ refreshTrigger, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionRefresh = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionRefresh must be used within a SubscriptionProvider');
  }
  return context;
};