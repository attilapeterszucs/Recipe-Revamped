import { isUserAdmin, getAdminUser, initializeFirstAdmin } from '../lib/adminManagement';
import { cleanupDuplicateUserSettings } from '../lib/userSettings';
import { type User } from 'firebase/auth';

// Check if a user is an admin (async Firebase check)
export const isAdmin = async (userEmail: string, userUid: string): Promise<boolean> => {
  if (!userEmail || !userUid) return false;
  return await isUserAdmin(userEmail, userUid);
};

// Check if user has admin privileges (async Firebase check)
export const checkAdminAccess = async (user: User | null): Promise<boolean> => {
  if (!user || !user.email || !user.uid) return false;
  
  try {
    // Check admin status through Firestore for all users
    const firestoreResult = await isUserAdmin(user.email, user.uid);
    
    // For the designated super admin, provide fallback if Firestore fails
    if (user.email.toLowerCase() === 'attilaszucs2002@gmail.com' && !firestoreResult) {
      return true; // Fallback for super admin
    }
    
    return firestoreResult;
  } catch (error) {
    console.error('Error checking admin access:', error);
    
    // Only provide fallback for super admin if there's an error
    if (user.email.toLowerCase() === 'attilaszucs2002@gmail.com') {
      return true;
    }
    
    return false;
  }
};

// Get admin user data
export const getAdminData = async (user: User | null) => {
  if (!user || !user.email || !user.uid) return null;
  return await getAdminUser(user.email, user.uid);
};

// Initialize admin system with the specified email
export const initializeAdminSystem = async (user: User | null): Promise<boolean> => {
  if (!user || !user.email || !user.uid) return false;
  
  // Only initialize if this is the specified admin email
  if (user.email.toLowerCase() === 'attilaszucs2002@gmail.com') {
    // First check if user is already an admin
    const isAlreadyAdmin = await isUserAdmin(user.email, user.uid);
    
    // Run cleanup if admin is initializing for the first time
    if (!isAlreadyAdmin) {
      try {
        await cleanupDuplicateUserSettings();
      } catch (error) {
        console.error('Failed to cleanup duplicate userSettings:', error);
        // Don't fail admin initialization if cleanup fails
      }
    }
    
    if (isAlreadyAdmin) {
      return true;
    }
    
    const result = await initializeFirstAdmin(
      user.email,
      user.uid,
      user.displayName || 'Admin User'
    );
    return result;
  }
  
  return false;
};