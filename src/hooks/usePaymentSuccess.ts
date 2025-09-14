import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { SubscriptionSyncService } from '../lib/subscriptionSyncService';

export const usePaymentSuccess = () => {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [syncingSubscription, setSyncingSubscription] = useState(false);
  const [syncAttempted, setSyncAttempted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isSuccess = urlParams.get('success') === 'true';

    if (isSuccess && !syncAttempted) {
      setShowSuccessPopup(true);
      setSyncAttempted(true); // Prevent multiple sync attempts

      // Trigger subscription sync immediately
      const syncSubscription = async () => {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.email) {
          setSyncingSubscription(true);
          console.log('🔄 Starting subscription sync after payment success...');

          try {
            // Try to sync the subscription - this will look for webhook records
            const syncSuccess = await SubscriptionSyncService.forceSyncCheck(currentUser.email, 15);

            if (syncSuccess) {
              console.log('✅ Subscription synced successfully!');
            } else {
              console.warn('⚠️ Could not find subscription to sync - webhook may still be processing');
            }
          } catch (error) {
            console.error('❌ Subscription sync error:', error);
          } finally {
            setSyncingSubscription(false);
          }
        }
      };

      syncSubscription();

      // Clean up the URL by removing the success parameter
      // This prevents the popup from showing again if the user refreshes
      urlParams.delete('success');
      const newSearch = urlParams.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;

      // Replace the current URL without adding to browser history
      navigate(newUrl, { replace: true });
    }
  }, [location, navigate]);

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  return {
    showSuccessPopup,
    closeSuccessPopup,
    syncingSubscription,
    syncAttempted
  };
};

export default usePaymentSuccess;