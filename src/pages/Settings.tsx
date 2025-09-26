import React, { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Save,
  User as UserIcon,
  Palette,
  Bell,
  Shield,
  Bot,
  Database,
  UserCog,
  ChevronRight,
  Check,
  X,
  Download,
  Upload,
  Clock,
  Heart,
  Trash2,
  Lock,
  CreditCard,
  AlertTriangle,
  UserX,
  Info,
  Activity,
  Crown,
  ArrowRight
} from 'lucide-react';
import { getUserSettings, updateUserSettings, updateUserProfile, uploadProfilePicture, deleteProfilePicture } from '../lib/userSettings';
import { createBackup, getUserBackups, restoreFromBackup, scheduleAutoBackup, deleteBackup } from '../lib/backup';
import { getUserRecipes } from '../lib/firestore';
import type { UserSettings, PersonalProfile } from '../types/userSettings';
import { DEFAULT_PERSONAL_PROFILE } from '../types/userSettings';
import type { BackupData, RecoveryOptions } from '../types/backup';
import { useToast } from '../components/ToastContainer';
import { Toggle } from '../components/Toggle';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { RestoreConfirmationModal } from '../components/RestoreConfirmationModal';
import { PersonalProfileEditor } from '../components/PersonalProfileEditor';
import { HealthGoalsManager } from '../components/HealthGoalsManager';
import { AdminNotificationCreator } from '../components/AdminNotificationCreator';
import { AdminUserManagement } from '../components/AdminUserManagement';
import { AdminBlogManagement } from '../components/AdminBlogManagement';
import { MarketingEmailCampaign } from '../components/MarketingEmailCampaign';
import { checkAdminAccess, initializeAdminSystem } from '../utils/adminUtils';
import { useSubscriptionRefresh } from '../contexts/SubscriptionContext';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { CancelSubscriptionButton } from '../components/SubscriptionCancellation/CancelSubscriptionButton';

interface SettingsProps {
  user: User;
  onBack: () => void;
  onSettingsUpdate?: (settings: UserSettings) => void;
  initialActiveSection?: string;
  featureAccess?: {
    canSetDefaultPreferences: boolean;
    canBackupRestore: boolean;
    canUploadProfilePicture: boolean;
    canUseHealthConditions: boolean;
    canUseHealthGoals: boolean;
    availableDietaryFilters: string[];
    currentPlan: string;
  };
}

