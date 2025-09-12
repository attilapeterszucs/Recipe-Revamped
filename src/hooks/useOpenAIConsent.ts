import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface ConsentData {
  hasConsented: boolean;
  consentDate: string | null;
  version: string;
}

const CONSENT_STORAGE_KEY = 'openai_consent';
const CURRENT_CONSENT_VERSION = '1.0';

export const useOpenAIConsent = () => {
  const { user } = useAuth();
  const [consentData, setConsentData] = useState<ConsentData>({
    hasConsented: false,
    consentDate: null,
    version: CURRENT_CONSENT_VERSION
  });
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Automatically accept consent when user is authenticated
  useEffect(() => {
    if (user) {
      // Automatically accept consent for authenticated users
      const autoConsentData: ConsentData = {
        hasConsented: true,
        consentDate: new Date().toISOString(),
        version: CURRENT_CONSENT_VERSION
      };
      
      // Save to localStorage and set state
      localStorage.setItem(`${CONSENT_STORAGE_KEY}_${user.uid}`, JSON.stringify(autoConsentData));
      setConsentData(autoConsentData);
    } else {
      // Clear consent data when user logs out
      setConsentData({
        hasConsented: false,
        consentDate: null,
        version: CURRENT_CONSENT_VERSION
      });
    }
  }, [user]);

  const saveConsent = (consent: ConsentData) => {
    if (user) {
      localStorage.setItem(`${CONSENT_STORAGE_KEY}_${user.uid}`, JSON.stringify(consent));
      setConsentData(consent);
    }
  };

  const acceptConsent = () => {
    const newConsentData: ConsentData = {
      hasConsented: true,
      consentDate: new Date().toISOString(),
      version: CURRENT_CONSENT_VERSION
    };
    saveConsent(newConsentData);
    setShowConsentModal(false);
  };

  const declineConsent = () => {
    const newConsentData: ConsentData = {
      hasConsented: false,
      consentDate: new Date().toISOString(),
      version: CURRENT_CONSENT_VERSION
    };
    saveConsent(newConsentData);
    setShowConsentModal(false);
  };

  const revokeConsent = () => {
    const newConsentData: ConsentData = {
      hasConsented: false,
      consentDate: new Date().toISOString(),
      version: CURRENT_CONSENT_VERSION
    };
    saveConsent(newConsentData);
  };

  const checkConsentBeforeAI = (): boolean => {
    if (!user) {
      return false; // Not authenticated
    }
    
    // Consent is automatically granted for authenticated users
    return true;
  };

  const getConsentStatus = () => {
    if (!user) return 'not_authenticated';
    if (!consentData.consentDate) return 'not_asked';
    if (consentData.hasConsented) return 'accepted';
    return 'declined';
  };

  return {
    consentData,
    showConsentModal,
    setShowConsentModal,
    acceptConsent,
    declineConsent,
    revokeConsent,
    checkConsentBeforeAI,
    getConsentStatus,
    hasValidConsent: consentData.hasConsented && user !== null
  };
};