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
      // Find user's subscription by userId field (not document ID)
      const subscription = await this.findUserSubscriptionByUserId(userId);

      if (!subscription) {
        return;
      }

      const now = new Date();
      const endDate = subscription.endDate ? subscription.endDate.toDate() : null;

      // Handle different subscription scenarios
      if (subscription.plan === 'free') {
        return;
      }

      // Check if subscription is expired and was cancelled
      if (endDate && endDate <= now && subscription.status === 'cancelled') {
        await this.downgradeExpiredSubscription(subscription.documentId);

        // Trigger UI refresh
        window.dispatchEvent(new CustomEvent('subscription-expired', {
          detail: {
            userId,
            expiredAt: endDate.toISOString(),
            downgradedAt: now.toISOString()
          }
        }));
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

    } catch (error) {
      console.error('❌ Error downgrading expired subscription:', error);
      throw error;
    }
  }
}