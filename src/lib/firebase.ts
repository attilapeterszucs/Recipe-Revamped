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
  type User,
  type ActionCodeSettings
} from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

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

// Email configuration for email verification
const emailVerificationSettings: ActionCodeSettings = {
  url: `${window.location.origin}/auth/action`, // Continue URL for Firebase auth actions
  handleCodeInApp: false // Handle the verification link in the browser, not in the app
};

// Alternative: Let Firebase handle verification with default settings
const defaultEmailVerificationSettings = undefined; // Use Firebase default settings

// Email configuration for password reset
const passwordResetSettings: ActionCodeSettings = {
  url: `${window.location.origin}/password-recovery`, // Continue URL for password reset
  handleCodeInApp: false // Handle the password reset link in the browser, not in the app
};

// Auth functions
export const signUpWithEmail = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Send email verification using Firebase default behavior
  logger.auth('Email verification sent', userCredential.user.uid);
  
  // Use Firebase's default email verification (sends to Firebase hosted domain)
  await sendEmailVerification(userCredential.user);
  
  return userCredential;
};

export const signInWithEmail = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Check if email is verified for email/password users
  if (!userCredential.user.emailVerified) {
    // Sign out the user immediately since they haven't verified
    await signOut(auth);
    throw new Error('Please verify your email address before signing in. Check your inbox for a verification email, or sign up again if needed.');
  }
  
  return userCredential;
};

export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const logOut = async () => {
  return await signOut(auth);
};

// Resend email verification
export const resendEmailVerification = async () => {
  const user = auth.currentUser;
  if (user && !user.emailVerified) {
    logger.auth('Resending email verification', user.uid);
    await sendEmailVerification(user);
    return true;
  }
  return false;
};

// Password reset function
export const resetPassword = async (email: string) => {
  logger.auth('Password reset email sent');
  await sendPasswordResetEmail(auth, email);
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
  
  // TODO: Integrate with actual email service (SendGrid, Mailgun, etc.)
  return true;
};

// Debug functions removed - admin system is working
