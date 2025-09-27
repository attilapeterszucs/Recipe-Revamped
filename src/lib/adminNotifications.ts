import {
  collection,
  getDocs,
  addDoc,
  getDoc,
  doc,
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

// Get all users with email data and their marketing email preferences
export const getAllUsersWithEmails = async (): Promise<Array<{
  uid: string;
  email: string;
  displayName?: string;
  emailPreferences?: {
    notifications?: boolean;
  };
  marketingEmails?: boolean;
  emailNotifications?: boolean;
}>> => {
  try {
    const { getAllUserProfiles } = await import('./userService');
    const userProfiles = await getAllUserProfiles();

    // Fetch user settings to get marketing email preferences
    const userSettingsPromises = userProfiles.map(async (profile) => {
      try {
        const userSettingsDoc = await getDoc(doc(db, 'userSettings', profile.uid));
        const userSettings = userSettingsDoc.exists() ? userSettingsDoc.data() : null;

        return {
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          emailPreferences: userSettings?.emailPreferences,
          marketingEmails: userSettings?.marketingEmails || false,
          emailNotifications: userSettings?.emailNotifications !== false  // Default to true unless explicitly set to false
        };
      } catch (error) {
        console.error(`Error fetching settings for user ${profile.uid}:`, error);
        return {
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          emailPreferences: undefined,
          marketingEmails: false,
          emailNotifications: true  // Default to true on error
        };
      }
    });

    const usersWithSettings = await Promise.all(userSettingsPromises);
    return usersWithSettings;
  } catch (error) {
    console.error('Error getting users with emails:', error);
    return [];
  }
};

// Send email notification via the email service
const sendEmailNotification = async (
  notificationData: NotificationData,
  userEmails: string[]
): Promise<void> => {
  try {
    const EMAIL_SERVICE_URL = 'https://emailservice-428797186446.us-central1.run.app/notification';

    const response = await fetch(EMAIL_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        recipients: userEmails
      }),
    });

    if (!response.ok) {
      throw new Error(`Email service responded with status: ${response.status}`);
    }

    console.log(`Email notifications sent to ${userEmails.length} users`);
  } catch (error) {
    console.error('Error sending email notifications:', error);
    throw error;
  }
};

// Create notification for all users (with admin verification)
export const createNotificationForAllUsers = async (
  notificationData: NotificationData,
  adminUserId: string,
  adminEmail: string,
  sendAsEmail: boolean = false
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

    // Send email notifications if requested
    if (sendAsEmail) {
      try {
        const usersWithEmails = await getAllUsersWithEmails();
        const emailEnabledUsers = usersWithEmails.filter(user =>
          user.emailNotifications === true  // Use emailNotifications field from userSettings
        );
        const userEmails = emailEnabledUsers.map(user => user.email);

        if (userEmails.length > 0) {
          await sendEmailNotification(notificationData, userEmails);
        }
      } catch (emailError) {
        console.error('Error sending email notifications:', emailError);
        // Don't fail the entire operation if email fails
      }
    }

    // Log the admin action using the new admin management system
    await logAdminAction({
      adminUid: adminUserId,
      adminEmail: adminEmail,
      action: 'CREATE_NOTIFICATION_ALL_USERS',
      details: {
        notificationData,
        userCount: userIds.length,
        successCount,
        emailSent: sendAsEmail,
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

// Create notification for selected users (with admin verification)
export const createNotificationForSelectedUsers = async (
  notificationData: NotificationData,
  selectedUserIds: string[],
  adminUserId: string,
  adminEmail: string,
  sendAsEmail: boolean = false
): Promise<number> => {
  try {
    // Verify admin privileges
    const isAdmin = await isUserAdmin(adminEmail, adminUserId);
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin privileges required');
    }

    if (selectedUserIds.length === 0) {
      throw new Error('No users selected');
    }

    let successCount = 0;

    // Create notification for each selected user
    const promises = selectedUserIds.map(async (userId) => {
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

    // Send email notifications if requested
    if (sendAsEmail) {
      try {
        const usersWithEmails = await getAllUsersWithEmails();
        console.log(`[ADMIN_NOTIFICATIONS] Checking ${usersWithEmails.length} users for email notifications`);

        const selectedUsersWithEmails = usersWithEmails.filter(user => {
          const isSelected = selectedUserIds.includes(user.uid);
          const hasEmailNotifications = user.emailNotifications === true;

          console.log(`[ADMIN_NOTIFICATIONS] User ${user.uid}: selected=${isSelected}, emailNotifications=${hasEmailNotifications}, email=${user.email}`);

          return isSelected && hasEmailNotifications;
        });

        const userEmails = selectedUsersWithEmails.map(user => user.email);

        console.log(`[ADMIN_NOTIFICATIONS] Filtered to ${selectedUsersWithEmails.length} users for email notifications: [${userEmails.join(', ')}]`);

        if (userEmails.length > 0) {
          await sendEmailNotification(notificationData, userEmails);
        }
      } catch (emailError) {
        console.error('Error sending email notifications:', emailError);
        // Don't fail the entire operation if email fails
      }
    }

    // Log the admin action
    await logAdminAction({
      adminUid: adminUserId,
      adminEmail: adminEmail,
      action: 'CREATE_NOTIFICATION_SELECTED_USERS',
      details: {
        notificationData,
        selectedUserIds,
        userCount: selectedUserIds.length,
        successCount,
        emailSent: sendAsEmail,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    });

    return successCount;
  } catch (error) {
    console.error('Error creating notifications for selected users:', error);
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