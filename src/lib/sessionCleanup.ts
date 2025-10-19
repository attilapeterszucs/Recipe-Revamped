import { collection, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from './logger';

/**
 * Clean up stale sessions (sessions older than 2 minutes without heartbeat)
 * and sessions marked as "closing"
 * This catches sessions that weren't properly cleaned up due to browser crashes, etc.
 */
export const cleanupStaleSessions = async (): Promise<void> => {
  try {
    const sessionsRef = collection(db, 'activeSessions');
    const snapshot = await getDocs(sessionsRef);

    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes ago

    const deletePromises = snapshot.docs
      .filter(doc => {
        const data = doc.data();

        // Delete sessions marked as closing immediately
        if (data.status === 'closing') {
          return true;
        }

        const lastActive = data.lastActive as Timestamp;

        if (!lastActive || !lastActive.toDate) {
          return true; // Delete if no lastActive timestamp
        }

        const lastActiveDate = lastActive.toDate();
        return lastActiveDate < twoMinutesAgo;
      })
      .map(doc => deleteDoc(doc.ref));

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      logger.info('[SessionCleanup] Cleaned up stale sessions', { count: deletePromises.length });
    }
  } catch (error) {
    logger.error('[SessionCleanup] Failed to clean up stale sessions', { error });
  }
};

/**
 * Start periodic cleanup of stale sessions
 * Runs every 30 seconds for faster cleanup
 */
export const startSessionCleanupSchedule = (): (() => void) => {
  // Run cleanup immediately
  cleanupStaleSessions();

  // Then run every 30 seconds
  const interval = setInterval(() => {
    cleanupStaleSessions();
  }, 30 * 1000); // 30 seconds

  // Return cleanup function
  return () => {
    clearInterval(interval);
  };
};
