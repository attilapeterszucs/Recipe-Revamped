import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where 
} from 'firebase/firestore';
import { db } from './firebase';

export interface AdminUser {
  id?: string;
  email: string;
  uid: string;
  displayName?: string;
  role: 'admin' | 'super_admin';
  createdAt: any;
  createdBy: string;
  isActive: boolean;
}

export interface AdminAction {
  id?: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  targetUid?: string;
  targetEmail?: string;
  details: any;
  timestamp: any;
}

// Check if a user is an admin by checking the admins collection
export const isUserAdmin = async (userEmail: string, userUid: string): Promise<boolean> => {
  try {
    if (!userEmail || !userUid) return false;
    
    const adminsRef = collection(db, 'admins');
    const q = query(
      adminsRef, 
      where('email', '==', userEmail.toLowerCase()),
      where('uid', '==', userUid),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get admin user data
export const getAdminUser = async (userEmail: string, userUid: string): Promise<AdminUser | null> => {
  try {
    const adminsRef = collection(db, 'admins');
    const q = query(
      adminsRef, 
      where('email', '==', userEmail.toLowerCase()),
      where('uid', '==', userUid),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as AdminUser;
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
};

// Add a new admin user
export const addAdminUser = async (
  email: string,
  uid: string,
  displayName: string,
  role: 'admin' | 'super_admin',
  createdByUid: string
): Promise<boolean> => {
  try {
    // Check if user is already an admin (including inactive ones)
    const adminsRef = collection(db, 'admins');
    const q = query(
      adminsRef,
      where('email', '==', email.toLowerCase()),
      where('uid', '==', uid)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Check if there's an active admin record
      const activeAdmin = snapshot.docs.find(doc => doc.data().isActive === true);
      if (activeAdmin) {
        return false;
      }
      
      // If there are only inactive records, reactivate the most recent one
      const mostRecentDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'admins', mostRecentDoc.id), {
        isActive: true,
        displayName,
        role,
        reactivatedAt: serverTimestamp(),
        reactivatedBy: createdByUid
      });

      // Also set isAdmin flag in user document
      try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          isAdmin: true
        });
      } catch (error) {
        console.error('Error updating user isAdmin flag:', error);
      }

      // Log the reactivation
      await logAdminAction({
        adminUid: createdByUid,
        adminEmail: '', // Will be filled by the calling function
        action: 'REACTIVATE_ADMIN',
        targetUid: uid,
        targetEmail: email,
        details: { role, displayName },
      timestamp: new Date()
      });

      return true;
    }
    
    // No existing record found, create new one
    const adminData: Omit<AdminUser, 'id'> = {
      email: email.toLowerCase(),
      uid,
      displayName,
      role,
      createdAt: serverTimestamp(),
      createdBy: createdByUid,
      isActive: true
    };
    
    await addDoc(collection(db, 'admins'), adminData);

    // Also set isAdmin flag in user document for security rules
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        isAdmin: true
      });
    } catch (error) {
      console.error('Error updating user isAdmin flag:', error);
      // Continue even if this fails - the admins collection is the source of truth
    }

    // Log the admin action
    await logAdminAction({
      adminUid: createdByUid,
      adminEmail: '', // Will be filled by the calling function
      action: 'ADD_ADMIN',
      targetUid: uid,
      targetEmail: email,
      details: { role, displayName },
      timestamp: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error adding admin user:', error);
    return false;
  }
};

// Remove admin privileges
export const removeAdminUser = async (
  targetEmail: string,
  targetUid: string,
  removedByUid: string
): Promise<boolean> => {
  try {
    const adminsRef = collection(db, 'admins');
    const q = query(
      adminsRef, 
      where('email', '==', targetEmail.toLowerCase()),
      where('uid', '==', targetUid),
      where('isActive', '==', true) // Only look for active admin records
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return false;
    }
    
    const adminDoc = snapshot.docs[0];
    
    await updateDoc(doc(db, 'admins', adminDoc.id), {
      isActive: false,
      removedAt: serverTimestamp(),
      removedBy: removedByUid
    });

    // Also remove isAdmin flag from user document
    try {
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, {
        isAdmin: false
      });
    } catch (error) {
      console.error('Error updating user isAdmin flag:', error);
      // Continue even if this fails
    }

    // Log the admin action
    await logAdminAction({
      adminUid: removedByUid,
      adminEmail: '', // Will be filled by the calling function
      action: 'REMOVE_ADMIN',
      targetUid,
      targetEmail,
      details: { reason: 'Admin privileges revoked' },
      timestamp: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error removing admin user:', error);
    return false;
  }
};

// Get all admin users
export const getAllAdmins = async (): Promise<AdminUser[]> => {
  try {
    const adminsRef = collection(db, 'admins');
    const q = query(adminsRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AdminUser));
  } catch (error) {
    console.error('Error getting all admins:', error);
    return [];
  }
};

