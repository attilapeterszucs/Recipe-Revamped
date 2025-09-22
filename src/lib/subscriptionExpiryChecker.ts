import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import type { UserSubscription } from '../types/subscription';

export class SubscriptionExpiryChecker {

  /**
   * Check subscription expiry on login and auto-downgrade if needed
   * Must be called every time user logs in
   */
  static async checkAndUpdateExpiredSubscription(userId: string): Promise<void> {
    try {
      console.log('🔍 Checking subscription expiry for user:', userId);

      // Find user's subscription by userId field (not document ID)
      const subscription = await this.findUserSubscriptionByUserId(userId);

      if (!subscription) {
        console.log('📭 No subscription found for user');
        return;
      }

      const now = new Date();
      const endDate = subscription.endDate ? subscription.endDate.toDate() : null;

      // Log endDate to browser console for debugging
      if (endDate) {
        console.log('📅 Subscription End Date:', endDate.toISOString());
        console.log('🕐 Current Date:', now.toISOString());
        console.log('⏰ Days until expiry:', Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        console.log('📊 Subscription Status:', subscription.status);
        console.log('📦 Current Plan:', subscription.plan);
      } else {
        console.log('📅 No end date found for subscription');
      }

      // Check if subscription is expired and was cancelled
      if (endDate && endDate <= now && subscription.status === 'cancelled') {
        console.log('⚠️ Subscription expired and was cancelled - downgrading to free');

        await this.downgradeExpiredSubscription(subscription.documentId);

        console.log('✅ User downgraded to free plan due to expiry');

        // Trigger UI refresh
        window.dispatchEvent(new CustomEvent('subscription-expired', {
          detail: {
            userId,
            expiredAt: endDate.toISOString(),
            downgradedAt: now.toISOString()
          }
        }));
      } else if (subscription.status === 'active') {
        console.log('✅ Subscription is active and not expired');
      } else if (subscription.status === 'cancelled' && endDate && endDate > now) {
        console.log('⏳ Subscription cancelled but still has access until:', endDate.toISOString());
      }

    } catch (error) {
      console.error('❌ Error checking subscription expiry:', error);
    }
  }

  /**
   * Find user subscription by userId field (not document ID)
   */
  private static async findUserSubscriptionByUserId(userId: string): Promise<any | null> {
    try {
      // First, try to find by querying userId field
      const subscriptionsRef = collection(db, 'subscriptions');
      const q = query(subscriptionsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          ...data,
          documentId: doc.id, // This should be the Stripe customer ID
          endDate: data.endDate
        };
      }

      // Fallback: try userId as document ID
      const userDocRef = doc(db, 'subscriptions', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        return {
          ...userDocSnap.data(),
          documentId: userId,
          endDate: userDocSnap.data().endDate
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error finding user subscription:', error);
      return null;
    }
  }

  /**
   * Downgrade expired subscription to free plan
   */
  private static async downgradeExpiredSubscription(documentId: string): Promise<void> {
    try {
      const subscriptionRef = doc(db, 'subscriptions', documentId);

      await updateDoc(subscriptionRef, {
        plan: 'free',
        status: 'cancelled',
        downgradedAt: serverTimestamp(),
        endDate: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        autoRenewal: false,
        expiredAndDowngraded: true,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Subscription downgraded to free due to expiry');
    } catch (error) {
      console.error('❌ Error downgrading expired subscription:', error);
      throw error;
    }
  }
}