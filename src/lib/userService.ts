import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: any;
  lastLoginAt?: any;
}

// Create or update user profile
export const createOrUpdateUserProfile = async (
  uid: string,
  email: string,
  displayName?: string,
  photoURL?: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const existingUser = await getDoc(userRef);
    
    // Generate default displayName from email if not provided
    let finalDisplayName = displayName;
    if (!finalDisplayName) {
      // Extract username from email (part before @)
      finalDisplayName = email.split('@')[0];
    }
    
    const userData: Partial<UserProfile> = {
      uid,
      email,
      displayName: finalDisplayName,
      lastLoginAt: serverTimestamp()
    };
    
    // Only include photoURL if it's not undefined
    if (photoURL !== undefined) {
      userData.photoURL = photoURL;
    }
    
    if (!existingUser.exists()) {
      userData.createdAt = serverTimestamp();
    }
    
    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
  }
};

// Get user profile by UID
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { uid, ...userDoc.data() } as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Get user profile by email
export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { uid: doc.id, ...doc.data() } as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile by email:', error);
    return null;
  }
};

// Get all user profiles
export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as UserProfile));
  } catch (error) {
    console.error('Error getting all user profiles:', error);
    return [];
  }
};

// Search users by email or display name
export const searchUsers = async (searchTerm: string): Promise<UserProfile[]> => {
  try {
    const allUsers = await getAllUserProfiles();
    
    return allUsers.filter(user => 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.uid.includes(searchTerm)
    );
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};