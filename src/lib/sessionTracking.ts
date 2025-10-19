import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { logger } from './logger';

export interface UserSession {
  uid: string;
  email?: string;
  displayName?: string;
  lastActive: Timestamp;
  sessionId: string;
}

// Generate a unique session ID for this browser tab/window
const generateSessionId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

let currentSessionId: string | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

/**
 * Start tracking user session - creates a session document and sends heartbeats
 */
export const startSessionTracking = async (
  uid: string,
  email?: string,
  displayName?: string
): Promise<void> => {
  try {
    // Stop any existing session first
    if (currentSessionId && heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    // Generate unique session ID for this browser tab
    currentSessionId = generateSessionId();

    const sessionRef = doc(db, 'activeSessions', `${uid}_${currentSessionId}`);

    const sessionData = {
      uid,
      email: email || '',
      displayName: displayName || '',
      lastActive: serverTimestamp(),
      sessionId: currentSessionId
    };

    console.log('[SessionTracking] Creating session with data:', sessionData);

    // Create initial session document
    await setDoc(sessionRef, sessionData);

    console.log('[SessionTracking] Session created successfully', { uid, sessionId: currentSessionId });
    logger.info('[SessionTracking] Session started', { uid, sessionId: currentSessionId });

    // Send heartbeat every 30 seconds to update lastActive
    heartbeatInterval = setInterval(async () => {
      try {
        await setDoc(sessionRef, {
          uid,
          email: email || '',
          displayName: displayName || '',
          lastActive: serverTimestamp(),
          sessionId: currentSessionId
        }, { merge: true });
        console.log('[SessionTracking] Heartbeat sent', { uid, sessionId: currentSessionId });
      } catch (error) {
        console.error('[SessionTracking] Heartbeat failed', error);
        logger.error('[SessionTracking] Heartbeat failed', { error, uid });
      }
    }, 30000); // 30 seconds

    // Clean up session when user closes tab/window
    const handleBeforeUnload = () => {
      stopSessionTracking(uid);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Handle page visibility changes (tab switching)
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // User switched away - update lastActive but keep session
        try {
          await setDoc(sessionRef, {
            lastActive: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          logger.error('[SessionTracking] Visibility change update failed', { error });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

  } catch (error) {
    console.error('[SessionTracking] Failed to start session:', error);
    logger.error('[SessionTracking] Failed to start session', { error, uid });
    throw error; // Re-throw to see the error in the app
  }
};

/**
 * Stop tracking user session - removes session document and clears heartbeat
 */
export const stopSessionTracking = (uid: string): void => {
  try {
    if (!currentSessionId) return;

    // Clear heartbeat interval
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    // Delete session document (use navigator.sendBeacon for reliable cleanup)
    const sessionRef = doc(db, 'activeSessions', `${uid}_${currentSessionId}`);
    deleteDoc(sessionRef).catch(error => {
      logger.error('[SessionTracking] Failed to delete session', { error, uid });
    });

    logger.info('[SessionTracking] Session stopped', { uid, sessionId: currentSessionId });
    currentSessionId = null;

  } catch (error) {
    logger.error('[SessionTracking] Failed to stop session', { error, uid });
  }
};

/**
 * Get all active sessions
 */
export const getActiveSessions = (
  callback: (sessions: UserSession[]) => void
): (() => void) => {
  try {
    const sessionsRef = collection(db, 'activeSessions');

    console.log('[SessionTracking] Setting up real-time listener for active sessions');

    // Listen to real-time updates
    const unsubscribe = onSnapshot(
      sessionsRef,
      (snapshot) => {
        const sessions: UserSession[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            uid: data.uid,
            email: data.email,
            displayName: data.displayName,
            lastActive: data.lastActive,
            sessionId: data.sessionId
          };
        });

        console.log('[SessionTracking] Active sessions updated:', sessions.length, sessions);
        callback(sessions);
      },
      (error) => {
        console.error('[SessionTracking] Failed to listen to active sessions:', error);
        logger.error('[SessionTracking] Failed to listen to active sessions', { error });
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('[SessionTracking] Failed to setup session listener:', error);
    logger.error('[SessionTracking] Failed to setup session listener', { error });
    return () => {};
  }
};

/**
 * Check if a specific user is online
 */
export const getUserOnlineStatus = (
  uid: string,
  callback: (isOnline: boolean) => void
): (() => void) => {
  try {
    const sessionsRef = collection(db, 'activeSessions');
    const q = query(sessionsRef, where('uid', '==', uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // User is online if they have at least one active session
        callback(!snapshot.empty);
      },
      (error) => {
        logger.error('[SessionTracking] Failed to check user online status', { error, uid });
        callback(false);
      }
    );

    return unsubscribe;
  } catch (error) {
    logger.error('[SessionTracking] Failed to setup online status listener', { error });
    return () => {};
  }
};
