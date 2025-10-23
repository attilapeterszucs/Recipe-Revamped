// Firebase App Check implementation for enhanced security
// Protects backend resources from unauthorized access and abuse

import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken } from 'firebase/app-check';
import { app } from './firebase';
import { logger } from './logger';

// App Check configuration
const APP_CHECK_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// Initialize App Check with reCAPTCHA Enterprise provider
export let appCheck: any = null;

export const initializeAppCheckService = async (): Promise<void> => {
  try {
    // Temporarily disabled in production until reCAPTCHA Enterprise is properly configured in Firebase Console
    // To enable: Register the reCAPTCHA Enterprise site key in Firebase Console > App Check
    if (APP_CHECK_SITE_KEY && import.meta.env.PROD && false) { // Disabled with false flag
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });

      // Test token generation silently
      try {
        await getToken(appCheck, /* forceRefresh */ false);
      } catch (tokenError) {
        // Silent fail - App Check is optional
        appCheck = null;
      }
    }
    // App Check disabled - will be enabled when properly configured
  } catch (error) {
    // Silent fail - App Check is optional security layer
    appCheck = null;
  }
};

// Get current App Check token (useful for debugging)
export const getCurrentAppCheckToken = async (): Promise<string | null> => {
  if (!appCheck) {
    logger.warn('App Check not initialized');
    return null;
  }
  
  try {
    const appCheckToken = await getToken(appCheck, /* forceRefresh */ false);
    return appCheckToken.token;
  } catch (error) {
    logger.error('Failed to get App Check token', { error });
    return null;
  }
};

// Force refresh App Check token
export const refreshAppCheckToken = async (): Promise<boolean> => {
  if (!appCheck) {
    logger.warn('App Check not initialized');
    return false;
  }
  
  try {
    await getToken(appCheck, /* forceRefresh */ true);
    logger.info('App Check token refreshed successfully');
    return true;
  } catch (error) {
    logger.error('Failed to refresh App Check token', { error });
    return false;
  }
};

// Check if App Check is properly configured
export const isAppCheckEnabled = (): boolean => {
  return appCheck !== null;
};

// App Check status for debugging
export const getAppCheckStatus = async () => {
  if (!appCheck) {
    return {
      enabled: false,
      hasToken: false,
      reason: 'App Check not initialized'
    };
  }
  
  try {
    const token = await getCurrentAppCheckToken();
    return {
      enabled: true,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      environment: import.meta.env.MODE
    };
  } catch (error) {
    return {
      enabled: true,
      hasToken: false,
      error: (error as Error).message
    };
  }
};