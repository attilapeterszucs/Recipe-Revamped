// App Check middleware for Firebase Functions
// Verifies App Check tokens to ensure requests come from legitimate clients

import * as admin from 'firebase-admin';

export interface AppCheckVerificationResult {
  verified: boolean;
  reason?: string;
}

// Verify App Check token from request headers
export async function verifyAppCheckToken(request: any): Promise<AppCheckVerificationResult> {
  try {
    // Get App Check token from request headers
    const appCheckToken = request.header('X-Firebase-AppCheck');
    
    if (!appCheckToken) {
      return {
        verified: false,
        reason: 'No App Check token provided'
      };
    }
    
    // Verify the App Check token
    await admin.appCheck().verifyToken(appCheckToken);
    
    return {
      verified: true
    };
    
  } catch (error: any) {
    console.warn('App Check verification failed:', error.message);
    
    return {
      verified: false,
      reason: error.message || 'App Check verification failed'
    };
  }
}

// Middleware function for App Check verification
export function requireAppCheck(options: { enforce?: boolean } = {}) {
  return async (request: any, response: any, next?: Function): Promise<boolean> => {
    const { enforce = false } = options;
    
    const verification = await verifyAppCheckToken(request);
    
    if (!verification.verified) {
      // Log security event
      console.warn('App Check verification failed for request', {
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        reason: verification.reason,
        endpoint: request.path,
        timestamp: new Date().toISOString()
      });
      
      if (enforce) {
        // Enforce App Check - reject request
        response.status(401).json({
          error: 'App verification failed',
          code: 'APP_CHECK_REQUIRED'
        });
        return false;
      } else {
        // Log warning but allow request (for gradual rollout)
        console.warn('App Check failed but request allowed (enforcement disabled)');
      }
    } else {
      // Log successful verification
      console.log('App Check verification successful');
    }
    
    // Continue with request
    if (next) next();
    return true;
  };
}

// Check if App Check enforcement should be enabled
export function shouldEnforceAppCheck(): boolean {
  // Enable enforcement based on environment variable
  const enforceAppCheck = process.env.ENFORCE_APP_CHECK === 'true';
  
  // Or enable based on production environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  return enforceAppCheck || isProduction;
}

// Enhanced security logging for App Check events
export function logSecurityEvent(event: {
  type: 'app_check_success' | 'app_check_failure' | 'suspicious_activity';
  details: Record<string, any>;
  request?: any;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: event.type,
    details: event.details,
    ip: event.request?.ip,
    userAgent: event.request?.get('User-Agent'),
    endpoint: event.request?.path,
  };
  
  if (event.type === 'app_check_failure' || event.type === 'suspicious_activity') {
    console.warn('SECURITY EVENT:', logEntry);
  } else {
    console.log('Security event:', logEntry);
  }
  
  // In production, you might want to send this to a security monitoring service
  // Example: sendToSecurityMonitoring(logEntry);
}