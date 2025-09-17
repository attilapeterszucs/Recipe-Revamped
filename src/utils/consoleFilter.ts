// Console filter to suppress known Firebase network errors
// This helps clean up the development console experience

let originalConsoleError: typeof console.error;

export const setupConsoleFilter = () => {
  // Only set up in development
  if (import.meta.env.DEV) {
    if (!originalConsoleError) {
      originalConsoleError = console.error;
    }

    console.error = (...args: unknown[]) => {
      // Convert all arguments to strings for checking
      const message = args.map(arg => String(arg)).join(' ').toLowerCase();
      
      // Check if error contains Firebase-related stack traces
      const hasFirebaseStackTrace = args.some(arg => {
        if (typeof arg === 'object' && arg !== null && 'stack' in arg) {
          const stack = (arg as any).stack;
          return typeof stack === 'string' && stack.toLowerCase().includes('firebase_firestore.js');
        }
        return false;
      });
      
      // Filter out known Firebase network errors and React DevTools messages
      const isKnownFirebaseError = 
        hasFirebaseStackTrace ||
        message.includes('firestore.googleapis.com') ||
        message.includes('net::err_blocked_by_client') ||
        message.includes('google.firestore.v1.firestore') ||
        message.includes('firestore/write/channel') ||
        message.includes('firestore/listen/channel') ||
        message.includes('firebase_firestore.js') ||
        message.includes('app check skipped in development') ||
        message.includes('app security services initialized') ||
        message.includes('download the react devtools') ||
        (message.includes('firebase') && (
          message.includes('blocked') ||
          message.includes('network') ||
          message.includes('unavailable')
        )) ||
        message.includes('missing or insufficient permissions') ||
        message.includes('post https://firestore.googleapis.com') ||
        message.includes('terminate&zx=') ||
        message.includes('image search api returned non-ok status') ||
        message.includes('searchimagesv2-428797186446.us-central1.run.app') ||
        message.includes('xhr') ||
        (message.includes('400') && message.includes('searchimages')) ||
        message.includes('pexels api') ||  
        message.includes('expires') && message.includes('_ga_');

      // Only log non-Firebase network errors
      if (!isKnownFirebaseError) {
        originalConsoleError.apply(console, args);
      }
    };
  }
};

export const restoreConsole = () => {
  if (originalConsoleError && import.meta.env.DEV) {
    console.error = originalConsoleError;
  }
};

// Auto-setup when imported
if (typeof window !== 'undefined') {
  setupConsoleFilter();
}