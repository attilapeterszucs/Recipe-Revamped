import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  getDocs,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { auth } from './firebase';
import { db } from './firebase';
import type { UserSubscription } from '../types/subscription';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const TEMP_SUBSCRIPTIONS_PREFIX = 'temp_';

/**
 * Service to sync subscription data from Cloud Function webhook to Firebase Auth users
 */
export class SubscriptionSyncService {
  
  /**
   * Monitor for new subscription records from Stripe webhooks and sync to user accounts
   */
  static startSyncService() {
    
    // Listen for temporary subscription records created by webhook
    const tempQuery = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where('source', '==', 'stripe_checkout')
    );
    
    return onSnapshot(tempQuery, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const tempDoc = change.doc;
          const tempData = tempDoc.data();
          
          if (tempDoc.id.startsWith(TEMP_SUBSCRIPTIONS_PREFIX) && tempData.customerEmail) {
            await this.syncTempSubscriptionToUser(tempDoc.id, tempData);
          }
        }
      });
    });
  }
  
  /**
   * Sync temporary subscription record to actual Firebase user
   */
  private static async syncTempSubscriptionToUser(tempDocId: string, tempData: any) {
    try {
      const customerEmail = tempData.customerEmail;
      
      // Find Firebase user by email
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.email === customerEmail) {
        
        // Create proper subscription record
        const subscription: UserSubscription = {
          userId: currentUser.uid,
          plan: tempData.plan,
          status: tempData.status,
          startDate: tempData.startDate?.toDate() || new Date(),
          endDate: tempData.endDate?.toDate() || null,
          stripeCustomerId: tempData.stripeCustomerId,
          stripeSubscriptionId: tempData.stripeSubscriptionId
        };
        
        // Save to user's subscription document
        await setDoc(doc(db, SUBSCRIPTIONS_COLLECTION, currentUser.uid), {
          ...subscription,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          syncedFromWebhook: true,
          webhookTempId: tempDocId
        });

        // Also update user's profile with subscription info
        await this.updateUserProfile(currentUser.uid, subscription);
        
        // Clean up temporary record
        await this.cleanupTempSubscription(tempDocId);
        
        
        // Trigger subscription status refresh
        window.location.reload(); // Simple refresh - can be improved with state management
        
      } else {
        // Could implement a queue or retry mechanism here
      }
      
    } catch (error) {
      console.error('❌ Error syncing subscription:', error);
    }
  }
  
  /**
   * Update user's profile document with subscription information
   */
  private static async updateUserProfile(userId: string, subscription: UserSubscription) {
    try {
      const userProfileRef = doc(db, 'users', userId);
      
      // Update user profile with subscription details
      await updateDoc(userProfileRef, {
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          updatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Clean up temporary subscription record after successful sync
   */
  private static async cleanupTempSubscription(tempDocId: string) {
    try {
      const tempDocRef = doc(db, SUBSCRIPTIONS_COLLECTION, tempDocId);
      await deleteDoc(tempDocRef);
    } catch (error) {
      console.error('❌ Error cleaning up temp subscription:', error);
    }
  }
  
  /**
   * Check for existing subscription for current user
   */
  static async checkUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, userId);
      const subscriptionSnap = await getDoc(subscriptionRef);
      
      if (subscriptionSnap.exists()) {
        const data = subscriptionSnap.data();
        return {
          userId: data.userId,
          plan: data.plan,
          status: data.status,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate(),
          stripeCustomerId: data.stripeCustomerId,
          stripeSubscriptionId: data.stripeSubscriptionId
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error checking user subscription:', error);
      return null;
    }
  }
  
  /**
   * Force sync check for current user (after payment completion)
   */
  static async forceSyncCheck(userEmail: string, maxRetries: number = 10): Promise<boolean> {
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Look for temporary subscription with this email
        const tempQuery = query(
          collection(db, SUBSCRIPTIONS_COLLECTION),
          where('customerEmail', '==', userEmail),
          where('source', '==', 'stripe_checkout')
        );
        
        const querySnapshot = await getDocs(tempQuery);
        
        
        if (!querySnapshot.empty) {
          const tempDoc = querySnapshot.docs[0];
          const tempData = tempDoc.data();
          
            docId: tempDoc.id,
            plan: tempData.plan,
            customerEmail: tempData.customerEmail,
            status: tempData.status
          });
          
          await this.syncTempSubscriptionToUser(tempDoc.id, tempData);
          return true;
        }
        
        // Also check if user already has an active subscription
        const currentUser = auth.currentUser;
        if (currentUser) {
          const existingSubscription = await this.checkUserSubscription(currentUser.uid);
          if (existingSubscription && existingSubscription.plan !== 'free') {
            return true;
          }
        }
        
        // Wait before next attempt (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`❌ Error in force sync attempt ${attempt}:`, error);
      }
    }
    
    return false;
  }
}

/**
 * Initialize subscription sync service when user signs in
 */
export const initializeSubscriptionSync = () => {
  return SubscriptionSyncService.startSyncService();
};

/**
 * Check for subscription after payment redirect
 */
export const handlePaymentReturn = async (userEmail: string) => {
  return await SubscriptionSyncService.forceSyncCheck(userEmail);
};

/**
 * Handle subscription renewal/update for existing users
 */
export const handleSubscriptionRenewal = async (userId: string, subscriptionData: any) => {
  
  try {
    // Update subscription document
    await setDoc(doc(db, SUBSCRIPTIONS_COLLECTION, userId), {
      userId,
      plan: subscriptionData.plan,
      status: subscriptionData.status,
      startDate: subscriptionData.startDate,
      endDate: subscriptionData.endDate,
      stripeCustomerId: subscriptionData.stripeCustomerId,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      updatedAt: serverTimestamp(),
      renewalProcessed: true
    }, { merge: true });

    // Update user profile
    await updateDoc(doc(db, 'users', userId), {
      subscription: {
        plan: subscriptionData.plan,
        status: subscriptionData.status,
        startDate: subscriptionData.startDate,
        endDate: subscriptionData.endDate,
        updatedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('❌ Error processing subscription renewal:', error);
    return false;
  }
};