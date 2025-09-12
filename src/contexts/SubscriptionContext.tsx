import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { initializeSubscriptionSync, handlePaymentReturn } from '../lib/subscriptionSyncService';
import { PaymentNotification } from '../components/PaymentNotification';

interface PaymentNotificationState {
  show: boolean;
  type: 'success' | 'pending' | 'error';
  title: string;
  message: string;
}

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
  const [notification, setNotification] = useState<PaymentNotificationState>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  const refreshSubscription = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const showNotification = (type: 'success' | 'pending' | 'error', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    let unsubscribeSync: (() => void) | null = null;

    // Monitor authentication state and initialize subscription sync
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        
        // Initialize subscription sync service for authenticated user
        unsubscribeSync = initializeSubscriptionSync();
        
        // Check for payment return (success redirect from Stripe)
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const success = urlParams.get('success');
        
        
        if (sessionId && success === 'true' && user.email) {
          
          // Handle payment return - sync subscription data
          try {
            const syncSuccess = await handlePaymentReturn(user.email);
            if (syncSuccess) {
              
              // Show success notification
              showNotification(
                'success',
                'Payment Successful! 🎉',
                'Your subscription is now active and ready to use. Welcome to your new plan!'
              );
              
              // Trigger subscription refresh in UI
              refreshSubscription();
              
              // Clean up URL parameters
              const newUrl = window.location.pathname;
              window.history.replaceState({}, '', newUrl);
            } else {
              showNotification(
                'pending',
                'Payment Processing ⏳',
                'Your payment was received successfully. We\'re activating your subscription now - this usually takes just a few seconds.'
              );
            }
          } catch (error) {
            console.error('❌ Error handling payment return:', error);
            showNotification(
              'error',
              'Activation Issue ⚠️',
              'Your payment was processed successfully, but we encountered an issue activating your subscription. Please contact support and we\'ll resolve this immediately.'
            );
          }
        } else if (sessionId || success) {
        }
      } else {
        
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
      {notification.show && (
        <PaymentNotification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      )}
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