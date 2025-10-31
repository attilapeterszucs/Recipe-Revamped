import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { logger } from './logger';

const AFFILIATES_COLLECTION = 'affiliates';
const USERS_COLLECTION = 'users';

export interface AffiliateData {
  userId: string;
  affiliateCode: string;
  referralCount: number;
  totalEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAffiliateStatus {
  hasUsedAffiliateCode: boolean;
  usedAffiliateCode?: string;
  usedAffiliateDate?: Date;
}

/**
 * Generate a unique affiliate code for a user
 */
export const generateAffiliateCode = (userId: string, email: string): string => {
  // Create a code from first part of email + last 6 chars of userId
  // Handle cases where email might be null, undefined, or empty
  let emailPrefix = '';

  if (email && email.includes('@')) {
    emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  // If no valid email prefix, use first 6 chars of userId
  if (!emailPrefix || emailPrefix.length === 0) {
    emailPrefix = userId.slice(0, 6).toUpperCase();
  }

  const userSuffix = userId.slice(-6).toUpperCase();
  return `${emailPrefix.slice(0, 6)}${userSuffix}`;
};

/**
 * Create affiliate account for a user
 */
export const createAffiliateAccount = async (userId: string, email: string): Promise<string> => {
  try {
    const affiliateCode = generateAffiliateCode(userId, email);

    // Check if affiliate code already exists
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, userId);
    const affiliateSnap = await getDoc(affiliateRef);

    if (affiliateSnap.exists()) {
      return affiliateSnap.data().affiliateCode;
    }

    // Create new affiliate record
    const affiliateData = {
      userId,
      affiliateCode,
      referralCount: 0,
      totalEarnings: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(affiliateRef, affiliateData);

    logger.info('Affiliate account created', { userId, affiliateCode });
    return affiliateCode;
  } catch (error) {
    logger.error('Error creating affiliate account', { error, userId });
    throw new Error('Failed to create affiliate account');
  }
};

/**
 * Get affiliate data for a user
 */
export const getAffiliateData = async (userId: string): Promise<AffiliateData | null> => {
  try {
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, userId);
    const affiliateSnap = await getDoc(affiliateRef);

    if (!affiliateSnap.exists()) {
      return null;
    }

    const data = affiliateSnap.data();
    return {
      userId: data.userId,
      affiliateCode: data.affiliateCode,
      referralCount: data.referralCount || 0,
      totalEarnings: data.totalEarnings || 0,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as AffiliateData;
  } catch (error) {
    logger.error('Error fetching affiliate data', { error, userId });
    return null;
  }
};

/**
 * Validate an affiliate code
 */
export const validateAffiliateCode = async (affiliateCode: string): Promise<{ valid: boolean; userId?: string }> => {
  try {
    if (!affiliateCode || affiliateCode.trim().length === 0) {
      return { valid: false };
    }

    // Query to find the user with this affiliate code
    const q = query(
      collection(db, AFFILIATES_COLLECTION),
      where('affiliateCode', '==', affiliateCode.toUpperCase())
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { valid: false };
    }

    const affiliateDoc = querySnapshot.docs[0];
    return {
      valid: true,
      userId: affiliateDoc.data().userId
    };
  } catch (error) {
    logger.error('Error validating affiliate code', { error, affiliateCode });
    return { valid: false };
  }
};

/**
 * Check if user has already used an affiliate code
 */
export const hasUsedAffiliateCode = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return false;
    }

    return userSnap.data().hasUsedAffiliateCode === true;
  } catch (error) {
    logger.error('Error checking affiliate code usage', { error, userId });
    return false;
  }
};

/**
 * Record affiliate code usage during signup
 */
export const recordAffiliateSignup = async (
  newUserId: string,
  affiliateCode: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate the affiliate code
    const validation = await validateAffiliateCode(affiliateCode);

    if (!validation.valid || !validation.userId) {
      return { success: false, message: 'Invalid affiliate code' };
    }

    // Don't allow users to use their own code
    if (validation.userId === newUserId) {
      return { success: false, message: 'Cannot use your own affiliate code' };
    }

    // Increment the referral count for the affiliate owner
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, validation.userId);
    await updateDoc(affiliateRef, {
      referralCount: increment(1),
      updatedAt: serverTimestamp()
    });

    // Mark the new user as having used an affiliate code
    const userRef = doc(db, USERS_COLLECTION, newUserId);
    await setDoc(userRef, {
      hasUsedAffiliateCode: true,
      usedAffiliateCode: affiliateCode.toUpperCase(),
      usedAffiliateDate: serverTimestamp()
    }, { merge: true });

    logger.info('Affiliate signup recorded', {
      newUserId,
      affiliateCode,
      affiliateOwnerId: validation.userId
    });

    return { success: true, message: 'Affiliate bonus applied!' };
  } catch (error) {
    logger.error('Error recording affiliate signup', { error, newUserId, affiliateCode });
    return { success: false, message: 'Failed to apply affiliate code' };
  }
};

/**
 * Apply affiliate code for existing user (can only be done once)
 */
export const applyAffiliateCode = async (
  userId: string,
  affiliateCode: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if user has already used an affiliate code
    const alreadyUsed = await hasUsedAffiliateCode(userId);

    if (alreadyUsed) {
      return { success: false, message: 'You have already used an affiliate code' };
    }

    // Validate the affiliate code
    const validation = await validateAffiliateCode(affiliateCode);

    if (!validation.valid || !validation.userId) {
      return { success: false, message: 'Invalid affiliate code' };
    }

    // Don't allow users to use their own code
    if (validation.userId === userId) {
      return { success: false, message: 'Cannot use your own affiliate code' };
    }

    // Increment the referral count for the affiliate owner
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, validation.userId);
    await updateDoc(affiliateRef, {
      referralCount: increment(1),
      updatedAt: serverTimestamp()
    });

    // Mark the user as having used an affiliate code
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      hasUsedAffiliateCode: true,
      usedAffiliateCode: affiliateCode.toUpperCase(),
      usedAffiliateDate: serverTimestamp()
    });

    logger.info('Affiliate code applied', { userId, affiliateCode });

    return { success: true, message: 'Affiliate code successfully applied!' };
  } catch (error) {
    logger.error('Error applying affiliate code', { error, userId, affiliateCode });
    return { success: false, message: 'Failed to apply affiliate code' };
  }
};

/**
 * Get user's affiliate status
 */
export const getUserAffiliateStatus = async (userId: string): Promise<UserAffiliateStatus> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { hasUsedAffiliateCode: false };
    }

    const data = userSnap.data();
    return {
      hasUsedAffiliateCode: data.hasUsedAffiliateCode === true,
      usedAffiliateCode: data.usedAffiliateCode,
      usedAffiliateDate: data.usedAffiliateDate?.toDate()
    };
  } catch (error) {
    logger.error('Error fetching user affiliate status', { error, userId });
    return { hasUsedAffiliateCode: false };
  }
};

/**
 * Generate affiliate link for a user
 */
export const generateAffiliateLink = (affiliateCode: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/signup?ref=${affiliateCode}`;
};
