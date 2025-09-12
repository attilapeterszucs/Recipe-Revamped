import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';
import type { CookiePreferences } from '../types/cookies';

interface CookieContextType {
  // State
  preferences: CookiePreferences;
  hasConsent: boolean;
  needsConsent: boolean;
  consentTimestamp: number | null;
  
  // Actions
  saveConsent: (preferences: CookiePreferences) => void;
  clearConsent: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  updatePreference: (key: keyof CookiePreferences, value: boolean) => void;
  saveCurrentPreferences: () => void;
  showConsentPopup: () => void;
  
  // Utilities
  isAllowed: (type: keyof CookiePreferences) => boolean;
  getConsentAge: () => number | null;
  needsRefresh: () => boolean;
  
  // Constants
  CURRENT_VERSION: string;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

interface CookieProviderProps {
  children: ReactNode;
}

export const CookieProvider: React.FC<CookieProviderProps> = ({ children }) => {
  const cookieConsent = useCookieConsent();

  return (
    <CookieContext.Provider value={cookieConsent}>
      {children}
    </CookieContext.Provider>
  );
};

export const useCookieContext = (): CookieContextType => {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error('useCookieContext must be used within a CookieProvider');
  }
  return context;
};

// Higher-order component to check cookie consent
export const withCookieConsent = <P extends object>(
  Component: React.ComponentType<P>,
  requiredCookieType?: keyof CookiePreferences
) => {
  return (props: P) => {
    const { isAllowed } = useCookieContext();
    
    if (requiredCookieType && !isAllowed(requiredCookieType)) {
      return null;
    }
    
    return <Component {...props} />;
  };
};

// Hook to conditionally execute code based on cookie consent
export const useConditionalEffect = (
  effect: () => void | (() => void),
  deps: React.DependencyList,
  requiredCookieType: keyof CookiePreferences
) => {
  const { isAllowed } = useCookieContext();
  
  React.useEffect(() => {
    if (isAllowed(requiredCookieType)) {
      return effect();
    }
  }, [isAllowed(requiredCookieType), ...deps]);
};