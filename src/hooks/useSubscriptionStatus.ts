import { useState, useEffect } from 'react';
import { SubscriptionService } from '../lib/subscriptionService';
import type { UserSubscription } from '../types/subscription';
import { useSubscriptionRefresh } from '../contexts/SubscriptionContext';

interface SubscriptionStatus {
  subscription: UserSubscription | null;
  isAdmin: boolean;
  loading: boolean;
  hasPermissions: boolean;
  refresh: () => void;
}

export const useSubscriptionStatus = (userId?: string, userEmail?: string): SubscriptionStatus => {
  const [status, setStatus] = useState({
    subscription: null as UserSubscription | null,
    isAdmin: false,
    loading: true,
    hasPermissions: false
  });

  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  
  // Try to get global refresh trigger, but don't fail if context is not available
  let globalRefreshTrigger = 0;
  try {
    const context = useSubscriptionRefresh();
    globalRefreshTrigger = context.refreshTrigger;
  } catch (error) {
    // Context not available, use default
  }

  useEffect(() => {
    const loadSubscriptionData = async () => {
      if (!userId || !userEmail) {
        setStatus({
          subscription: null,
          isAdmin: false,
          loading: false,
          hasPermissions: false
        });
        return;
      }

      setStatus(prev => ({ ...prev, loading: true }));

      try {
        const [subscription, adminStatus] = await Promise.all([
          SubscriptionService.getUserSubscriptionWithExpiryCheck(userId),
          SubscriptionService.isUserAdmin(userEmail, userId)
        ]);

        // Check if we actually got real data (not just fallbacks)
        const hasRealData = subscription && (
          subscription.plan !== 'free' || 
          subscription.isAdmin === true ||
          adminStatus === true
        );

        setStatus({
          subscription,
          isAdmin: adminStatus,
          loading: false,
          hasPermissions: hasRealData || false
        });
      } catch (error) {
        // Fallback to free plan
        setStatus({
          subscription: {
            userId,
            plan: 'free',
            status: 'active',
            startDate: new Date(),
            isAdmin: false
          },
          isAdmin: false,
          loading: false,
          hasPermissions: false
        });
      }
    };

    loadSubscriptionData();
  }, [userId, userEmail, localRefreshTrigger, globalRefreshTrigger]);

  const refresh = () => {
    setLocalRefreshTrigger(prev => prev + 1);
  };

  return { ...status, refresh };
};