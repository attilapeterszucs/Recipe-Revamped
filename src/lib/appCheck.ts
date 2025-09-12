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
    // Only initialize in production or when reCAPTCHA key is provided
    if (APP_CHECK_SITE_KEY && import.meta.env.PROD) {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true, // Automatically refresh tokens
      });
      
      logger.info('Firebase App Check initialized with reCAPTCHA Enterprise');
      
      // Test token generation
      try {
        await getToken(appCheck, /* forceRefresh */ false);
        logger.info('App Check token generated successfully');
      } catch (tokenError) {
        logger.error('Failed to generate App Check token', { error: tokenError });
      }
      
    } else if (import.meta.env.DEV) {
      // In development, use debug tokens
      // Debug tokens allow you to test your app with App Check enforcement enabled
      logger.info('App Check skipped in development environment');
      
      // For development, you can set debug tokens
      // See: https://firebase.google.com/docs/app-check/web/debug-provider
      
    } else {
      logger.warn('App Check not initialized: Missing reCAPTCHA site key');
    }
  } catch (error) {
    logger.error('Failed to initialize Firebase App Check', { error });
    // Don't throw error to prevent app from breaking
    // App Check is an additional security layer, not a requirement for basic functionality
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