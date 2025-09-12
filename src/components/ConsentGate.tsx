import React from 'react';
import { Shield, Settings, Eye, AlertTriangle } from 'lucide-react';
import { useCookieContext } from '../contexts/CookieContext';
import type { CookiePreferences } from '../types/cookies';

interface ConsentGateProps {
  requiredConsent: keyof CookiePreferences;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  blockingMessage?: string;
}

const CONSENT_DETAILS = {
  essential: {
    name: 'Essential Cookies',
    icon: Shield,
    description: 'Required for basic website functionality',
    color: 'green'
  },
  analytics: {
    name: 'Analytics Cookies',
    icon: Eye,
    description: 'Help us understand usage patterns',
    color: 'purple'
  },
  preferences: {
    name: 'Preference Cookies',
    icon: Settings,
    description: 'Remember your settings and choices',
    color: 'blue'
  },
  marketing: {
    name: 'Marketing Cookies',
    icon: AlertTriangle,
    description: 'Not used by this application',
    color: 'red'
  }
};

/**
 * ConsentGate component that blocks content when required cookie consent is not given
 * Complies with GDPR/CCPA by preventing functionality from working without proper consent
 */
export const ConsentGate: React.FC<ConsentGateProps> = ({
  requiredConsent,
  children,
  fallback,
  blockingMessage
}) => {
  const { isAllowed, showConsentPopup } = useCookieContext();
  
  const hasRequiredConsent = isAllowed(requiredConsent);
  const consentInfo = CONSENT_DETAILS[requiredConsent];
  const IconComponent = consentInfo.icon;

  // Essential cookies are always allowed
  if (requiredConsent === 'essential' || hasRequiredConsent) {
    return <>{children}</>;
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show default blocking message
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start">
        <div className={`bg-${consentInfo.color}-100 rounded-full p-2 mr-4 mt-1`}>
          <IconComponent className={`w-5 h-5 text-${consentInfo.color}-600`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {consentInfo.name} Required
          </h3>
          <p className="text-gray-700 mb-4">
            {blockingMessage || `This feature requires ${consentInfo.name.toLowerCase()} to function. ${consentInfo.description}.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={showConsentPopup}
              className={`bg-${consentInfo.color}-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-${consentInfo.color}-700 transition-colors`}
            >
              Update Cookie Preferences
            </button>
            <div className="text-sm text-gray-600">
              <p className="mb-1">
                <strong>Privacy Note:</strong> You can change your preferences at any time.
              </p>
              <p>
                Your choice will be remembered for 6 months.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper component for analytics-gated content
 */
export const AnalyticsGate: React.FC<{children: React.ReactNode; fallback?: React.ReactNode}> = ({
  children,
  fallback
}) => (
  <ConsentGate 
    requiredConsent="analytics" 
    fallback={fallback}
    blockingMessage="Analytics features help us improve the service but require your consent."
  >
    {children}
  </ConsentGate>
);

/**
 * Helper component for preference-gated content
 */
export const PreferenceGate: React.FC<{children: React.ReactNode; fallback?: React.ReactNode}> = ({
  children,
  fallback
}) => (
  <ConsentGate 
    requiredConsent="preferences" 
    fallback={fallback}
    blockingMessage="This feature remembers your settings and requires preference cookies."
  >
    {children}
  </ConsentGate>
);

/**
 * Hook to check consent before performing actions
 */
export const useConsentGuard = () => {
  const { isAllowed, showConsentPopup } = useCookieContext();
  
  return {
    /**
     * Execute function only if required consent is given
     */
    withConsent: <T extends any[], R>(
      requiredConsent: keyof CookiePreferences,
      fn: (...args: T) => R,
      onBlocked?: () => void
    ) => {
      return (...args: T): R | undefined => {
        if (isAllowed(requiredConsent)) {
          return fn(...args);
        } else {
          if (onBlocked) {
            onBlocked();
          } else {
            showConsentPopup();
          }
          return undefined;
        }
      };
    },
    
    /**
     * Check if action is allowed
     */
    canExecute: (requiredConsent: keyof CookiePreferences) => isAllowed(requiredConsent),
    
    /**
     * Show consent popup
     */
    requestConsent: showConsentPopup
  };
};