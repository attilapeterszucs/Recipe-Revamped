import { collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Test utility to create sample users and notifications for admin panel testing
export const createTestData = async () => {
  try {
    
    // Create test users
    const testUsers = [
      {
        uid: 'test-user-1',
        email: 'user1@example.com',
        displayName: 'Test User 1',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      },
      {
        uid: 'test-user-2', 
        email: 'user2@example.com',
        displayName: 'Test User 2',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      },
      {
        uid: 'test-user-3',
        email: 'user3@example.com', 
        displayName: 'Test User 3',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      }
    ];

    // Add users to the users collection
    for (const user of testUsers) {
      await setDoc(doc(db, 'users', user.uid), user);
    }

    // Create test notifications
    const testNotifications = [
      {
        userId: 'test-user-1',
        title: 'Welcome to Recipe Revamp!',
        message: 'Thanks for joining our platform.',
        type: 'info',
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: '3uZavLRBenTTRx37gaGzZzcyfAJ2',
        createdByAdmin: 'attilaszucs2002@gmail.com'
      },
      {
        userId: 'test-user-2',
        title: 'New Features Available',
        message: 'Check out our latest recipe conversion tools.',
        type: 'update', 
        isRead: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: '3uZavLRBenTTRx37gaGzZzcyfAJ2',
        createdByAdmin: 'attilaszucs2002@gmail.com'
      },
      {
        userId: 'test-user-3',
        title: 'Special Offer',
        message: 'Upgrade to premium for advanced features!',
        type: 'success',
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: '3uZavLRBenTTRx37gaGzZzcyfAJ2',
        createdByAdmin: 'attilaszucs2002@gmail.com'
      }
    ];

    // Add notifications
    for (const notification of testNotifications) {
      await addDoc(collection(db, 'notifications'), notification);
    }

    
    return {
      usersCreated: testUsers.length,
      notificationsCreated: testNotifications.length
    };
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
};

// Cleanup function to remove test data
export const cleanupTestData = async () => {
  try {
    
    // Note: In a real app, you'd want to query and delete documents
    // For now, just log that this should be done manually
    
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).createTestData = createTestData;
  (window as unknown as Record<string, unknown>).cleanupTestData = cleanupTestData;
}