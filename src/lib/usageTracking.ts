import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  increment,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

const USAGE_COLLECTION = 'usage';

interface UsageData {
  userId: string;
  date: string; // YYYY-MM-DD format
  conversions: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UsageTracker {
  // Get today's date in YYYY-MM-DD format
  private static getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  // Get usage document ID for user and date
  private static getUsageDocId(userId: string, date: string): string {
    return `${userId}_${date}`;
  }
  
  // Get today's conversion count for user
  static async getTodaysConversions(userId: string): Promise<number> {
    try {
      const today = this.getTodayString();
      const docId = this.getUsageDocId(userId, today);
      const usageRef = doc(db, USAGE_COLLECTION, docId);
      const usageSnap = await getDoc(usageRef);
      
      if (!usageSnap.exists()) {
        return 0;
      }
      
      return usageSnap.data().conversions || 0;
    } catch (error) {
      // Handle network/permission errors silently
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isKnownError = errorMsg.includes('permissions') || 
                          errorMsg.includes('blocked') || 
                          errorMsg.includes('network') ||
                          errorMsg.includes('firestore');
      
      if (!isKnownError) {
        console.error('Error getting today\'s conversions:', error);
      }
      return 0; // Default to 0 conversions on error
    }
  }
  
  // Record a conversion
  static async recordConversion(userId: string): Promise<boolean> {
    try {
      // Recording conversion for user
      const today = this.getTodayString();
      const docId = this.getUsageDocId(userId, today);
      const usageRef = doc(db, USAGE_COLLECTION, docId);
      // Recording conversion document
      
      // Try to increment existing document or create new one
      const usageSnap = await getDoc(usageRef);
      
      if (usageSnap.exists()) {
        // Incrementing existing usage document
        // Increment existing count
        await setDoc(usageRef, {
          conversions: increment(1),
          updatedAt: serverTimestamp()
        }, { merge: true });
        // Conversion incremented successfully
      } else {
        // Creating new usage document
        // Create new usage document
        await setDoc(usageRef, {
          userId,
          date: today,
          conversions: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        // New usage document created
      }
      
      // Usage tracking completed
      return true;
    } catch (error) {
      // Handle network/permission errors silently
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isKnownError = errorMsg.includes('permissions') || 
                          errorMsg.includes('blocked') || 
                          errorMsg.includes('network') ||
                          errorMsg.includes('firestore');
      
      if (!isKnownError) {
        console.error('Error recording conversion:', error);
      }
      return false; // Failed to record but don't block the conversion
    }
  }
  
  // Get usage statistics for a user (optional - for admin/analytics)
  static async getUserUsageStats(userId: string, days: number = 7): Promise<UsageData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];
      
      const q = query(
        collection(db, USAGE_COLLECTION),
        where('userId', '==', userId),
        where('date', '>=', startDateString),
        where('date', '<=', endDateString)
      );
      
      const querySnapshot = await getDocs(q);
      const usageData: UsageData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usageData.push({
          userId: data.userId,
          date: data.date,
          conversions: data.conversions || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      return usageData;
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return [];
    }
  }
}