// Log admin actions for audit trail
export const logAdminAction = async (actionData: Omit<AdminAction, 'id'>): Promise<void> => {
  try {
    await addDoc(collection(db, 'adminActions'), {
      ...actionData,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

// Initialize the first super admin (should be run once)
export const initializeFirstAdmin = async (
  email: string,
  uid: string,
  displayName: string
): Promise<boolean> => {
  try {
    // Check if this specific user is already an admin (including inactive ones)
    const adminsRef = collection(db, 'admins');
    const userQuery = query(
      adminsRef,
      where('email', '==', email.toLowerCase()),
      where('uid', '==', uid)
    );
    
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      // Check if there's an active admin record
      const activeAdmin = userSnapshot.docs.find(doc => doc.data().isActive === true);
      if (activeAdmin) {
        return true; // User is already an active admin
      }
      
      // If there are only inactive records, reactivate the most recent one
      const mostRecentDoc = userSnapshot.docs[0];
      await updateDoc(doc(db, 'admins', mostRecentDoc.id), {
        isActive: true,
        displayName,
        role: 'super_admin',
        reactivatedAt: serverTimestamp(),
        reactivatedBy: 'system_init'
      });

      // Also set isAdmin flag in user document
      try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          isAdmin: true
        });
      } catch (error) {
        console.error('Error updating user isAdmin flag:', error);
      }

      await logAdminAction({
        adminUid: 'system',
        adminEmail: 'system',
        action: 'REACTIVATE_DESIGNATED_ADMIN',
        targetUid: uid,
        targetEmail: email,
        details: { role: 'super_admin', displayName },
        timestamp: new Date()
      });

      return true;
    }
    
    // Check if any admins exist at all
    const existingAdmins = await getAllAdmins();
    
    // If this is the designated admin email, make them admin regardless
    if (email.toLowerCase() === 'attilaszucs2002@gmail.com') {
      const adminData: Omit<AdminUser, 'id'> = {
        email: email.toLowerCase(),
        uid,
        displayName,
        role: 'super_admin',
        createdAt: serverTimestamp(),
        createdBy: existingAdmins.length > 0 ? 'system_add' : 'system_init',
        isActive: true
      };
      
      await addDoc(collection(db, 'admins'), adminData);

      // Also set isAdmin flag in user document
      try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          isAdmin: true
        });
      } catch (error) {
        console.error('Error updating user isAdmin flag:', error);
      }

      // Log the initialization
      await logAdminAction({
        adminUid: 'system',
        adminEmail: 'system',
        action: existingAdmins.length > 0 ? 'ADD_DESIGNATED_ADMIN' : 'INITIALIZE_FIRST_ADMIN',
        targetUid: uid,
        targetEmail: email,
        details: { role: 'super_admin', displayName },
        timestamp: new Date()
      });

      return true;
    }
    
    // For other users, only create if no admins exist
    if (existingAdmins.length > 0) {
      return false;
    }
    
    // Create the first admin if none exist
    const adminData: Omit<AdminUser, 'id'> = {
      email: email.toLowerCase(),
      uid,
      displayName,
      role: 'super_admin',
      createdAt: serverTimestamp(),
      createdBy: 'system_init',
      isActive: true
    };
    
    await addDoc(collection(db, 'admins'), adminData);

    // Also set isAdmin flag in user document
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        isAdmin: true
      });
    } catch (error) {
      console.error('Error updating user isAdmin flag:', error);
    }

    // Log the initialization
    await logAdminAction({
      adminUid: 'system',
      adminEmail: 'system',
      action: 'INITIALIZE_FIRST_ADMIN',
      targetUid: uid,
      targetEmail: email,
      details: { role: 'super_admin', displayName },
      timestamp: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error initializing first admin:', error);
    return false;
  }
};

