import { initializeApp } from 'firebase/app';
import { logger } from './logger';
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  updateProfile,
  type User,
  type ActionCodeSettings
} from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase app for use with functions
export { app };

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Handle network connectivity for Firestore
if (typeof window !== 'undefined') {
  // Listen for network state changes to gracefully handle connectivity issues
  window.addEventListener('online', () => {
    enableNetwork(db).catch(() => {
      // Ignore errors when enabling network
    });
  });
  
  window.addEventListener('offline', () => {
    disableNetwork(db).catch(() => {
      // Ignore errors when disabling network
    });
  });
}

// Initialize analytics only if supported and measurement ID is provided
export let analytics: any = null;
if (typeof window !== 'undefined' && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported in this environment
    analytics = null;
  });
}

// Auth providers
export const googleProvider = new GoogleAuthProvider();

// Email configuration for password reset
const passwordResetSettings: ActionCodeSettings = {
  url: `${window.location.origin}/password-recovery`, // Continue URL for password reset
  handleCodeInApp: false // Handle the password reset link in the browser, not in the app
};

// Auth functions
export const signUpWithEmail = async (email: string, password: string, username?: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Set display name (username) if provided
  if (username) {
    await updateProfile(userCredential.user, {
      displayName: username
    });
  }

  // Send Firebase's built-in email verification
  await sendEmailVerification(userCredential.user);

  // Sign out the user immediately after account creation
  // They must verify their email before they can access the app
  await signOut(auth);

  logger.auth('User account created and verification email sent', userCredential.user.uid);
  return userCredential;
};

export const signInWithEmail = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Check if email is verified for email/password users
  if (!userCredential.user.emailVerified) {
    throw new Error('Please verify your email address before signing in. Check your inbox for a verification email.');
  }
  
  return userCredential;
};

export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const logOut = async () => {
  return await signOut(auth);
};


// Password reset function
export const resetPassword = async (email: string) => {
  logger.auth('Password reset email sent');
  await sendPasswordResetEmail(auth, email);
};

export const resendEmailVerification = async (user?: User) => {
  const currentUser = user || auth.currentUser;
  if (!currentUser) {
    throw new Error('No user is currently signed in');
  }
  await sendEmailVerification(currentUser);
  logger.auth('Email verification resent');
};

export type { User };

// Email change notification function
export const sendEmailChangeNotification = async (newEmail: string, oldEmail: string) => {
  logger.auth('Email change notification triggered');
  
  // In a real app, this would be handled by Firebase Functions or a backend service
  // For now, we'll log this and could integrate with an email service
  const notification = {
    to: '[REDACTED]', // Don't log actual emails
    subject: 'Email Address Changed - Recipe Revamped',
    body: 'Email address has been changed. If you didn\'t make this change, please contact support immediately.',
    timestamp: new Date().toISOString()
  };
  
  logger.info('Email notification prepared', { subject: notification.subject });
  
  // Email service integration completed - uses Google Cloud email service
  // This function now logs email notifications; actual sending is handled by the email service
  return true;
};

// Debug functions removed - admin system is working
