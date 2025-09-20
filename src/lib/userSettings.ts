import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { updateProfile, updateEmail } from 'firebase/auth';
import { db, auth, sendEmailChangeNotification } from './firebase';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { UserSettings } from '../types/userSettings';
import { DEFAULT_USER_SETTINGS } from '../types/userSettings';

const USER_SETTINGS_COLLECTION = 'userSettings';

// Get user settings from Firestore
export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  try {
    const settingsRef = doc(db, USER_SETTINGS_COLLECTION, userId);
    const settingsSnap = await getDoc(settingsRef);
  
  if (settingsSnap.exists()) {
    const data = settingsSnap.data();

    // Convert Firestore Timestamps to Date objects
    const convertedData: any = {
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };

    // Convert dates in personalProfile.healthGoals if they exist
    if (data.personalProfile?.healthGoals) {
      convertedData.personalProfile = {
        ...data.personalProfile,
        createdAt: data.personalProfile.createdAt?.toDate ? data.personalProfile.createdAt.toDate() : data.personalProfile.createdAt,
        updatedAt: data.personalProfile.updatedAt?.toDate ? data.personalProfile.updatedAt.toDate() : data.personalProfile.updatedAt,
        healthGoals: data.personalProfile.healthGoals.map((goal: any) => ({
          ...goal,
          targetDate: goal.targetDate?.toDate ? goal.targetDate.toDate() : goal.targetDate,
          createdAt: goal.createdAt?.toDate ? goal.createdAt.toDate() : goal.createdAt,
          updatedAt: goal.updatedAt?.toDate ? goal.updatedAt.toDate() : goal.updatedAt
        }))
      };
    }

    return convertedData as UserSettings;
  } else {
    // Create default settings if none exist
    const user = auth.currentUser;
    const defaultSettings: Partial<UserSettings> = {
      ...DEFAULT_USER_SETTINGS,
      displayName: user?.displayName || '',
      email: user?.email || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(settingsRef, {
      ...defaultSettings,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return defaultSettings as UserSettings;
  }
  } catch (error) {
    console.warn('Failed to get user settings from Firestore, using defaults:', error);
    // Return default settings if Firestore is blocked or unavailable
    const user = auth.currentUser;
    return {
      ...DEFAULT_USER_SETTINGS,
      displayName: user?.displayName || '',
      email: user?.email || '',
      createdAt: new Date(),
      updatedAt: new Date()
    } as UserSettings;
  }
};

// Update user settings in Firestore
export const updateUserSettings = async (
  userId: string, 
  settings: Partial<UserSettings>
): Promise<void> => {
  const settingsRef = doc(db, USER_SETTINGS_COLLECTION, userId);
  
  await updateDoc(settingsRef, {
    ...settings,
    updatedAt: serverTimestamp()
  });
};

// Update user profile (displayName and email)
export const updateUserProfile = async (
  displayName: string,
  email: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  const oldEmail = user.email;
  
  // Update Firebase Auth profile
  await updateProfile(user, { displayName });
  
  // Update email if changed
  if (email !== user.email) {
    await updateEmail(user, email);
    
    // Send notification to old email address
    if (oldEmail) {
      try {
        await sendEmailChangeNotification(email, oldEmail);
      } catch (error) {
        console.error('Failed to send email change notification:', error);
        // Don't fail the entire operation if notification fails
      }
    }
  }
  
  // Update settings in Firestore
  await updateUserSettings(user.uid, {
    displayName,
    email
  });
};

// Upload profile picture
export const uploadProfilePicture = async (
  file: File,
  userId: string
): Promise<string> => {
  const storage = getStorage();
  const user = auth.currentUser;
  
  // Delete old profile picture first to save storage space
  if (user && user.photoURL) {
    try {
      // Extract the file path from the photoURL and delete it
      const oldPhotoURL = user.photoURL;
      // Check if it's a Firebase Storage URL (not Google profile picture)
      if (oldPhotoURL.includes('firebasestorage.googleapis.com')) {
        // Extract the file path from the URL
        const urlParts = oldPhotoURL.split('/');
        const encodedPath = urlParts[urlParts.length - 1].split('?')[0];
        const filePath = decodeURIComponent(encodedPath);
        
        const oldPhotoRef = ref(storage, filePath);
        await deleteObject(oldPhotoRef);
      }
    } catch (error) {
      console.warn('Could not delete old profile picture:', error);
      // Continue with upload even if deletion fails
    }
  }
  
  const fileExtension = file.name.split('.').pop();
  const fileName = `profile_${userId}_${Date.now()}.${fileExtension}`;
  const storageRef = ref(storage, `profiles/${fileName}`);
  
  // Upload new file
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  // Update user profile with new photo URL
  if (user) {
    await updateProfile(user, { photoURL: downloadURL });
    
    // Update settings in Firestore
    await updateUserSettings(userId, {
      profilePictureUrl: downloadURL
    });
  }
  
  return downloadURL;
};

// Delete profile picture
export const deleteProfilePicture = async (userId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  // Get current photo URL to delete from storage
  const userSettings = await getUserSettings(userId);
  if (userSettings.profilePictureUrl) {
    try {
      const storage = getStorage();
      const photoRef = ref(storage, userSettings.profilePictureUrl);
      await deleteObject(photoRef);
    } catch (error) {
      console.warn('Failed to delete old profile picture:', error);
      // Continue with profile update even if delete fails
    }
  }
  
  // Remove photo URL from Firebase Auth and Firestore
  await updateProfile(user, { photoURL: null });
  await updateUserSettings(userId, {
    profilePictureUrl: null
  });
};

// Delete user settings
export const deleteUserSettings = async (userId: string): Promise<void> => {
  const settingsRef = doc(db, USER_SETTINGS_COLLECTION, userId);
  // Note: Using updateDoc to mark as deleted instead of deleteDoc for data safety
  await updateDoc(settingsRef, {
    deleted: true,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

// Clean up duplicate userSettings entries
export const cleanupDuplicateUserSettings = async (): Promise<void> => {
  try {
    
    // Get all userSettings documents
    const settingsRef = collection(db, USER_SETTINGS_COLLECTION);
    const allSettings = await getDocs(settingsRef);
    
    const userEmailMap = new Map<string, string[]>(); // email -> documentIds[]
    const userUidMap = new Map<string, string[]>(); // uid -> documentIds[]
    
    // Group documents by email and uid to identify duplicates
    allSettings.forEach(doc => {
      const data = doc.data();
      const docId = doc.id;
      
      // Skip deleted entries
      if (data.deleted) return;
      
      // Group by email
      if (data.email) {
        const email = data.email.toLowerCase();
        if (!userEmailMap.has(email)) {
          userEmailMap.set(email, []);
        }
        userEmailMap.get(email)!.push(docId);
      }
      
      // Group by uid (if present in document data)
      if (data.uid) {
        if (!userUidMap.has(data.uid)) {
          userUidMap.set(data.uid, []);
        }
        userUidMap.get(data.uid)!.push(docId);
      }
    });
    
    let duplicatesRemoved = 0;
    
    // Clean up email duplicates - keep the document with ID matching a user's UID if possible
    for (const [email, docIds] of userEmailMap.entries()) {
      if (docIds.length > 1) {
        
        // Sort by creation time, keeping the oldest
        const docsWithData = await Promise.all(
          docIds.map(async (docId) => {
            const docRef = doc(db, USER_SETTINGS_COLLECTION, docId);
            const docSnap = await getDoc(docRef);
            return { docId, data: docSnap.data() };
          })
        );
        
        // Keep the document that matches a valid user UID, or the oldest one
        docsWithData.sort((a, b) => {
          // Prioritize documents where docId looks like a Firebase UID (28 characters)
          const aIsUid = a.docId.length === 28;
          const bIsUid = b.docId.length === 28;
          
          if (aIsUid && !bIsUid) return -1;
          if (!aIsUid && bIsUid) return 1;
          
          // If both or neither are UIDs, sort by creation time
          const aTime = a.data?.createdAt?.toDate?.() || new Date(0);
          const bTime = b.data?.createdAt?.toDate?.() || new Date(0);
          return aTime - bTime;
        });
        
        // Keep the first (best) document, delete the rest
        for (let i = 1; i < docsWithData.length; i++) {
          const docToDelete = docsWithData[i];
          
          try {
            await deleteDoc(doc(db, USER_SETTINGS_COLLECTION, docToDelete.docId));
            duplicatesRemoved++;
          } catch (error) {
            console.error(`Failed to delete duplicate settings ${docToDelete.docId}:`, error);
          }
        }
      }
    }
    
    
    if (duplicatesRemoved > 0) {
      // Verify cleanup was successful
      const afterCleanup = await getDocs(settingsRef);
    }
    
  } catch (error) {
    console.error('Error during userSettings cleanup:', error);
    throw error;
  }
};