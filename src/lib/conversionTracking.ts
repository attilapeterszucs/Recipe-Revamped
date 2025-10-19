import { db } from './firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Log a recipe conversion to Firestore for analytics
 */
export async function logConversion(
  userId: string,
  conversionType: 'convert' | 'surprise',
  filters: string[]
): Promise<void> {
  try {
    const conversionsRef = collection(db, 'conversions');

    // Log the conversion
    await addDoc(conversionsRef, {
      userId,
      conversionType,
      filters,
      timestamp: serverTimestamp(),
      createdAt: new Date() // Fallback for immediate use
    });

    // Update user's last active timestamp for online tracking
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastActiveAt: serverTimestamp()
    });
  } catch (error) {
    // Don't block the user experience if analytics logging fails
    console.error('Failed to log conversion:', error);
  }
}
