import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { SubscriptionExpiryService } from '../lib/subscriptionExpiryService';

export const CancelledSubscriptionBanner: React.FC = () => {
  const [cancelledStatus, setCancelledStatus] = useState<{
    hasCancelledActive: boolean;
    plan?: string;
    expiresAt?: Date;
    daysRemaining?: number;
  }>({ hasCancelledActive: false });
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCancelledStatus();

    // Listen for subscription changes
    const handleRefresh = () => checkCancelledStatus();
    window.addEventListener('refresh-subscription', handleRefresh);
    window.addEventListener('subscription-cancelled', handleRefresh);

    return () => {
      window.removeEventListener('refresh-subscription', handleRefresh);
      window.removeEventListener('subscription-cancelled', handleRefresh);
    };
  }, []);

  const checkCancelledStatus = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const status = await SubscriptionExpiryService.hasCancelledButActiveSubscription(currentUser.uid);
      setCancelledStatus(status);
    } catch (error) {
      console.error('Error checking cancelled subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || isDismissed || !cancelledStatus.hasCancelledActive) {
    return null;
  }

  const formatExpiryDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExpiryMessage = () => {
    if (!cancelledStatus.daysRemaining || !cancelledStatus.plan || !cancelledStatus.expiresAt) {
      return 'Your subscription has been cancelled.';
    }

    return SubscriptionExpiryService.getExpiryMessage(
      cancelledStatus.daysRemaining,
      cancelledStatus.plan
    );
  };

  const isUrgent = cancelledStatus.daysRemaining && cancelledStatus.daysRemaining <= 7;

  return (
    <div className={`mx-4 mb-4 rounded-lg border-l-4 p-4 ${
      isUrgent
        ? 'bg-red-50 border-red-400 text-red-700'
        : 'bg-yellow-50 border-yellow-400 text-yellow-700'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className={`h-5 w-5 ${isUrgent ? 'text-red-400' : 'text-yellow-400'}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${isUrgent ? 'text-red-800' : 'text-yellow-800'}`}>
            Subscription Cancelled
          </h3>
          <div className={`mt-1 text-sm ${isUrgent ? 'text-red-700' : 'text-yellow-700'}`}>
            <p>{getExpiryMessage()}</p>
            {cancelledStatus.expiresAt && (
              <p className="mt-1">
                <strong>Expires:</strong> {formatExpiryDate(cancelledStatus.expiresAt)}
              </p>
            )}
          </div>
          <div className="mt-3">
            <a
              href="/pricing"
              className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isUrgent
                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              }`}
            >
              Reactivate Subscription
            </a>
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={() => setIsDismissed(true)}
            className={`rounded-md p-1.5 hover:bg-opacity-20 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isUrgent ? 'text-red-500 focus:ring-red-500' : 'text-yellow-500 focus:ring-yellow-500'
            }`}
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelledSubscriptionBanner;