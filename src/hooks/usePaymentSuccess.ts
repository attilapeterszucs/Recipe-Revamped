import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const usePaymentSuccess = () => {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isSuccess = urlParams.get('success') === 'true';

    if (isSuccess) {
      setShowSuccessPopup(true);

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
    closeSuccessPopup
  };
};

export default usePaymentSuccess;