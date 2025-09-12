import { useState, useEffect, useCallback } from 'react';
import type { CookiePreferences, CookieConsentData } from '../types/cookies';

export type { CookiePreferences, CookieConsentData };

const STORAGE_KEY = 'cookieConsent';
const TIMESTAMP_KEY = 'cookieConsentTimestamp';
const VERSION_KEY = 'cookieConsentVersion';
const CURRENT_VERSION = '1.0';

// Default preferences
const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  preferences: false,
  marketing: false,
};

export const useCookieConsent = () => {
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [consentTimestamp, setConsentTimestamp] = useState<number | null>(null);
  const [needsConsent, setNeedsConsent] = useState<boolean>(false);

  // Load existing consent from localStorage
  useEffect(() => {
    const loadConsent = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const timestamp = localStorage.getItem(TIMESTAMP_KEY);
        const version = localStorage.getItem(VERSION_KEY);

        if (stored && timestamp && version) {
          const storedPreferences = JSON.parse(stored) as CookiePreferences;
          const storedTimestamp = parseInt(timestamp);
          
          // Check if consent is still valid (6 months = 6 * 30 * 24 * 60 * 60 * 1000 ms)
          const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
          const isConsentValid = storedTimestamp > sixMonthsAgo && version === CURRENT_VERSION;
          
          if (isConsentValid) {
            setPreferences(storedPreferences);
            setConsentTimestamp(storedTimestamp);
            setHasConsent(true);
            setNeedsConsent(false);
          } else {
            // Consent expired or version mismatch, clear old data
            clearConsent();
            setNeedsConsent(true);
          }
        } else {
          setNeedsConsent(true);
        }
      } catch (error) {
        // Error loading cookie consent, using defaults
        setNeedsConsent(true);
      }
    };

    loadConsent();
  }, []);

  // Save consent to localStorage
  const saveConsent = useCallback((newPreferences: CookiePreferences) => {
    try {
      const timestamp = Date.now();
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      localStorage.setItem(TIMESTAMP_KEY, timestamp.toString());
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      
      setPreferences(newPreferences);
      setConsentTimestamp(timestamp);
      setHasConsent(true);
      setNeedsConsent(false);
      
      // Dispatch custom event for other parts of the app to listen to
      window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
        detail: { preferences: newPreferences, timestamp } 
      }));
      
    } catch (error) {
      // Error saving cookie consent
    }
  }, []);

  // Clear consent (for testing or when consent expires)
  const clearConsent = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TIMESTAMP_KEY);
      localStorage.removeItem(VERSION_KEY);
      
      setPreferences(DEFAULT_PREFERENCES);
      setConsentTimestamp(null);
      setHasConsent(false);
      setNeedsConsent(true);
      
      window.dispatchEvent(new CustomEvent('cookieConsentCleared'));
    } catch (error) {
      // Error clearing cookie consent
    }
  }, []);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      preferences: true,
      marketing: false, // We don't use marketing cookies
    };
    saveConsent(allAccepted);
  }, [saveConsent]);

  // Reject all optional cookies
  const rejectAll = useCallback(() => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      preferences: false,
      marketing: false,
    };
    saveConsent(essentialOnly);
  }, [saveConsent]);

  // Update specific preference
  const updatePreference = useCallback((key: keyof CookiePreferences, value: boolean) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled
    
    const newPreferences = {
      ...preferences,
      [key]: value,
    };
    setPreferences(newPreferences);
  }, [preferences]);

  // Save current preferences
  const saveCurrentPreferences = useCallback(() => {
    saveConsent(preferences);
  }, [preferences, saveConsent]);

  // Check if a specific cookie type is allowed
  const isAllowed = useCallback((type: keyof CookiePreferences): boolean => {
    return hasConsent && preferences[type];
  }, [hasConsent, preferences]);

  // Get consent age in days
  const getConsentAge = useCallback((): number | null => {
    if (!consentTimestamp) return null;
    return Math.floor((Date.now() - consentTimestamp) / (24 * 60 * 60 * 1000));
  }, [consentTimestamp]);

  // Check if consent needs refresh (older than 5 months)
  const needsRefresh = useCallback((): boolean => {
    if (!consentTimestamp) return false;
    const fiveMonthsAgo = Date.now() - (5 * 30 * 24 * 60 * 60 * 1000);
    return consentTimestamp < fiveMonthsAgo;
  }, [consentTimestamp]);

  // Force show consent popup (for settings page)
  const showConsentPopup = useCallback(() => {
    setNeedsConsent(true);
  }, []);

  return {
    // State
    preferences,
    hasConsent,
    needsConsent,
    consentTimestamp,
    
    // Actions
    saveConsent,
    clearConsent,
    acceptAll,
    rejectAll,
    updatePreference,
    saveCurrentPreferences,
    showConsentPopup,
    
    // Utilities
    isAllowed,
    getConsentAge,
    needsRefresh,
    
    // Constants
    CURRENT_VERSION,
  };
};