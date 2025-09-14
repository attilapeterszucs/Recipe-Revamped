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
   * Sync webhook subscription record to actual Firebase user
   */
  private static async syncWebhookSubscriptionToUser(webhookDocId: string, webhookData: any) {
    try {
      const customerEmail = webhookData.customerEmail;

      // Find Firebase user by email
      const currentUser = auth.currentUser;

      if (currentUser && currentUser.email === customerEmail) {

        // Create proper subscription record
        const subscription: UserSubscription = {
          userId: currentUser.uid,
          plan: webhookData.plan,
          status: webhookData.status,
          startDate: webhookData.startDate?.toDate() || new Date(),
          endDate: webhookData.endDate?.toDate() || null,
          stripeCustomerId: webhookData.stripeCustomerId,
          stripeSubscriptionId: webhookData.stripeSubscriptionId
        };

        // Save to user's subscription document
        await setDoc(doc(db, SUBSCRIPTIONS_COLLECTION, currentUser.uid), {
          ...subscription,
          billingPeriod: webhookData.billingPeriod,
          amount: webhookData.amount,
          currency: webhookData.currency || 'usd',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          syncedFromWebhook: true,
          webhookSourceId: webhookDocId,
          source: 'webhook_sync'
        });

        // Also update user's profile with subscription info
        await this.updateUserProfile(currentUser.uid, subscription);

        console.log(`✅ Subscription synced from webhook: ${subscription.plan} for ${customerEmail}`);

        // Trigger subscription status refresh
        window.location.reload(); // Simple refresh - can be improved with state management

      } else {
        console.log(`⚠️ No matching user found for email: ${customerEmail}`);
      }

    } catch (error) {
      console.error('❌ Error syncing webhook subscription:', error);
    }
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
  static async updateUserProfile(userId: string, subscription: UserSubscription) {
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
        // Look for subscription records with this email (from webhook)
        const webhookQuery = query(
          collection(db, SUBSCRIPTIONS_COLLECTION),
          where('customerEmail', '==', userEmail)
        );
        
        const querySnapshot = await getDocs(webhookQuery);

        // Check if we found any webhook subscription records
        if (!querySnapshot.empty) {
          const webhookDoc = querySnapshot.docs[0];
          const webhookData = webhookDoc.data();

          // Check if this is a Stripe customer ID (starts with 'cus_') or temp record
          if (webhookDoc.id.startsWith('cus_') || webhookDoc.id.startsWith('temp_')) {
            await this.syncWebhookSubscriptionToUser(webhookDoc.id, webhookData);
            return true;
          }
        } else {
          // Also check for temp records with checkout source
          const tempQuery = query(
            collection(db, SUBSCRIPTIONS_COLLECTION),
            where('customerEmail', '==', userEmail),
            where('source', '==', 'stripe_checkout')
          );
          const tempSnapshot = await getDocs(tempQuery);

          if (!tempSnapshot.empty) {
            const tempDoc = tempSnapshot.docs[0];
            const tempData = tempDoc.data();
            await this.syncTempSubscriptionToUser(tempDoc.id, tempData);
            return true;
          }

          // Check if we have any records at all for debugging
          const allDocsQuery = query(collection(db, SUBSCRIPTIONS_COLLECTION));
          const allDocs = await getDocs(allDocsQuery);
          
          // Create a diagnostic record for debugging in development
          if (attempt === 1) {
            const currentUser = auth.currentUser;
            const diagnosticRecord = {
              debugInfo: {
                userEmail,
                attempt,
                allDocsFound: allDocs.size,
                allDocsCount: allDocs.size,
                currentUserId: currentUser?.uid,
                currentUserEmail: currentUser?.email,
                timestamp: new Date().toISOString()
              }
            };
            
            // In development, create a debug document
            if (process.env.NODE_ENV !== 'production') {
              try {
                await setDoc(doc(db, 'debug_subscription_sync', `debug_${Date.now()}`), diagnosticRecord);
              } catch (debugError) {
                // Ignore debug document creation errors
              }
            }
          }
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
  // First try the normal sync process
  const syncSuccess = await SubscriptionSyncService.forceSyncCheck(userEmail);
  
  if (syncSuccess) {
    return true;
  }
  
  // If sync fails, try to create a fallback subscription based on URL params
  // This handles cases where the webhook might not be working
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  
  if (sessionId && auth.currentUser) {
    try {
      // Try to determine plan from URL or default to chef
      let detectedPlan = 'chef';
      const planParam = urlParams.get('plan') || urlParams.get('tier');
      if (planParam === 'master-chef' || planParam === 'masterchef') {
        detectedPlan = 'master-chef';
      }
      
      // Create a basic subscription record as fallback
      // In a real scenario, you'd verify this with Stripe's API
      const fallbackSubscription = {
        userId: auth.currentUser.uid,
        plan: detectedPlan,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        stripeCustomerId: sessionId, // Temporary - should be actual customer ID
        stripeSubscriptionId: sessionId, // Temporary - should be actual subscription ID
        createdAt: new Date(),
        updatedAt: new Date(),
        fallbackCreated: true, // Flag to indicate this was created as fallback
        needsWebhookSync: true // Flag to indicate this needs proper webhook sync later
      };
      
      // Save fallback subscription
      await setDoc(doc(db, SUBSCRIPTIONS_COLLECTION, auth.currentUser.uid), {
        ...fallbackSubscription,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Also update user profile
      await SubscriptionSyncService.updateUserProfile(auth.currentUser.uid, fallbackSubscription as any);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to create fallback subscription:', error);
    }
  }
  
  return false;
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