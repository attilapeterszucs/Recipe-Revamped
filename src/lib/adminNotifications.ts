import { 
  collection, 
  getDocs, 
  addDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import type { NotificationData } from '../types/notifications';
import { logAdminAction, isUserAdmin } from './adminManagement';

// Get all registered users (only actual user IDs with valid Firebase Auth UID format)
export const getAllUsers = async (): Promise<string[]> => {
  try {
    const userIds = new Set<string>();
    
    // Helper function to validate Firebase Auth UID format
    const isValidFirebaseUID = (uid: string): boolean => {
      return typeof uid === 'string' && 
             uid.length >= 20 && 
             uid.length <= 128 && 
             /^[A-Za-z0-9_-]+$/.test(uid) &&
             !uid.startsWith('user-'); // Exclude our fake user pattern
    };
    
    try {
      // Primary source: users collection (document ID is user ID)
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        
        if (isValidFirebaseUID(doc.id)) {
          // Only add users who have email addresses (real users)
          if (data.email && typeof data.email === 'string' && data.email.includes('@')) {
            userIds.add(doc.id);
          }
        }
      });
    } catch (error) {
      console.error('[Admin Debug] Error accessing users collection:', error);
    }

    try {
      // Secondary source: userSettings collection (userId field)
      const userSettingsRef = collection(db, 'userSettings');
      const userSettingsSnapshot = await getDocs(userSettingsRef);
      
      userSettingsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId && isValidFirebaseUID(data.userId)) {
          userIds.add(data.userId);
        }
      });
    } catch (error) {
      // Collection doesn't exist or is inaccessible
    }

    try {
      // Tertiary source: subscriptions collection (userId field)
      const subscriptionsRef = collection(db, 'subscriptions');
      const subscriptionsSnapshot = await getDocs(subscriptionsRef);
      
      subscriptionsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId && isValidFirebaseUID(data.userId)) {
          userIds.add(data.userId);
        }
      });
    } catch (error) {
      // Collection doesn't exist or is inaccessible
    }

    try {
      // Additional source: recipes collection (ownerUid field) - users who have saved recipes
      const recipesRef = collection(db, 'recipes');
      const recipesSnapshot = await getDocs(recipesRef);
      
      recipesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.ownerUid && isValidFirebaseUID(data.ownerUid)) {
          userIds.add(data.ownerUid);
        }
      });
    } catch (error) {
      // Collection doesn't exist or is inaccessible
    }

    try {
      // Additional source: mealPlans collection (userId in document ID pattern: userId_date)
      const mealPlansRef = collection(db, 'mealPlans');
      const mealPlansSnapshot = await getDocs(mealPlansRef);
      
      mealPlansSnapshot.forEach((doc) => {
        // Document ID format: userId_startDate
        const docIdParts = doc.id.split('_');
        if (docIdParts.length >= 2) {
          const userId = docIdParts[0];
          if (isValidFirebaseUID(userId)) {
            userIds.add(userId);
          }
        }
      });
    } catch (error) {
      // Collection doesn't exist or is inaccessible
    }
    
    return Array.from(userIds);
  } catch (error) {
    console.error('[getAllUsers] Error getting all users:', error);
    throw error;
  }
};

// Create notification for all users (with admin verification)
export const createNotificationForAllUsers = async (
  notificationData: NotificationData,
  adminUserId: string,
  adminEmail: string
): Promise<number> => {
  try {
    // Verify admin privileges
    const isAdmin = await isUserAdmin(adminEmail, adminUserId);
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin privileges required');
    }
    
    const userIds = await getAllUsers();
    let successCount = 0;
    
    // Create notification for each user
    const promises = userIds.map(async (userId) => {
      try {
        await addDoc(collection(db, 'notifications'), {
          userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          isRead: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: adminUserId,
          createdByAdmin: adminEmail
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error);
      }
    });
    
    await Promise.all(promises);
    
    // Log the admin action using the new admin management system
    await logAdminAction({
      adminUid: adminUserId,
      adminEmail: adminEmail,
      action: 'CREATE_NOTIFICATION_ALL_USERS',
      details: {
        notificationData,
        userCount: userIds.length,
        successCount,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    });
    
    return successCount;
  } catch (error) {
    console.error('Error creating notifications for all users:', error);
    throw error;
  }
};

// Get admin stats (matching AdminUserManagement filtering logic)
export const getAdminStats = async (): Promise<{
  totalUsers: number;
  totalNotifications: number;
}> => {
  try {
    // Import the functions we need for user filtering
    const { getAllAdmins } = await import('./adminManagement');
    const { getAllUserProfiles } = await import('./userService');

    const [allUserIds, adminUsers, userProfiles] = await Promise.all([
      getAllUsers(),
      getAllAdmins(),
      getAllUserProfiles()
    ]);

    // Combine user IDs from all sources (same logic as AdminUserManagement)
    const allUserUids = new Set([
      ...allUserIds,
      ...adminUsers.map(admin => admin.uid),
      ...userProfiles.map(profile => profile.uid)
    ]);

    // Filter users with valid email addresses (same logic as AdminUserManagement)
    const validUserUids: string[] = [];
    
    for (const uid of Array.from(allUserUids)) {
      const adminData = adminUsers.find(admin => admin.uid === uid);
      const userProfile = userProfiles.find(profile => profile.uid === uid);
      
      // Only include users with valid email addresses (filter out fake users)
      const hasValidEmail = userProfile?.email || adminData?.email;
      if (hasValidEmail) {
        validUserUids.push(uid);
      }
    }

    const notificationsRef = collection(db, 'notifications');
    const notificationsSnapshot = await getDocs(notificationsRef);
    
    return {
      totalUsers: validUserUids.length, // Return filtered count
      totalNotifications: notificationsSnapshot.size
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return { totalUsers: 0, totalNotifications: 0 };
  }
};