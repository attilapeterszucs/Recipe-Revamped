// Simple utility to detect if Firebase/Firestore is being blocked
const networkStatus = {
  firebaseBlocked: false,
  lastCheck: 0
};

export const checkFirebaseConnectivity = (): boolean => {
  // Cache result for 30 seconds to avoid repeated checks
  const now = Date.now();
  if (now - networkStatus.lastCheck < 30000) {
    return !networkStatus.firebaseBlocked;
  }

  // Simple check - if we can't reach Firebase endpoints, it's likely blocked
  try {
    // This will fail immediately if blocked by ad blockers
    fetch('https://firestore.googleapis.com/v1/projects/test', { 
      mode: 'no-cors',
      method: 'HEAD' 
    }).catch(() => {
      networkStatus.firebaseBlocked = true;
    });
  } catch {
    networkStatus.firebaseBlocked = true;
  }

  networkStatus.lastCheck = now;
  return !networkStatus.firebaseBlocked;
};

export const getNetworkStatusMessage = (): string | null => {
  if (networkStatus.firebaseBlocked) {
    return 'Some features may be limited due to network restrictions. Recipe saving and subscription features require Firebase connectivity.';
  }
  return null;
};

export const isFirebaseError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return errorMsg.includes('blocked') || 
         errorMsg.includes('network') ||
         errorMsg.includes('firestore') ||
         errorMsg.includes('firebase') ||
         errorMsg.includes('unavailable') ||
         errorMsg.includes('permissions');
};