export const Settings: React.FC<SettingsProps> = ({ user, onBack, onSettingsUpdate, initialActiveSection, featureAccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(initialActiveSection || 'profile');

  // Debug logging and handle prop changes
  useEffect(() => {
    if (initialActiveSection) {
      console.log('Settings received initialActiveSection:', initialActiveSection);
      setActiveSection(initialActiveSection);

      // Clean up URL search params after setting the section
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('section')) {
        searchParams.delete('section');
        const newSearch = searchParams.toString();
        navigate(location.pathname + (newSearch ? `?${newSearch}` : ''), { replace: true });
      }
    }
  }, [initialActiveSection, navigate, location]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<BackupData | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<BackupData | null>(null);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [recipeCount, setRecipeCount] = useState<number>(0);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [cancelSectionHidden, setCancelSectionHidden] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();
  
  // Use subscription status hook for consistent admin checking
  const { isAdmin: isUserAdmin, loading: adminCheckLoading, refresh: refreshSubscriptionStatus, subscription } = useSubscriptionStatus(
    user?.uid,
    user?.email
  );
  
  // Get subscription refresh trigger for global refreshes
  const { refreshTrigger } = useSubscriptionRefresh();

  useEffect(() => {
    loadUserSettings();
    loadRecipeCount();
    initializeAdminSystemIfNeeded();

    // Set up real-time listener for user settings changes
    const setupSettingsListener = async () => {
      try {
        const { doc, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');

        const userDocRef = doc(db, 'userSettings', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            // Reload settings when they change (e.g., from unsubscribe page)
            loadUserSettings();
          }
        });

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up settings listener:', error);
      }
    };

    let unsubscribeListener: (() => void) | undefined;
    setupSettingsListener().then((unsubscribe) => {
      unsubscribeListener = unsubscribe;
    });

    // Cleanup listener on unmount
    return () => {
      if (unsubscribeListener) {
        unsubscribeListener();
      }
    };
  }, [user.uid]);

  // Refresh admin status when global subscription refresh is triggered
  useEffect(() => {
    refreshSubscriptionStatus();
  }, [refreshTrigger]);

  // Auto-set admin tab when entering admin mode and load backups when data section opens
  useEffect(() => {
    if (activeSection === 'admin') {
      setActiveSection('admin-users');
    }
    if (activeSection === 'data' && featureAccess?.canBackupRestore) {
      loadBackups();
    }
  }, [activeSection]);

  const initializeAdminSystemIfNeeded = async () => {
    try {
      // Initialize admin system if this is the designated admin
      await initializeAdminSystem(user);
      // Refresh subscription status after initialization to ensure admin privileges are detected
      refreshSubscriptionStatus();
    } catch (error) {
      console.error('Error initializing admin system:', error);
    }
  };

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await getUserSettings(user.uid);
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipeCount = async () => {
    try {
      const recipes = await getUserRecipes(user.uid, 1000); // Get all recipes to count
      setRecipeCount(recipes.length);
    } catch (error) {
      console.error('Failed to load recipe count:', error);
      // Don't show error to user as this is not critical
    }
  };

  // Get backup limits based on subscription plan
  const getBackupLimits = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'chef':
        return { limit: 3, planName: 'Chef' };
      case 'master-chef':
        return { limit: 5, planName: 'Master Chef' };
      case 'enterprise':
        return { limit: 10, planName: 'Enterprise' };
      default:
        return { limit: 0, planName: 'Free' };
    }
  };

  // Password validation function
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters long');
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
    if (!/\d/.test(password)) errors.push('At least one number');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('At least one special character');
    return errors;
  };


  // Handle account deletion/deactivation
  const handleDeleteAccount = async (action: 'deactivate' | 'delete') => {
    try {
      setDeletingAccount(true);
      setShowDeleteAccountModal(false);

      // Show immediate feedback and redirect for deletion
      if (action === 'delete') {
        showInfo('Account Deletion Started', 'You are being signed out. Your account deletion is now processing in the background.');

        // Immediate redirect to signin page
        setTimeout(() => {
          window.location.href = '/signin';
        }, 1500); // Brief delay to show the message
      }

      // Import necessary services
      const { SubscriptionService } = await import('../lib/subscriptionService');
      const { SubscriptionCancellationService } = await import('../lib/subscriptionCancellationService');
      const { updateProfile, deleteUser } = await import('firebase/auth');
      const { doc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');

      // First cancel any active subscription
      const currentPlan = featureAccess?.currentPlan;
      if (currentPlan && currentPlan !== 'free') {
        try {
          let cancellationResult;
          if (action === 'deactivate') {
            // For deactivation: End-of-period cancellation (keep access until expiry)
            cancellationResult = await SubscriptionCancellationService.cancelSubscription(
              'Account deactivation - subscription will remain active until expiry'
            );
          } else {
            // For deletion: Immediate cancellation (terminate access immediately)
            cancellationResult = await SubscriptionCancellationService.cancelSubscriptionImmediately(
              'Account deletion - immediate subscription termination'
            );
          }

          if (cancellationResult.success) {
            // Subscription cancelled successfully
          } else {
            console.warn('⚠️ Could not automatically cancel subscription:', cancellationResult.error);
          }
        } catch (error) {
          console.warn('⚠️ Could not cancel subscription during account action:', error);
          // Continue with account action even if subscription cancellation fails
        }
      }
      
      if (action === 'deactivate') {
        // Set account as deactivated in Firestore
        const userDoc = doc(db, 'users', user.uid);
        await updateDoc(userDoc, {
          accountStatus: 'deactivated',
          deactivatedAt: new Date(),
          updatedAt: new Date()
        });
        
        // Update display name to indicate deactivation (optional visual cue)
        await updateProfile(user, {
          displayName: `${user.displayName || 'User'} (Deactivated)`
        });
        
        showSuccess('Account Deactivated', 'Your account has been deactivated. You can reactivate it on your next login.');
        
        // Sign out user after a delay
        setTimeout(() => {
          import('firebase/auth').then(({ signOut, getAuth }) => {
            signOut(getAuth());
          });
        }, 2000);
        
      } else {
        // Complete account deletion - remove from Firebase Auth and all Firestore data
        showInfo('Deleting Account', 'Removing all your data from our servers. This may take a moment...');
        
        // Delete all user's recipes
        const recipesQuery = query(collection(db, 'recipes'), where('userId', '==', user.uid));
        const recipesSnapshot = await getDocs(recipesQuery);
        
        // Use batch delete for better performance
        const batch = writeBatch(db);
        recipesSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        // Delete user's settings, profile, and subscription
        batch.delete(doc(db, 'users', user.uid));
        batch.delete(doc(db, 'userSettings', user.uid));
        batch.delete(doc(db, 'subscriptions', user.uid));
        
        // Delete any user backups
        const backupsQuery = query(collection(db, 'backups'), where('userId', '==', user.uid));
        const backupsSnapshot = await getDocs(backupsQuery);
        backupsSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        // Delete any user notifications
        const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const notificationsSnapshot = await getDocs(notificationsQuery);
        notificationsSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        // Execute all Firestore deletions
        await batch.commit();
        
        // Finally, delete the Firebase Auth user account
        await deleteUser(user);

        // Account deletion completed in background (user already redirected)
      }
      
    } catch (error) {
      console.error('Failed to delete/deactivate account:', error);
      
      if (error.code === 'auth/requires-recent-login') {
        showError('Authentication Required', 'For security reasons, you need to sign in again before deleting your account. Please sign out, sign back in, and try again.');
      } else {
        showError('Operation Failed', 'Could not complete the account operation. Please try again or contact support.');
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showError('Missing Fields', 'Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Password Mismatch', 'New password and confirmation do not match');
      return;
    }

    const passwordErrors = validatePassword(passwordForm.newPassword);
    if (passwordErrors.length > 0) {
      showError('Invalid Password', `Password must have: ${passwordErrors.join(', ')}`);
      return;
    }

    try {
      setChangingPassword(true);
      
      // Import Firebase auth functions
      const { updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import('firebase/auth');
      
      if (!user) throw new Error('User not authenticated');
      
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email!, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update to new password
      await updatePassword(user, passwordForm.newPassword);
      
      // Clear form and show success
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      showSuccess('Password Updated', 'Your password has been successfully changed');
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.code === 'auth/wrong-password') {
        showError('Invalid Password', 'Current password is incorrect');
      } else if (error.code === 'auth/too-many-requests') {
        showError('Too Many Attempts', 'Please wait before trying again');
      } else {
        showError('Password Change Failed', 'Could not update password. Please try again.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // Helper function to recursively remove undefined values from objects
  const cleanUndefinedValues = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(cleanUndefinedValues).filter(item => item !== undefined);
    }

    if (obj instanceof Date) {
      return obj;
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          const cleanedValue = cleanUndefinedValues(value);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return cleaned;
    }

    return obj;
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setSaveStatus('saving');

      // Update profile info (only if not Google user for email)
      const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
      const emailToUpdate = isGoogleUser ? user.email : settings.email;

      if (settings.displayName !== user.displayName || (!isGoogleUser && emailToUpdate !== user.email)) {
        await updateUserProfile(settings.displayName, emailToUpdate || '');
      }

      // Clean undefined values before saving to Firestore
      const cleanedSettings = cleanUndefinedValues(settings);

      // Update other settings
      await updateUserSettings(user.uid, cleanedSettings);
      
      // Handle backup setting change
      if (settings.backupToCloud) {
        await scheduleAutoBackup(user.uid);
      }
      
      setSaveStatus('saved');
      
      // Notify parent component of settings update
      if (onSettingsUpdate) {
        onSettingsUpdate(settings);
      }
      
      showSuccess('Settings Saved', 'Your preferences have been successfully updated', 'settings');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      showError('Settings Save Failed', 'Could not save your preferences. Please try again.', 'settings');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    if (!settings) return;
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleCreateBackup = async () => {
    // Check if user has at least 1 recipe
    if (recipeCount === 0) {
      showError('No Recipes to Backup', 'You need to save at least 1 recipe before creating a backup. Start by converting or creating some recipes!', 'backup');
      return;
    }

    // Check backup limits based on subscription plan
    const currentPlan = featureAccess?.currentPlan || 'free';
    const { limit, planName } = getBackupLimits(currentPlan);
    
    if (limit === 0) {
      showError('Backup Restricted', 'Backup functionality requires a paid plan. Please upgrade to access backup features.', 'backup');
      return;
    }

    if (backups.length >= limit) {
      showError('Backup Limit Reached', `You've reached your ${planName} plan limit of ${limit} backups. Please delete some existing backups before creating new ones.`, 'backup');
      return;
    }

    try {
      setBackupLoading(true);
      await createBackup(user.uid);
      await loadBackups();
      showSuccess('Backup Created', 'Your data has been successfully backed up to the cloud', 'backup');
    } catch (error) {
      console.error('Failed to create backup:', error);
      if (error.message && error.message.includes('net::ERR_BLOCKED_BY_CLIENT')) {
        showError('Network Blocked', 'Your ad blocker or network settings are preventing backup creation. Please disable ad blockers for this site.', 'backup');
      } else {
        showError('Backup Failed', 'Could not create backup. Please check your permissions and try again.', 'backup');
      }
    } finally {
      setBackupLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      const userBackups = await getUserBackups(user.uid);
      setBackups(userBackups);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const handleRestore = async (backupId: string) => {
    try {
      setRestoringBackup(backupId);
      const options: RecoveryOptions = {
        includeRecipes: true,
        includeSettings: false, // Don't restore settings to avoid conflicts
        dateRange: {
          start: new Date(0), // Beginning of time
          end: new Date() // Now
        }
      };

      const result = await restoreFromBackup(user.uid, backupId, options);
      
      // Create a detailed success message
      let message = '';
      if (result.restoredRecipes > 0 && result.skippedDuplicates > 0) {
        message = `Restored ${result.restoredRecipes} new recipes and skipped ${result.skippedDuplicates} duplicates`;
      } else if (result.restoredRecipes > 0) {
        message = `Successfully restored ${result.restoredRecipes} recipes from backup`;
      } else if (result.skippedDuplicates > 0) {
        message = `All ${result.skippedDuplicates} recipes were already in your collection`;
      } else {
        message = 'No recipes were found to restore';
      }
      
      showSuccess('Restore Complete', message, 'restore');
    } catch (error) {
      console.error('Failed to restore backup:', error);
      if (error.message && error.message.includes('net::ERR_BLOCKED_BY_CLIENT')) {
        showError('Network Blocked', 'Your ad blocker or network settings are preventing data restoration. Please disable ad blockers for this site.', 'restore');
      } else {
        showError('Restore Failed', 'Could not restore data from backup. Please try again.', 'restore');
      }
    } finally {
      setRestoringBackup(null);
    }
  };

  const handleRestoreClick = (backup: BackupData) => {
    setBackupToRestore(backup);
    setShowRestoreModal(true);
  };

  const handleRestoreConfirm = () => {
    if (backupToRestore) {
      handleRestore(backupToRestore.id);
      setBackupToRestore(null);
      setShowRestoreModal(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await deleteBackup(backupId);
      // Remove the deleted backup from local state
      setBackups(prev => prev.filter(backup => backup.id !== backupId));
      showSuccess('Backup Deleted', 'The recovery point has been permanently deleted', 'delete');
    } catch (error) {
      console.error('Failed to delete backup:', error);
      if (error.message && error.message.includes('net::ERR_BLOCKED_BY_CLIENT')) {
        showError('Network Blocked', 'Your ad blocker or network settings are preventing this action. Please disable ad blockers for this site.', 'delete');
      } else {
        showError('Delete Failed', 'Could not delete the backup. Please try again.', 'delete');
      }
    }
  };

  const handleDeleteClick = (backup: BackupData) => {
    setBackupToDelete(backup);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (backupToDelete) {
      handleDeleteBackup(backupToDelete.id);
      setBackupToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleProfilePictureUpload = async (file: File) => {
    try {
      setUploadingProfilePicture(true);
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showError('Invalid File Type', 'Please select a JPEG, PNG, or WebP image file');
        return;
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        showError('File Too Large', 'Please select an image smaller than 5MB');
        return;
      }
      
      const photoURL = await uploadProfilePicture(file, user.uid);
      
      // Update local settings
      setSettings(prev => prev ? { ...prev, profilePictureUrl: photoURL } : null);
      
      showSuccess('Profile Picture Updated', 'Your profile picture has been successfully changed');
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      showError('Upload Failed', 'Could not upload profile picture. Please try again.');
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  const handleProfilePictureDelete = async () => {
    try {
      setUploadingProfilePicture(true);
      await deleteProfilePicture(user.uid);
      
      // Update local settings
      setSettings(prev => prev ? { ...prev, profilePictureUrl: null } : null);
      
      showSuccess('Profile Picture Removed', 'Your profile picture has been removed');
    } catch (error) {
      console.error('Failed to delete profile picture:', error);
      showError('Delete Failed', 'Could not remove profile picture. Please try again.');
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  // Get current profile picture URL (prioritize Google for Google users, then custom uploads)
  const getCurrentProfilePicture = () => {
    const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
    
    // For Google users, show Google photo by default unless they have a custom upload
    if (isGoogleUser && user.photoURL && !settings?.profilePictureUrl) {
      return user.photoURL;
    }
    
    // Show custom uploaded picture if available (overrides Google photo)
    if (settings?.profilePictureUrl) {
      return settings.profilePictureUrl;
    }
    
    // Fallback to Firebase Auth photo for non-Google users
    if (user.photoURL) {
      return user.photoURL;
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load settings</p>
          <button 
            onClick={loadUserSettings}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'profile', label: 'Account', icon: UserIcon },
    { id: 'personal', label: 'Personal Profile & Goals', icon: Activity },
    { id: 'recipe-settings', label: 'Recipe Settings', icon: Bot },
    { id: 'preferences', label: 'Dietary Filters', icon: Palette },
    { id: 'health', label: 'Health Conditions', icon: Heart },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Backup', icon: Database },
    ...(isUserAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: UserCog }] : [])
  ];

  const dietaryOptions = [
    {
      name: 'Vegetarian',
      description: 'Plant-based with dairy & eggs',
      icon: '🥬',
      category: 'plant-based',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      name: 'Vegan',
      description: 'Completely plant-based',
      icon: '🌱',
      category: 'plant-based',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      name: 'Plant-Based',
      description: 'Focus on plants, minimal animal products',
      icon: '🌿',
      category: 'plant-based',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      name: 'Pescatarian',
      description: 'Vegetarian plus fish and seafood',
      icon: '🐟',
      category: 'plant-based',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      name: 'Gluten-Free',
      description: 'No wheat, barley, or rye',
      icon: '🌾',
      category: 'allergen-free',
      color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
    },
    {
      name: 'Dairy-Free',
      description: 'No milk or dairy products',
      icon: '🥛',
      category: 'allergen-free',
      color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
    },
    {
      name: 'Nut-Free',
      description: 'No nuts or nut products',
      icon: '🥜',
      category: 'allergen-free',
      color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
    },
    {
      name: 'Sugar-Free',
      description: 'No added sugars or sweeteners',
      icon: '🍯',
      category: 'allergen-free',
      color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
    },
    {
      name: 'Keto',
      description: 'High fat, very low carb',
      icon: '🥑',
      category: 'low-carb',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      name: 'Low-Carb',
      description: 'Reduced carbohydrate intake',
      icon: '🥩',
      category: 'low-carb',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      name: 'Paleo',
      description: 'Whole foods, no processed',
      icon: '🍖',
      category: 'whole-foods',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    },
    {
      name: 'Whole30',
      description: '30-day whole food reset',
      icon: '🥕',
      category: 'whole-foods',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    },
    {
      name: 'Raw-Food',
      description: 'Uncooked, unprocessed foods',
      icon: '🥒',
      category: 'whole-foods',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    },
    {
      name: 'High-Protein',
      description: 'Protein-rich recipes',
      icon: '💪',
      category: 'fitness',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      name: 'Low-Sodium',
      description: 'Reduced sodium content',
      icon: '🧂',
      category: 'fitness',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      name: 'Intermittent-Fasting',
      description: 'Compatible with fasting windows',
      icon: '⏰',
      category: 'fitness',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      name: 'Macro-Friendly',
      description: 'Balanced macronutrients for tracking',
      icon: '📊',
      category: 'fitness',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      name: 'Carnivore',
      description: 'Animal products only',
      icon: '🥩',
      category: 'fitness',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      name: 'Mediterranean',
      description: 'Heart-healthy Mediterranean',
      icon: '🫒',
      category: 'regional',
      color: 'bg-teal-50 border-teal-200 hover:bg-teal-100'
    },
    {
      name: 'Diabetic-Friendly',
      description: 'Blood sugar friendly',
      icon: '🩺',
      category: 'health',
      color: 'bg-pink-50 border-pink-200 hover:bg-pink-100'
    },
    {
      name: 'Heart-Healthy',
      description: 'Cardiovascular health focused',
      icon: '❤️',
      category: 'health',
      color: 'bg-pink-50 border-pink-200 hover:bg-pink-100'
    },
    {
      name: 'Anti-Inflammatory',
      description: 'Reduces inflammation',
      icon: '🫐',
      category: 'health',
      color: 'bg-pink-50 border-pink-200 hover:bg-pink-100'
    },
    {
      name: 'FODMAP-Friendly',
      description: 'Digestive system friendly',
      icon: '🌸',
      category: 'health',
      color: 'bg-pink-50 border-pink-200 hover:bg-pink-100'
    },
    {
      name: 'Alkaline',
      description: 'pH balancing foods',
      icon: '🥝',
      category: 'health',
      color: 'bg-pink-50 border-pink-200 hover:bg-pink-100'
    },
    {
      name: 'Halal',
      description: 'Islamic dietary laws',
      icon: '☪️',
      category: 'religious',
      color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
    },
    {
      name: 'Kosher',
      description: 'Jewish dietary laws',
      icon: '✡️',
      category: 'religious',
      color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
    }
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        const currentProfilePicture = getCurrentProfilePicture();
        const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
        const canUploadProfilePicture = featureAccess?.canUploadProfilePicture || false;
        
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Account</h3>
              <p className="text-gray-600 leading-relaxed">
                Manage your account information, profile picture, and security settings. Update your personal details and control your Recipe Revamped experience.
              </p>
            </div>

            {/* Profile Picture Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
              <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-4">
                Profile Picture
              </label>

              {canUploadProfilePicture ? (
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  {/* Current Profile Picture */}
                  <div className="relative flex-shrink-0">
                    {currentProfilePicture ? (
                      <img
                        src={currentProfilePicture}
                        alt="Profile"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-200 shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200 shadow-md">
                        <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                      </div>
                    )}

                    {uploadingProfilePicture && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 w-full sm:w-auto">
                    <input
                      type="file"
                      id="profile-picture-upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleProfilePictureUpload(file);
                        }
                        // Clear the input
                        e.target.value = '';
                      }}
                      disabled={uploadingProfilePicture}
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 mb-3">
                      <label
                        htmlFor="profile-picture-upload"
                        className={`cursor-pointer inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors touch-friendly min-h-[44px] ${
                          uploadingProfilePicture ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingProfilePicture ? 'Uploading...' : 'Change Picture'}
                      </label>

                      {currentProfilePicture && !uploadingProfilePicture && (
                        <button
                          onClick={handleProfilePictureDelete}
                          className="inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors touch-friendly min-h-[44px]"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </button>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                      JPG, PNG, or WebP. Max file size 5MB.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    {/* Current Profile Picture (Read-only) */}
                    <div className="relative flex-shrink-0">
                      {currentProfilePicture ? (
                        <img
                          src={currentProfilePicture}
                          alt="Profile"
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-orange-200"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-100 flex items-center justify-center border-4 border-orange-200">
                          <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-base sm:text-lg font-semibold text-orange-800 mb-2">
                        Premium Profile Pictures
                      </h4>
                      <p className="text-orange-700 text-sm mb-3 leading-relaxed">
                        Upload custom profile pictures with Chef plan or higher. Stand out with a personalized profile image.
                      </p>
                      <div className="text-xs text-orange-600 mb-4 leading-relaxed">
                        ✓ Custom profile pictures • ✓ 5MB file size limit • ✓ Multiple formats supported
                      </div>
                      <button
                        data-upgrade-plan
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-4 py-3 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 text-sm touch-friendly min-h-[44px] w-full sm:w-auto"
                      >
                        Upgrade to Upload Pictures
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Basic Information Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Basic Information</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={settings.displayName || ''}
                    onChange={(e) => updateSetting('displayName', e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base touch-friendly min-h-[44px] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={settings.email || ''}
                      onChange={(e) => updateSetting('email', e.target.value)}
                      disabled={user.providerData.some(provider => provider.providerId === 'google.com')}
                      placeholder="Enter your email address"
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base touch-friendly min-h-[44px] transition-colors ${
                        user.providerData.some(provider => provider.providerId === 'google.com')
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : ''
                      }`}
                    />
                    {user.providerData.some(provider => provider.providerId === 'google.com') && (
                      <div className="flex items-center mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Info className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-blue-700">
                          Email cannot be changed for Google accounts
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Password Change Section - Only for email/password users */}
            {!isGoogleUser && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Change Password</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base touch-friendly min-h-[44px] transition-colors"
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base touch-friendly min-h-[44px] transition-colors"
                      placeholder="Enter your new password"
                    />
                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Password must be at least 8 characters with uppercase, lowercase, number, and special character
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base touch-friendly min-h-[44px] transition-colors"
                      placeholder="Confirm your new password"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium touch-friendly min-h-[44px]"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {changingPassword ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Account Management Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Account Management</h4>

              <div className="space-y-4">
                {/* Cancel Plan Button - Only show if user has an active subscription and section not hidden */}
                {featureAccess?.currentPlan &&
                 featureAccess.currentPlan !== 'free' &&
                 subscription?.status === 'active' &&
                 !cancelSectionHidden && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center sm:items-start">
                        <CreditCard className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0 mr-3 sm:mr-0" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">
                          Cancel Subscription
                        </h5>
                        <p className="text-sm text-yellow-700 mb-4 leading-relaxed">
                          Cancel your {featureAccess.currentPlan.replace('-', ' ')} plan and return to the free plan. This will immediately cancel your subscription in both our system and Stripe.
                        </p>
                        <CancelSubscriptionButton
                          className="w-full sm:w-auto"
                          onCancellationComplete={() => {
                            setCancelSectionHidden(true);
                            refreshSubscriptionStatus();
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Account Section */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center sm:items-start">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0 mr-3 sm:mr-0" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-base sm:text-lg font-semibold text-red-800 mb-2">
                        Delete Account
                      </h5>
                      <p className="text-sm text-red-700 mb-4 leading-relaxed">
                        Permanently delete your account and all associated data. This action cannot be undone. Any active subscription will be automatically canceled.
                      </p>
                      <button
                        onClick={() => setShowDeleteAccountModal(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium touch-friendly min-h-[44px]"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'personal':
        const personalProfile: PersonalProfile = settings?.personalProfile || {
          ...DEFAULT_PERSONAL_PROFILE,
          activityLevel: 'moderately_active',
          heightUnit: 'cm',
          weightUnit: 'kg',
          allergies: [],
          medicalConditions: [],
          medications: [],
          cookingSkillLevel: 'intermediate',
          timeAvailableForCooking: '30_60_min',
          budgetPreference: 'moderate',
          healthGoals: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const handleUpdatePersonalProfile = (updatedProfile: PersonalProfile) => {
          updateSetting('personalProfile', updatedProfile);
        };

        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Personal Profile & Health Goals</h3>
              <p className="text-gray-600">
                Set up your personal profile and health goals to get AI-powered recipe recommendations tailored specifically to your needs and objectives.
              </p>
            </div>

            {/* Personal Profile Editor */}
            <PersonalProfileEditor
              personalProfile={personalProfile}
              onUpdateProfile={handleUpdatePersonalProfile}
              disabled={saving}
              preferredUnits={settings?.preferredUnits || 'metric'}
            />

            {/* Health Goals Manager */}
            {featureAccess?.canUseHealthGoals ? (
              <HealthGoalsManager
                personalProfile={personalProfile}
                onUpdateProfile={handleUpdatePersonalProfile}
                disabled={saving}
                preferredUnits={settings?.preferredUnits || 'metric'}
                userId={user.uid}
              />
            ) : (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start">
                  <div className="bg-amber-100 rounded-full p-3 mr-4 flex-shrink-0">
                    <Crown className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-amber-900 mb-2 flex items-center">
                      Health Goals
                      <span className="ml-2 bg-amber-200 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">
                        CHEF PLAN+
                      </span>
                    </h4>
                    <p className="text-amber-800 mb-4">
                      Set personalized health goals like weight management, calorie targets, and nutritional objectives.
                      Track your progress and get AI-powered recipe recommendations tailored to your health journey.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          if ((window as any).showUpgradeModal) {
                            (window as any).showUpgradeModal('chef', 'health-goals');
                          }
                        }}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center font-medium"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Plan
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Personalization Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                AI Personalization
              </h4>
              <div className="text-blue-800 space-y-2">
                <p className="text-sm">
                  Your personal profile and health goals are used to:
                </p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Adjust recipe calorie content and portions for your goals</li>
                  <li>• Recommend ingredients that support your health objectives</li>
                  <li>• Suggest cooking times and complexity based on your availability</li>
                  <li>• Avoid ingredients you're allergic to or cannot consume</li>
                  <li>• Customize meal plans for your activity level and lifestyle</li>
                </ul>
                <p className="text-sm mt-3 font-medium">
                  The more complete your profile, the better our AI can personalize your recipes!
                </p>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        // Show all dietary options but mark locked ones for Chef users
        const availableFilters = featureAccess?.availableDietaryFilters || [];
        const currentPlan = featureAccess?.currentPlan || 'free';
        
        // Add isLocked property to each dietary option
        const dietaryOptionsWithLockStatus = dietaryOptions.map(opt => ({
          ...opt,
          isLocked: !availableFilters.includes(opt.name),
          isUpgradeNeeded: currentPlan === 'chef' && !availableFilters.includes(opt.name)
        }));
        
        const categorizedDietaryOptions = {
          'plant-based': dietaryOptionsWithLockStatus.filter(opt => opt.category === 'plant-based'),
          'allergen-free': dietaryOptionsWithLockStatus.filter(opt => opt.category === 'allergen-free'),
          'low-carb': dietaryOptionsWithLockStatus.filter(opt => opt.category === 'low-carb'),
          'fitness': dietaryOptionsWithLockStatus.filter(opt => opt.category === 'fitness'),
          'whole-foods': dietaryOptionsWithLockStatus.filter(opt => opt.category === 'whole-foods'),
          'health': dietaryOptionsWithLockStatus.filter(opt => opt.category === 'health'),
          'regional': dietaryOptionsWithLockStatus.filter(opt => opt.category === 'regional'),
          'religious': dietaryOptionsWithLockStatus.filter(opt => opt.category === 'religious')
        };

        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dietary Filters</h3>
              <p className="text-gray-600 leading-relaxed">
                Customize your recipe experience with dietary filters that match your lifestyle. Set preferences to automatically show recipes that fit your nutritional needs and food choices.
              </p>
            </div>

            {featureAccess?.canSetDefaultPreferences ? (
              <div className="space-y-8">
                {/* Dietary Preferences Section */}
                <div>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                    Select dietary preferences to automatically filter recipes. These will be applied to all recipe searches and suggestions.
                  </p>
                  
                  <div className="space-y-4 sm:space-y-6">
                    {Object.entries(categorizedDietaryOptions).map(([category, options]) => (
                      <div key={category} className="space-y-3 sm:space-y-4">
                        <h5 className="text-sm sm:text-base font-medium text-gray-800 capitalize border-b border-gray-200 pb-2">
                          {category === 'plant-based' && '🌱 Plant-Based Diets'}
                          {category === 'allergen-free' && '⚠️ Allergen-Free Options'}
                          {category === 'low-carb' && '🥩 Low-Carb Diets'}
                          {category === 'fitness' && '💪 Fitness-Focused'}
                          {category === 'whole-foods' && '🍎 Whole Foods'}
                          {category === 'health' && '🩺 Health-Focused'}
                          {category === 'regional' && '🌍 Regional Cuisines'}
                          {category === 'religious' && '🕊️ Religious Requirements'}
                        </h5>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                          {options.map((option) => {
                            const isSelected = settings.defaultDietaryFilters.includes(option.name);
                            const isLocked = option.isLocked;
                            const isUpgradeNeeded = option.isUpgradeNeeded;
                            
                            return (
                              <label
                                key={option.name}
                                className={`relative flex items-start p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 touch-friendly ${
                                  isLocked 
                                    ? 'cursor-pointer opacity-60 bg-gray-50 border-gray-200 border-dashed hover:bg-gray-100'
                                    : isSelected 
                                    ? 'border-green-500 bg-green-50 shadow-md cursor-pointer' 
                                    : `${option.color} border-dashed cursor-pointer hover:shadow-sm`
                                }`}
                                onClick={isLocked && isUpgradeNeeded ? () => {
                                  showError(
                                    'Premium Feature Required', 
                                    `${option.name} dietary filtering is available with Master Chef+ plan. Upgrade to access all advanced dietary preferences.`, 
                                    'dietary-preference'
                                  );
                                } : undefined}
                              >
                                <div className="flex items-center h-5">
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={isLocked}
                                      onChange={(e) => {
                                        if (isLocked) return;
                                        const filters = e.target.checked
                                          ? [...settings.defaultDietaryFilters, option.name]
                                          : settings.defaultDietaryFilters.filter(f => f !== option.name);
                                        updateSetting('defaultDietaryFilters', filters);
                                      }}
                                      className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                                      isLocked
                                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                                        : isSelected 
                                        ? 'bg-green-500 border-green-500 shadow-md cursor-pointer' 
                                        : 'bg-white border-gray-300 hover:border-green-400 cursor-pointer'
                                    }`}>
                                      {isLocked ? (
                                        <Lock className="w-3 h-3 text-gray-400" />
                                      ) : isSelected ? (
                                        <Check className="w-3 h-3 text-white stroke-[3]" />
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center mb-1 flex-wrap gap-2">
                                    <span className={`text-base sm:text-lg mr-2 ${isLocked ? 'grayscale' : ''} flex-shrink-0`}>{option.icon}</span>
                                    <span className={`font-medium text-sm sm:text-base ${isLocked ? 'text-gray-500' : 'text-gray-900'} flex-1`}>{option.name}</span>
                                    {isUpgradeNeeded && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex-shrink-0">
                                        Master Chef+
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-xs sm:text-sm leading-relaxed ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {option.description}
                                  </p>
                                </div>
                                {!isLocked && isSelected && (
                                  <div className="absolute top-2 right-2">
                                    <Check className="w-5 h-5 text-green-600" />
                                  </div>
                                )}
                                {isLocked && (
                                  <div className="absolute top-2 right-2">
                                    <Lock className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected Filters Summary */}
                  {settings.defaultDietaryFilters && settings.defaultDietaryFilters.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 mt-6">
                      <div className="flex items-center mb-3">
                        <Check className="w-5 h-5 text-green-600 mr-2" />
                        <h5 className="font-semibold text-green-900">Active Default Filters</h5>
                      </div>
                      <p className="text-green-800 text-sm mb-4">
                        These {settings.defaultDietaryFilters.length} filters will be automatically applied to all recipe searches:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {settings.defaultDietaryFilters.map((filter) => {
                          const filterData = dietaryOptionsWithLockStatus.find(opt => opt.name === filter);
                          return (
                            <span
                              key={filter}
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-green-200 text-green-800 shadow-sm"
                            >
                              <span className="mr-1">{filterData?.icon}</span>
                              {filter}
                              <button
                                onClick={() => {
                                  const newFilters = settings.defaultDietaryFilters.filter(f => f !== filter);
                                  updateSetting('defaultDietaryFilters', newFilters);
                                }}
                                className="ml-1.5 text-green-600 hover:text-green-800"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                  <h4 className="text-xl font-bold text-orange-800 mb-2">
                    Premium Dietary Filters
                  </h4>
                  <p className="text-orange-700 mb-6 max-w-md mx-auto leading-relaxed">
                    Unlock advanced dietary filters and personalized preferences with any paid plan. Automatically filter recipes based on your dietary requirements.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-lg mx-auto">
                  <div className="bg-white/50 rounded-lg p-4 text-left">
                    <div className="text-orange-600 font-semibold mb-2">🎯 Smart Filtering</div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>✓ Auto-apply dietary filters</li>
                      <li>✓ Advanced allergen-free options</li>
                      <li>✓ Medical condition support</li>
                      <li>✓ Religious dietary requirements</li>
                    </ul>
                  </div>
                  <div className="bg-white/50 rounded-lg p-4 text-left">
                    <div className="text-orange-600 font-semibold mb-2">⚡ Personalization</div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>✓ Skip repetitive filtering</li>
                      <li>✓ Instant diet matching</li>
                      <li>✓ Consistent preferences</li>
                      <li>✓ Tailored suggestions</li>
                    </ul>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    if ((window as any).showUpgradeModal) {
                      (window as any).showUpgradeModal('chef', 'recipe-settings');
                    }
                  }}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg"
                >
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>
        );

      case 'notifications':
        // Helper function to check if any marketing email setting is enabled
        const hasAnyMarketingEmails = settings.marketingEmails || settings.productUpdates || settings.featuresAnnouncements || settings.promotionalOffers;
        
        // Helper function to toggle all marketing emails
        const handleMarketingEmailsToggle = (enabled: boolean) => {
          updateSetting('marketingEmails', enabled);
          updateSetting('productUpdates', enabled);
          updateSetting('featuresAnnouncements', enabled);
          updateSetting('promotionalOffers', enabled);
        };
        
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Notifications</h3>
              <p className="text-gray-600 leading-relaxed">
                Control how and when you receive updates from Recipe Revamped. Customize email preferences, push notifications, and marketing communications to suit your needs.
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Main notification toggles on the same level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Toggle
                  enabled={settings.emailNotifications}
                  onChange={(enabled) => updateSetting('emailNotifications', enabled)}
                  label="Email Notifications"
                  description="Receive updates and informations"
                  size="md"
                />
                
                <Toggle
                  enabled={hasAnyMarketingEmails}
                  onChange={handleMarketingEmailsToggle}
                  label="Marketing Emails"
                  description="Toggle all marketing communications"
                  size="md"
                />
              </div>
              
              {/* Marketing emails group - only show when marketing emails is enabled */}
              {hasAnyMarketingEmails && (
                <div className="pl-6 border-l-2 border-green-200 bg-green-50 rounded-lg p-4 space-y-4">
                  <p className="text-sm font-semibold text-green-800 mb-4">Marketing Email Types</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Toggle
                      enabled={settings.marketingEmails}
                      onChange={(enabled) => updateSetting('marketingEmails', enabled)}
                      label="General Marketing"
                      description="Newsletters and general communications"
                      size="sm"
                    />
                    
                    <Toggle
                      enabled={settings.productUpdates}
                      onChange={(enabled) => updateSetting('productUpdates', enabled)}
                      label="Product Updates"
                      description="New features and improvements"
                      size="sm"
                    />
                    
                    <Toggle
                      enabled={settings.featuresAnnouncements}
                      onChange={(enabled) => updateSetting('featuresAnnouncements', enabled)}
                      label="Feature Announcements"
                      description="New tools and capabilities"
                      size="sm"
                    />
                    
                    <Toggle
                      enabled={settings.promotionalOffers}
                      onChange={(enabled) => updateSetting('promotionalOffers', enabled)}
                      label="Promotional Offers"
                      description="Special deals and discounts"
                      size="sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'recipe-settings':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Recipe Settings</h3>
              <p className="text-gray-600 leading-relaxed">
                Configure your recipe conversion preferences and cooking defaults. Set up auto-save, serving sizes, and measurement units to streamline your cooking experience.
              </p>
            </div>

            {featureAccess?.canSetDefaultPreferences ? (
              <div className="space-y-6">
                {/* Auto-save Recipes */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <Save className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Auto-save Recipes</h4>
                        <p className="text-sm text-gray-600">Automatically save recipes as you work</p>
                      </div>
                    </div>
                    <Toggle
                      enabled={settings.autoSaveRecipes}
                      onChange={(enabled) => updateSetting('autoSaveRecipes', enabled)}
                      label=""
                      description=""
                      size="lg"
                    />
                  </div>
                </div>

                {/* Recipe Conversion Defaults */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <Bot className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Recipe Conversion Defaults</h4>
                      <p className="text-sm text-gray-600">Set your preferred recipe generation settings</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Default Serving Size */}
                    <div className="bg-white rounded-lg p-5 border border-green-100">
                      <div className="flex items-center mb-4">
                        <span className="text-2xl mr-3">🍽️</span>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800">Default Serving Size</label>
                          <p className="text-xs text-gray-500">How many people to cook for by default</p>
                        </div>
                      </div>

                      {/* Quick Selection Buttons */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {[1, 2, 4, 6, 8].map((size) => (
                          <button
                            key={size}
                            onClick={() => updateSetting('defaultServingSize', size)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              settings.defaultServingSize === size
                                ? 'bg-green-500 text-white shadow-md transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                            }`}
                          >
                            {size} {size === 1 ? 'person' : 'people'}
                          </button>
                        ))}
                      </div>

                      {/* Custom Input */}
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-600">Custom size:</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={settings.defaultServingSize}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              const servingSize = isNaN(value) || value < 1 ? 1 : value;
                              updateSetting('defaultServingSize', servingSize);
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-lg font-medium text-center"
                            placeholder="Enter custom size"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <span className="text-gray-400 text-sm font-medium">
                              {settings.defaultServingSize === 1 ? 'person' : 'people'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          Range: 1-20 people
                        </p>
                      </div>
                    </div>

                    {/* Preferred Units */}
                    <div className="bg-white rounded-lg p-5 border border-green-100">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-3">📏</span>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800">Measurement Units</label>
                          <p className="text-xs text-gray-500">Your preferred measurement system</p>
                        </div>
                      </div>
                      <select
                        value={settings.preferredUnits}
                        onChange={(e) => updateSetting('preferredUnits', e.target.value as 'metric' | 'imperial')}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-base font-medium"
                      >
                        <option value="metric">🌍 Metric (grams, ml, °C)</option>
                        <option value="imperial">🦅 Imperial (cups, oz, °F)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                    <Bot className="h-8 w-8 text-orange-600" />
                  </div>
                  <h4 className="text-xl font-bold text-orange-800 mb-2">
                    Premium Recipe Settings
                  </h4>
                  <p className="text-orange-700 leading-relaxed mb-6">
                    Access advanced recipe management and conversion defaults with a premium subscription.
                    Customize your cooking experience with auto-save, preferred units, and default serving sizes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-lg mx-auto">
                  <div className="bg-white/50 rounded-lg p-4 text-left">
                    <div className="text-orange-600 font-semibold mb-2">🤖 Smart Defaults</div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>✓ Recipe conversion defaults</li>
                      <li>✓ Auto-save recipes</li>
                      <li>✓ Preferred measurement units</li>
                    </ul>
                  </div>
                  <div className="bg-white/50 rounded-lg p-4 text-left">
                    <div className="text-orange-600 font-semibold mb-2">⚡ Personalization</div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>✓ Default serving sizes</li>
                      <li>✓ Skip repetitive settings</li>
                      <li>✓ Consistent preferences</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if ((window as any).showUpgradeModal) {
                      (window as any).showUpgradeModal('chef', 'recipe-settings');
                    }
                  }}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg"
                >
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>
        );

      case 'health':
        const healthConditions = [
          {
            name: 'Diabetes',
            description: 'Low sugar, controlled carbs',
            icon: '🩺',
            category: 'metabolic'
          },
          {
            name: 'High blood pressure (Hypertension)',
            description: 'Low sodium, heart-healthy',
            icon: '❤️',
            category: 'cardiovascular'
          },
          {
            name: 'High cholesterol',
            description: 'Low saturated fat, fiber-rich',
            icon: '🫀',
            category: 'cardiovascular'
          },
          {
            name: 'Celiac (Gluten-free)',
            description: 'Strictly gluten-free options',
            icon: '🌾',
            category: 'digestive'
          },
          {
            name: 'Lactose intolerance',
            description: 'Dairy-free alternatives',
            icon: '🥛',
            category: 'digestive'
          },
          {
            name: 'Chronic kidney disease',
            description: 'Low protein, phosphorus control',
            icon: '🩺',
            category: 'metabolic'
          },
          {
            name: 'Gout (Low purine)',
            description: 'Avoid high-purine foods',
            icon: '🦴',
            category: 'metabolic'
          },
          {
            name: 'IBS (Low FODMAP)',
            description: 'Gentle on digestive system',
            icon: '🌿',
            category: 'digestive'
          },
          {
            name: 'PCOS / insulin sensitive',
            description: 'Low glycemic, hormone-friendly',
            icon: '⚖️',
            category: 'hormonal'
          },
          {
            name: 'Weight management',
            description: 'Balanced macros, portion control',
            icon: '🎯',
            category: 'lifestyle'
          },
          {
            name: 'Inflammatory conditions',
            description: 'Anti-inflammatory, omega-3 rich',
            icon: '🔥',
            category: 'metabolic'
          },
          {
            name: 'Fatty liver disease',
            description: 'Low fat, liver-friendly nutrients',
            icon: '🫘',
            category: 'metabolic'
          },
          {
            name: 'Osteoporosis',
            description: 'High calcium, vitamin D rich',
            icon: '🦴',
            category: 'metabolic'
          },
          {
            name: 'Thyroid disorders',
            description: 'Iodine balance, metabolism support',
            icon: '🦋',
            category: 'hormonal'
          },
          {
            name: 'Anemia',
            description: 'Iron-rich, vitamin B12 foods',
            icon: '🩸',
            category: 'metabolic'
          },
          {
            name: 'Gastritis / Acid reflux',
            description: 'Low acid, stomach-soothing',
            icon: '🫗',
            category: 'digestive'
          },
          {
            name: 'Food allergies',
            description: 'Allergen-free alternatives',
            icon: '⚠️',
            category: 'digestive'
          }
        ];

        const categoryColors = {
          'metabolic': 'bg-purple-50 border-purple-200 hover:bg-purple-100',
          'cardiovascular': 'bg-red-50 border-red-200 hover:bg-red-100',
          'digestive': 'bg-green-50 border-green-200 hover:bg-green-100',
          'hormonal': 'bg-pink-50 border-pink-200 hover:bg-pink-100',
          'lifestyle': 'bg-blue-50 border-blue-200 hover:bg-blue-100'
        };

        const categorizedConditions = {
          'metabolic': healthConditions.filter(c => c.category === 'metabolic'),
          'cardiovascular': healthConditions.filter(c => c.category === 'cardiovascular'),
          'digestive': healthConditions.filter(c => c.category === 'digestive'),
          'hormonal': healthConditions.filter(c => c.category === 'hormonal'),
          'lifestyle': healthConditions.filter(c => c.category === 'lifestyle')
        };

        const canAccessHealthConditions = featureAccess?.canUseHealthConditions || false;

        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Health Conditions & Dietary Needs</h3>
              <p className="text-gray-600 leading-relaxed">
                Tell us about your health conditions so we can suggest recipes that support your specific dietary requirements and wellness goals.
              </p>
            </div>
            
            {!canAccessHealthConditions && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                    <Heart className="h-8 w-8 text-orange-600" />
                  </div>
                  <h4 className="text-xl font-bold text-orange-800 mb-2">
                    Premium Health Features
                  </h4>
                  <p className="text-orange-700 mb-6 max-w-md mx-auto leading-relaxed">
                    Unlock personalized health condition tracking and dietary recommendations with Chef plan or higher. Get recipes tailored to your specific health needs.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-lg mx-auto">
                  <div className="bg-white/50 rounded-lg p-4 text-left">
                    <div className="text-orange-600 font-semibold mb-2">🏥 Health Tracking</div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>✓ Diabetes management</li>
                      <li>✓ Heart health support</li>
                      <li>✓ Digestive conditions</li>
                    </ul>
                  </div>
                  <div className="bg-white/50 rounded-lg p-4 text-left">
                    <div className="text-orange-600 font-semibold mb-2">🎯 Smart Recipes</div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>✓ Condition-specific suggestions</li>
                      <li>✓ Nutritional guidance</li>
                      <li>✓ Safe ingredient alternatives</li>
                    </ul>
                  </div>
                </div>
                
                <button
                  data-upgrade-plan
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg"
                >
                  Upgrade to Access Health Features
                </button>
              </div>
            )}

            {canAccessHealthConditions && (
              <div className="space-y-6">
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                  Select health conditions to get personalized recipe recommendations. These will help us suggest recipes that support your specific dietary requirements and wellness goals.
                </p>

                {Object.entries(categorizedConditions).map(([category, conditions]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-lg font-semibold text-gray-800 capitalize border-b pb-2">
                    {category === 'metabolic' && '🧬 Metabolic Conditions'}
                    {category === 'cardiovascular' && '💗 Heart Health'}
                    {category === 'digestive' && '🌱 Digestive Health'}
                    {category === 'hormonal' && '⚖️ Hormonal Health'}
                    {category === 'lifestyle' && '🎯 Lifestyle Goals'}
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {conditions.map((condition) => {
                      const isSelected = settings.healthConditions?.includes(condition.name) || false;
                      return (
                        <label
                          key={condition.name}
                          className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'border-green-500 bg-green-50 shadow-md' 
                              : `${categoryColors[condition.category]} border-dashed`
                          }`}
                        >
                          <div className="flex items-center h-5">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const currentConditions = settings.healthConditions || [];
                                  const newConditions = e.target.checked
                                    ? [...currentConditions, condition.name]
                                    : currentConditions.filter(c => c !== condition.name);
                                  updateSetting('healthConditions', newConditions);
                                }}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                                isSelected 
                                  ? 'bg-green-500 border-green-500 shadow-md' 
                                  : 'bg-white border-gray-300 hover:border-green-400'
                              }`}>
                                {isSelected && (
                                  <Check className="w-3 h-3 text-white stroke-[3]" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center mb-1">
                              <span className="text-lg mr-2">{condition.icon}</span>
                              <span className="font-medium text-gray-900">{condition.name}</span>
                            </div>
                            <p className="text-sm text-gray-600">{condition.description}</p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <Check className="w-5 h-5 text-green-600" />
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {settings.healthConditions && settings.healthConditions.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <Shield className="w-5 h-5 text-green-600 mr-2" />
                    <h4 className="font-semibold text-green-900">Your Health Profile</h4>
                  </div>
                  <p className="text-green-800 text-sm mb-4">
                    We'll prioritize recipes that align with these {settings.healthConditions.length} health considerations:
                  </p>
                  <div className="flex flex-wrap gap-2">
                      {settings.healthConditions.map((condition) => {
                        const conditionData = healthConditions.find(c => c.name === condition);
                        return (
                          <span
                            key={condition}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-green-200 text-green-800 shadow-sm"
                          >
                            <span className="mr-1">{conditionData?.icon}</span>
                            {condition}
                            <button
                              onClick={() => {
                                const newConditions = settings.healthConditions?.filter(c => c !== condition) || [];
                                updateSetting('healthConditions', newConditions);
                              }}
                              className="ml-1.5 text-green-600 hover:text-green-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        );

      case 'data':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Data & Backup</h3>
              <p className="text-gray-600 leading-relaxed">
                Protect your recipes and cooking data with secure cloud backups. Restore your collection anytime and keep your culinary creations safe.
              </p>
            </div>
            
            {/* Backup features restricted to paid plans */}
            {featureAccess?.canBackupRestore ? (
              <>
                {/* Manual Backup & Recovery */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-gray-900">Backup & Recovery</h4>
                    <div className="text-sm">
                      {(() => {
                        const currentPlan = featureAccess?.currentPlan || 'free';
                        const { limit, planName } = getBackupLimits(currentPlan);
                        const isAtLimit = backups.length >= limit;
                        return (
                          <span className={isAtLimit ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
                            {backups.length}/{limit} backups ({planName})
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Recipe count indicator */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Recipes in your collection:</span>
                      <span className="font-semibold text-gray-900">{recipeCount} recipes</span>
                    </div>
                    {recipeCount === 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        You need at least 1 recipe to create a backup
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleCreateBackup}
                      disabled={backupLoading || recipeCount === 0 || (() => {
                        const currentPlan = featureAccess?.currentPlan || 'free';
                        const { limit } = getBackupLimits(currentPlan);
                        return backups.length >= limit;
                      })()}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {backupLoading ? 'Creating Backup...' : 'Create Manual Backup'}
                    </button>
                    
                    {/* Show backup limit warning */}
                    {(() => {
                      const currentPlan = featureAccess?.currentPlan || 'free';
                      const { limit, planName } = getBackupLimits(currentPlan);
                      const isAtLimit = backups.length >= limit;
                      
                      if (isAtLimit) {
                        return (
                          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800">
                              <strong>Backup limit reached!</strong> Your {planName} plan allows {limit} backups. 
                              Delete existing backups to create new ones.
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  
                  {/* Available Backups Section - Always Visible */}
                  <div className="mt-6 border-t pt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Available Backups (90-day retention)
                    </h4>
                  
                  {backups.length === 0 ? (
                    <p className="text-sm text-gray-500">No backups available</p>
                  ) : (
                    <div className="space-y-2">
                      {backups.map((backup) => (
                        <div key={backup.id} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div>
                            <p className="text-sm font-medium">
                              {backup.createdAt?.toLocaleDateString()} at {backup.createdAt?.toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {backup.recipes?.length || 0} recipes • Expires: {backup.expiresAt?.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRestoreClick(backup)}
                              disabled={restoringBackup === backup.id}
                              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                restoringBackup === backup.id
                                  ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-1'
                              }`}
                            >
                              {restoringBackup === backup.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent mr-2"></div>
                                  Restoring...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Restore
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteClick(backup)}
                              disabled={restoringBackup === backup.id}
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                    <Database className="h-8 w-8 text-orange-600" />
                  </div>
                  <h4 className="text-xl font-bold text-orange-800 mb-2">
                    Backup & Recovery - Paid Plan Required
                  </h4>
                  <p className="text-orange-700 leading-relaxed mb-6">
                    Protect your recipes with cloud backup and recovery features. Available with any paid plan.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-lg mx-auto">
                  <div className="bg-white/50 rounded-lg p-4 text-left">
                    <div className="text-orange-600 font-semibold mb-2">🔄 Backup Features</div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>✓ Automatic cloud backups</li>
                      <li>✓ Manual backup creation</li>
                      <li>✓ Recipe recovery tools</li>
                    </ul>
                  </div>
                  <div className="bg-white/50 rounded-lg p-4 text-left">
                    <div className="text-orange-600 font-semibold mb-2">🛡️ Protection</div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>✓ 90-day retention policy</li>
                      <li>✓ Cross-device sync</li>
                      <li>✓ Secure cloud storage</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if ((window as any).showUpgradeModal) {
                      (window as any).showUpgradeModal('master-chef', 'backup-recovery');
                    }
                  }}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg"
                >
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>
        );

      case 'admin':
      case 'admin-users':
      case 'admin-notifications':
      case 'admin-marketing':
      case 'admin-blog':
        if (!isUserAdmin) {
          return (
            <div className="text-center text-gray-500">
              <p>Access denied. Admin privileges required.</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            {/* Admin Section Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveSection('admin-users')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    (activeSection === 'admin' || activeSection === 'admin-users')
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  User Management
                </button>
                <button
                  onClick={() => setActiveSection('admin-notifications')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeSection === 'admin-notifications'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setActiveSection('admin-marketing')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeSection === 'admin-marketing'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Marketing Emails
                </button>
                <button
                  onClick={() => setActiveSection('admin-blog')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeSection === 'admin-blog'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Blog Management
                </button>
              </nav>
            </div>

            {/* Admin Content */}
            <div className="mt-6">
              {activeSection === 'admin-notifications' ? (
                <AdminNotificationCreator
                  key="admin-notifications"
                  adminUserId={user.uid}
                  adminEmail={user.email || ''}
                />
              ) : activeSection === 'admin-marketing' ? (
                <MarketingEmailCampaign key="admin-marketing" />
              ) : activeSection === 'admin-blog' ? (
                <AdminBlogManagement
                  key="admin-blog"
                  adminUserId={user.uid}
                  adminEmail={user.email || ''}
                />
              ) : (
                <AdminUserManagement
                  key="admin-users"
                  currentAdminUid={user.uid}
                  currentAdminEmail={user.email || ''}
                />
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-3 sm:mr-4 p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-friendly"
              >
                <span className="text-xl sm:text-2xl font-bold">←</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Settings</h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              {saveStatus === 'saved' && (
                <div className="flex items-center text-green-600">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm hidden sm:inline">Saved!</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center text-red-600">
                  <X className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm hidden sm:inline">Failed to save</span>
                </div>
              )}
              
              {!activeSection.startsWith('admin') && (
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium shadow-sm touch-friendly min-h-[40px]"
                >
                  <Save className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
                  <span className="sm:hidden truncate">{saving ? 'Saving' : 'Save'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Mobile Navigation Tabs */}
          <div className="lg:hidden">
            <div className="flex overflow-x-auto pb-3 -mx-4 px-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              <div className="flex space-x-3 min-w-max">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id || (section.id === 'admin' && (activeSection === 'admin-users' || activeSection === 'admin-notifications' || activeSection === 'admin-marketing' || activeSection === 'admin-blog'));
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap touch-friendly min-h-[44px] shadow-sm ${
                        isActive
                          ? 'bg-green-600 text-white shadow-md transform scale-105'
                          : 'text-gray-700 hover:bg-gray-100 border border-gray-200 bg-white hover:shadow-md'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeSection === section.id || (section.id === 'admin' && (activeSection === 'admin-users' || activeSection === 'admin-notifications' || activeSection === 'admin-marketing' || activeSection === 'admin-blog'))
                        ? 'bg-green-50 text-green-700 border-r-2 border-green-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {section.label}
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
              <div className="space-y-6 lg:space-y-8">
                {renderSectionContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBackupToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Recovery Point"
        message={
          backupToDelete 
            ? `Are you sure you want to permanently delete the recovery point from ${backupToDelete.createdAt?.toLocaleDateString()} at ${backupToDelete.createdAt?.toLocaleTimeString()}? This action cannot be undone and you will lose ${backupToDelete.recipes?.length || 0} backed up recipes.`
            : "Are you sure you want to delete this recovery point?"
        }
        confirmText="Delete Forever"
        cancelText="Keep Recovery Point"
        isDestructive={true}
      />

      {/* Restore Confirmation Modal */}
      <RestoreConfirmationModal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setBackupToRestore(null);
        }}
        onConfirm={handleRestoreConfirm}
        backup={backupToRestore}
      />


      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              Choose how you want to handle your account. Both options will automatically cancel any active subscription.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Deactivate Account</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Temporarily disable your account. You can reactivate it by logging in again. All your data will be preserved.
                </p>
                <button
                  onClick={() => handleDeleteAccount('deactivate')}
                  disabled={deletingAccount}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {deletingAccount ? 'Deactivating...' : 'Deactivate Account'}
                </button>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Permanently Delete</h4>
                <p className="text-sm text-red-700 mb-3">
                  Permanently delete your account and all data. This action cannot be undone and all data will be lost.
                </p>
                <button
                  onClick={() => handleDeleteAccount('delete')}
                  disabled={deletingAccount}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {deletingAccount ? 'Deleting Account...' : 'Delete Account & All Data'}
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setShowDeleteAccountModal(false)}
              disabled={deletingAccount}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};