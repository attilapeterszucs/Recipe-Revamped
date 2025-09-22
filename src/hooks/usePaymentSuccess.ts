import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
      // Don't show the success popup - let SubscriptionContext handle the notification
      setSyncAttempted(true); // Prevent multiple sync attempts

      // Clean up the URL by removing the success parameter
      urlParams.delete('success');
      const newUrl = `${location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
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