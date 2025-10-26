import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type User, updateProfile, deleteUser, updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut, getAuth } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SubscriptionService } from '../lib/subscriptionService';
import { SubscriptionCancellationService } from '../lib/subscriptionCancellationService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
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
  ArrowRight,
  Mail,
  FileText
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
import { logger } from '../lib/logger';
import { getUserInitials } from '../utils/profileUtils';

interface SettingsProps {
  user: User;
  onBack: () => void;
  onSettingsUpdate?: (settings: UserSettings) => void;
  onShowUpgradeModal?: () => void;
  initialActiveSection?: string;
  onSectionChange?: (sectionId: string) => void;
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

export const Settings: React.FC<SettingsProps> = ({ user, onBack, onSettingsUpdate, onShowUpgradeModal, initialActiveSection, onSectionChange, featureAccess }) => {
  // Authentication guard - Settings should only be accessible when user is logged in
  if (!user) {
    logger.warn('Settings accessed without authenticated user - redirecting');
    onBack();
    return null;
  }

  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(initialActiveSection || 'profile');

  // Helper function to change section and notify parent for URL routing
  const changeSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (onSectionChange) {
      onSectionChange(sectionId);
    }
  };

  // Debug logging and handle prop changes
  useEffect(() => {
    if (initialActiveSection) {
      logger.debug('Settings received initialActiveSection:', { initialActiveSection });
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
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
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
  const [preventAnimations, setPreventAnimations] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();

  // Lock body scroll when delete account modal is open
  useBodyScrollLock(showDeleteAccountModal);
  
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
        // Using static imports now

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
        logger.error('Error setting up settings listener:', { error });
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

  // Update currentProfilePicture when settings changes
  useEffect(() => {
    // Show custom uploaded picture if available, otherwise null (which shows anagram)
    if (settings?.profilePictureUrl) {
      setCurrentProfilePicture(settings.profilePictureUrl);
    } else {
      // No custom picture - show anagram initials
      setCurrentProfilePicture(null);
    }
  }, [settings?.profilePictureUrl]);

  // Auto-set admin tab when entering admin mode and load backups when data section opens
  useEffect(() => {
    if (activeSection === 'admin') {
      changeSection('admin-users');
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
      logger.error('Error initializing admin system:', { error });
    }
  };

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await getUserSettings(user.uid);
      setSettings(userSettings);
    } catch (error) {
      logger.error('Failed to load user settings:', { error });
    } finally {
      setLoading(false);
    }
  };

  const loadRecipeCount = async () => {
    try {
      const recipes = await getUserRecipes(user.uid, 1000); // Get all recipes to count
      setRecipeCount(recipes.length);
    } catch (error) {
      logger.error('Failed to load recipe count:', { error });
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
      // Using static imports now

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
            logger.warn('⚠️ Could not automatically cancel subscription:', { error: cancellationResult.error });
          }
        } catch (error) {
          logger.warn('⚠️ Could not cancel subscription during account action:', { error });
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
          Promise.resolve().then(() => {
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
      logger.error('Failed to delete/deactivate account:', { error });
      
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
      // Using static imports now
      
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
      logger.error('Password change error:', { error });
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
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      logger.error('Failed to save settings:', { error });
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
    setHasUnsavedChanges(true);
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
      logger.error('Failed to create backup:', { error });
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
      logger.error('Failed to load backups:', { error });
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
      logger.error('Failed to restore backup:', { error });
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
      logger.error('Failed to delete backup:', { error });
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
      setPreventAnimations(true); // Prevent animations during profile picture update

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

      // Update local settings and profile picture state
      const updatedSettings = settings ? { ...settings, profilePictureUrl: photoURL } : null;
      if (updatedSettings) {
        setSettings(updatedSettings);
        setCurrentProfilePicture(photoURL);

        // Notify parent component to update UserAccountDropdown
        if (onSettingsUpdate) {
          onSettingsUpdate(updatedSettings);
        }
      }

      showSuccess('Profile Picture Updated', 'Your profile picture has been successfully changed');
    } catch (error) {
      logger.error('Failed to upload profile picture:', { error });
      showError('Upload Failed', 'Could not upload profile picture. Please try again.');
    } finally {
      setUploadingProfilePicture(false);
      // Re-enable animations after a short delay
      setTimeout(() => setPreventAnimations(false), 100);
    }
  };

  const handleProfilePictureDelete = async () => {
    try {
      setUploadingProfilePicture(true);
      setPreventAnimations(true); // Prevent animations during profile picture removal

      // Update UI immediately to show anagram (before async delete completes)
      const updatedSettings = settings ? { ...settings, profilePictureUrl: null } : null;
      if (updatedSettings) {
        setSettings(updatedSettings);
        setCurrentProfilePicture(null);

        // Notify parent component to update UserAccountDropdown
        if (onSettingsUpdate) {
          onSettingsUpdate(updatedSettings);
        }
      }

      // Delete from Firebase Storage
      await deleteProfilePicture(user.uid);

      showSuccess('Profile Picture Removed', 'Your profile picture has been removed');
    } catch (error) {
      logger.error('Failed to delete profile picture:', { error });
      showError('Delete Failed', 'Could not remove profile picture. Please try again.');

      // Revert the change if delete failed
      // The useEffect will re-sync from the actual settings
    } finally {
      setUploadingProfilePicture(false);
      // Re-enable animations after a short delay
      setTimeout(() => setPreventAnimations(false), 100);
    }
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
    { id: 'profile', label: 'Account', icon: UserIcon, premium: false },
    { id: 'personal', label: 'Personal Profile & Goals', icon: Activity, premium: false },
    { id: 'recipe-settings', label: 'Recipe Settings', icon: Bot, premium: true, hasAccess: featureAccess?.canSetDefaultPreferences },
    { id: 'preferences', label: 'Dietary Filters', icon: Palette, premium: true, hasAccess: featureAccess?.availableDietaryFilters && featureAccess.availableDietaryFilters.length > 5 },
    { id: 'health', label: 'Health Conditions', icon: Heart, premium: true, hasAccess: featureAccess?.canUseHealthConditions },
    { id: 'notifications', label: 'Notifications', icon: Bell, premium: false },
    { id: 'data', label: 'Data & Backup', icon: Database, premium: true, hasAccess: featureAccess?.canBackupRestore },
    ...(isUserAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: UserCog, premium: false }] : [])
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
        const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
        const canUploadProfilePicture = featureAccess?.canUploadProfilePicture || false;

        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Header Section with Animated Blobs */}
            <div className={`relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50/50 to-white rounded-3xl border-2 border-green-200 p-6 sm:p-8 shadow-xl ${!preventAnimations ? 'animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out' : ''}`}>
              {/* Animated background blobs */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
                <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/30">
                  <UserIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">Account Settings</h3>
                <p className="text-gray-700 leading-relaxed font-medium text-base">
                  Manage your profile, security settings, and account preferences. Keep your information up-to-date and secure.
                </p>
              </div>
            </div>

            {/* Profile Picture Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 rounded-3xl border-2 border-green-100 p-6 sm:p-8 shadow-xl">
              {/* Animated background blobs */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/30">
                    <UserIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h4 className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Profile Picture
                  </h4>
                </div>

                {canUploadProfilePicture ? (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Current Profile Picture - Larger */}
                    <div className="relative flex-shrink-0">
                      {currentProfilePicture ? (
                        <img
                          src={currentProfilePicture}
                          alt="Profile"
                          className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-green-200 shadow-2xl ring-4 ring-green-100 hover:ring-green-200 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center border-4 border-green-200 shadow-2xl ring-4 ring-green-100 hover:ring-green-200 transition-all duration-300">
                          <span className="text-4xl sm:text-5xl font-black text-white">
                            {getUserInitials(user)}
                          </span>
                        </div>
                      )}

                      {uploadingProfilePicture && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
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

                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <label
                            htmlFor="profile-picture-upload"
                            className={`group cursor-pointer inline-flex items-center justify-center px-5 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold text-sm shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-105 touch-friendly min-h-[44px] ${
                              uploadingProfilePicture ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <Upload className="w-5 h-5 mr-2 group-hover:-translate-y-0.5 transition-transform duration-300" />
                            <span>{uploadingProfilePicture ? 'Uploading...' : 'Upload New Picture'}</span>
                          </label>

                          {currentProfilePicture && !uploadingProfilePicture && (
                            <button
                              onClick={handleProfilePictureDelete}
                              className="group inline-flex items-center justify-center px-5 py-3.5 bg-white border-2 border-red-200 text-red-700 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all duration-300 font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 touch-friendly min-h-[44px]"
                            >
                              <X className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                              <span>Remove Picture</span>
                            </button>
                          )}
                        </div>

                        <div className="bg-green-50/50 border-l-4 border-green-500 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-green-800">
                              <p className="font-semibold mb-1">Supported formats:</p>
                              <p>JPG, PNG, or WebP • Max file size: 5MB</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              ) : (
                <div className="group relative bg-white rounded-2xl border-2 border-orange-200 hover:border-orange-300 p-6 sm:p-8 shadow-xl ring-4 ring-orange-200/50 hover:ring-orange-300/50 hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500">
                  {/* Decorative Pattern Background */}
                  <div className="absolute inset-0 opacity-5 rounded-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400 rounded-full -translate-x-1/2 translate-y-1/2"></div>
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(249, 115, 22, 0.3) 1px, transparent 1px)',
                      backgroundSize: '24px 24px'
                    }}></div>
                  </div>

                  <div className="relative flex flex-col sm:flex-row items-center gap-6">
                    {/* Premium Badge Icon */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        {/* Profile Picture with Premium Ring */}
                        <div className="relative">
                          {currentProfilePicture ? (
                            <img
                              src={currentProfilePicture}
                              alt="Profile"
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-lg ring-4 ring-orange-200 group-hover:ring-orange-300 transition-all duration-300"
                            />
                          ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg ring-4 ring-orange-200 group-hover:ring-orange-300 transition-all duration-300">
                              <span className="text-2xl sm:text-3xl font-black text-white">
                                {getUserInitials(user)}
                              </span>
                            </div>
                          )}
                          {/* Premium Crown Badge */}
                          <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl p-2 shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform duration-300">
                            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 text-orange-800 px-3 py-1.5 rounded-full text-xs font-bold mb-3 shadow-sm">
                        <Crown className="w-3 h-3" />
                        <span>Premium Feature</span>
                      </div>

                      <h4 className="text-lg sm:text-xl font-black text-gray-900 mb-3 leading-tight">
                        Custom Profile Pictures
                      </h4>

                      <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                        Unlock personalized profile pictures with <span className="font-bold text-orange-600">Chef plan</span> or higher. Stand out with a custom profile image that represents you.
                      </p>

                      {/* Features List */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                          <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                          <span className="font-medium">Custom uploads</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                          <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                          <span className="font-medium">5MB file size</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                          <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                          <span className="font-medium">All formats</span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => onShowUpgradeModal && onShowUpgradeModal()}
                        className="group/btn relative bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-3.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 text-sm touch-friendly min-h-[44px] w-full sm:w-auto shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <Crown className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                          Upgrade to Upload Pictures
                        </span>
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/20 to-green-50/20 rounded-3xl border-2 border-green-100 p-6 sm:p-8 shadow-xl">
              {/* Animated background blobs */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl shadow-lg shadow-blue-500/30">
                    <Mail className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h4 className="text-xl font-black bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    Basic Information
                  </h4>
                </div>

                <div className="space-y-5">
                  {/* Display Name Input */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                      <UserIcon className="w-4 h-4 text-green-600" />
                      <span>Display Name</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={settings.displayName || ''}
                        onChange={(e) => updateSetting('displayName', e.target.value)}
                        placeholder="Enter your display name"
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base touch-friendly min-h-[44px] transition-all duration-200 hover:border-green-400 hover:shadow-md shadow-sm bg-white"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <div className="w-2 h-2 bg-green-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-200"></div>
                      </div>
                    </div>
                  </div>

                  {/* Email Address Input */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>Email Address</span>
                      {user.providerData.some(provider => provider.providerId === 'google.com') && (
                        <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                          <Shield className="w-3 h-3" />
                          Google Account
                        </span>
                      )}
                    </label>
                    <div className="relative group">
                      <input
                        type="email"
                        value={settings.email || ''}
                        onChange={(e) => updateSetting('email', e.target.value)}
                        disabled={user.providerData.some(provider => provider.providerId === 'google.com')}
                        placeholder="Enter your email address"
                        className={`w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base touch-friendly min-h-[44px] transition-all duration-200 shadow-sm ${
                          user.providerData.some(provider => provider.providerId === 'google.com')
                            ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200'
                            : 'hover:border-blue-400 hover:shadow-md bg-white'
                        }`}
                      />
                      {!user.providerData.some(provider => provider.providerId === 'google.com') && (
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-200"></div>
                        </div>
                      )}
                    </div>
                    {user.providerData.some(provider => provider.providerId === 'google.com') && (
                      <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50/50 border-l-4 border-blue-500 rounded-lg">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-800">
                          <p className="font-semibold mb-1">Protected by Google</p>
                          <p>Your email address is managed by Google and cannot be changed here. Update it in your Google account settings.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Password Change Section - Only for email/password users */}
            {!isGoogleUser && (
              <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl border-2 border-green-100 p-4 sm:p-6 shadow-lg">
                <h4 className="text-base sm:text-lg font-black text-gray-900 mb-4">Change Password</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm sm:text-base font-bold text-gray-800 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base touch-friendly min-h-[44px] transition-all duration-200 hover:border-green-300 shadow-sm"
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-bold text-gray-800 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base touch-friendly min-h-[44px] transition-all duration-200 hover:border-green-300 shadow-sm"
                      placeholder="Enter your new password"
                    />
                    <div className="mt-2 p-3 bg-green-50 border-2 border-green-200 rounded-xl">
                      <p className="text-xs sm:text-sm text-green-700 leading-relaxed font-medium">
                        Password must be at least 8 characters with uppercase, lowercase, number, and special character
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-bold text-gray-800 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base touch-friendly min-h-[44px] transition-all duration-200 hover:border-green-300 shadow-sm"
                      placeholder="Confirm your new password"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 touch-friendly min-h-[44px]"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {changingPassword ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Account Management Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 rounded-3xl border-2 border-green-200 p-6 sm:p-8 shadow-2xl">
              {/* Animated background blobs */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/30">
                    <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Account Management</h4>
                    <p className="text-sm text-gray-600 font-medium">Manage subscription, billing, and account status</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Subscription Status Card - Always show */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-green-100 p-5 sm:p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-md flex-shrink-0">
                        <CreditCard className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-lg font-black text-gray-900 mb-2">Current Plan</h5>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg">
                            {featureAccess?.currentPlan ? featureAccess.currentPlan.replace('-', ' ').toUpperCase() : 'FREE'}
                          </span>
                          {subscription?.status === 'active' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-semibold text-xs">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {featureAccess?.currentPlan === 'free'
                            ? 'Enjoy basic features with our free plan. Upgrade anytime to unlock premium features!'
                            : `You're enjoying all the benefits of the ${featureAccess?.currentPlan?.replace('-', ' ')} plan.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cancel Plan Button - Only show if user has an active subscription and section not hidden */}
                  {featureAccess?.currentPlan &&
                   featureAccess.currentPlan !== 'free' &&
                   subscription?.status === 'active' &&
                   !cancelSectionHidden && (
                    <div className="group bg-gradient-to-br from-yellow-50 to-amber-50/50 border-2 border-yellow-300 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                      {/* Decorative gradient overlay */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/30 to-amber-200/30 rounded-full blur-2xl -mr-16 -mt-16"></div>

                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 relative">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl shadow-md flex-shrink-0 ring-2 ring-yellow-200 group-hover:ring-yellow-300 transition-all duration-300">
                          <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-lg font-black text-yellow-900 mb-2 flex items-center gap-2">
                            Cancel Subscription
                          </h5>
                          <div className="space-y-3 mb-4">
                            <p className="text-sm text-yellow-800 leading-relaxed font-medium">
                              Downgrade from your <span className="font-bold capitalize">{featureAccess.currentPlan.replace('-', ' ')}</span> plan to the free tier.
                            </p>
                            <div className="bg-yellow-100/50 border-l-4 border-yellow-500 p-3 rounded-lg">
                              <p className="text-xs text-yellow-900 font-semibold">What happens when you cancel:</p>
                              <ul className="mt-2 space-y-1 text-xs text-yellow-800">
                                <li className="flex items-start gap-2">
                                  <span className="text-yellow-600 mt-0.5">•</span>
                                  <span>You'll keep premium features until your billing period ends</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-yellow-600 mt-0.5">•</span>
                                  <span>No charges after cancellation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-yellow-600 mt-0.5">•</span>
                                  <span>You can reactivate your subscription anytime</span>
                                </li>
                              </ul>
                            </div>
                          </div>
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
                  <div className="group bg-gradient-to-br from-red-50 to-rose-50/50 border-2 border-red-300 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    {/* Decorative gradient overlay */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-200/30 to-rose-200/30 rounded-full blur-2xl -mr-16 -mt-16"></div>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 relative">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl shadow-md flex-shrink-0 ring-2 ring-red-200 group-hover:ring-red-300 transition-all duration-300">
                        <UserX className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-lg font-black text-red-900 mb-2 flex items-center gap-2">
                          Danger Zone
                          <span className="inline-flex px-2 py-0.5 bg-red-200 text-red-800 rounded text-xs font-bold">PERMANENT</span>
                        </h5>
                        <div className="space-y-3 mb-4">
                          <p className="text-sm text-red-800 leading-relaxed font-medium">
                            Permanently delete your account and all associated data.
                          </p>
                          <div className="bg-red-100/50 border-l-4 border-red-500 p-3 rounded-lg">
                            <p className="text-xs text-red-900 font-semibold mb-2">⚠️ This action is irreversible and will:</p>
                            <ul className="space-y-1 text-xs text-red-800">
                              <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-0.5">•</span>
                                <span>Delete all your saved recipes permanently</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-0.5">•</span>
                                <span>Cancel any active subscriptions immediately</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-0.5">•</span>
                                <span>Remove all personal data and preferences</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-0.5">•</span>
                                <span className="font-bold">Cannot be undone or recovered</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowDeleteAccountModal(true)}
                          className="group/btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-105 touch-friendly min-h-[44px]"
                        >
                          <UserX className="w-5 h-5 group-hover/btn:animate-pulse" />
                          <span>Delete My Account</span>
                        </button>
                      </div>
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
            <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-4 sm:p-6 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
              <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">Personal Profile & Health Goals</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
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
              <div className="group relative bg-white rounded-2xl border-2 border-orange-200 hover:border-orange-300 p-6 sm:p-8 shadow-xl ring-4 ring-orange-200/50 hover:ring-orange-300/50 hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500">
                {/* Decorative Pattern Background */}
                <div className="absolute inset-0 opacity-5 rounded-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400 rounded-full -translate-x-1/2 translate-y-1/2"></div>
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(249, 115, 22, 0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="relative flex flex-col sm:flex-row items-center gap-6">
                  {/* Premium Badge Icon */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-lg ring-4 ring-orange-200 group-hover:ring-orange-300 transition-all duration-300">
                        <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
                      </div>
                      {/* Premium Crown Badge */}
                      <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl p-2 shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform duration-300">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 text-orange-800 px-3 py-1.5 rounded-full text-xs font-bold mb-3 shadow-sm">
                      <Crown className="w-3 h-3" />
                      <span>Premium Feature</span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-black text-gray-900 mb-3 leading-tight">
                      Personalized Health Goals & Tracking
                    </h4>

                    <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                      Set and track health goals with <span className="font-bold text-orange-600">Chef plan or higher</span>. Get AI-powered recommendations tailored to your wellness journey.
                    </p>

                    {/* Features List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Weight management</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Calorie targets</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Nutrition goals</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Progress tracking</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => onShowUpgradeModal && onShowUpgradeModal()}
                      className="group/btn relative bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-3.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 text-sm touch-friendly min-h-[44px] w-full sm:w-auto shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                        Unlock Health Goals
                      </span>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Personalization Info */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
              <h4 className="font-black text-blue-900 mb-3 flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                AI Personalization
              </h4>
              <div className="text-blue-800 space-y-2">
                <p className="text-sm font-medium">
                  Your personal profile and health goals are used to:
                </p>
                <ul className="text-sm space-y-1 ml-4 font-medium">
                  <li>• Adjust recipe calorie content and portions for your goals</li>
                  <li>• Recommend ingredients that support your health objectives</li>
                  <li>• Suggest cooking times and complexity based on your availability</li>
                  <li>• Avoid ingredients you're allergic to or cannot consume</li>
                  <li>• Customize meal plans for your activity level and lifestyle</li>
                </ul>
                <p className="text-sm mt-3 font-bold bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">
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
            <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
              <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">Dietary Filters</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Customize your recipe experience with dietary filters that match your lifestyle. Set preferences to automatically show recipes that fit your nutritional needs and food choices.
              </p>
            </div>

            {featureAccess?.canSetDefaultPreferences ? (
              <div className="space-y-8">
                {/* Dietary Preferences Section */}
                <div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-2xl p-4 sm:p-5 mb-6">
                    <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-medium">
                      <span className="font-bold text-blue-700">💡 Quick Tip:</span> Select dietary preferences to automatically filter recipes. These will be applied to all recipe searches and suggestions.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {Object.entries(categorizedDietaryOptions).map(([category, options]) => (
                      <div key={category} className="bg-gradient-to-br from-white to-green-50/20 border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                        <h5 className="text-base sm:text-lg font-black text-gray-900 capitalize mb-4 flex items-center gap-2">
                          {category === 'plant-based' && <><span className="text-2xl">🌱</span> Plant-Based Diets</>}
                          {category === 'allergen-free' && <><span className="text-2xl">⚠️</span> Allergen-Free Options</>}
                          {category === 'low-carb' && <><span className="text-2xl">🥩</span> Low-Carb Diets</>}
                          {category === 'fitness' && <><span className="text-2xl">💪</span> Fitness-Focused</>}
                          {category === 'whole-foods' && <><span className="text-2xl">🍎</span> Whole Foods</>}
                          {category === 'health' && <><span className="text-2xl">🩺</span> Health-Focused</>}
                          {category === 'regional' && <><span className="text-2xl">🌍</span> Regional Cuisines</>}
                          {category === 'religious' && <><span className="text-2xl">🕊️</span> Religious Requirements</>}
                        </h5>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {options.map((option) => {
                            const isSelected = settings.defaultDietaryFilters.includes(option.name);
                            const isLocked = option.isLocked;
                            const isUpgradeNeeded = option.isUpgradeNeeded;

                            return (
                              <label
                                key={option.name}
                                className={`relative flex items-start p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                                  isLocked
                                    ? 'opacity-60 bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                                    : isSelected
                                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50/50 shadow-lg hover:shadow-xl transform scale-[1.02]'
                                    : 'bg-white border-gray-200 hover:border-green-300 hover:bg-green-50/50 hover:shadow-md hover:scale-[1.01]'
                                }`}
                                onClick={isLocked && isUpgradeNeeded ? () => {
                                  showError(
                                    'Premium Feature Required',
                                    `${option.name} dietary filtering is available with Master Chef+ plan. Upgrade to access all advanced dietary preferences.`,
                                    'dietary-preference'
                                  );
                                } : undefined}
                              >
                                <div className="flex items-center h-6">
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
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                      isLocked
                                        ? 'bg-gray-100 border-gray-300'
                                        : isSelected
                                        ? 'bg-gradient-to-br from-green-600 to-emerald-600 border-green-600 shadow-md'
                                        : 'bg-white border-gray-300 group-hover:border-green-500'
                                    }`}>
                                      {isLocked ? (
                                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                                      ) : isSelected ? (
                                        <Check className="w-4 h-4 text-white stroke-[3]" />
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center mb-1 flex-wrap gap-2">
                                    <span className={`text-xl ${isLocked ? 'grayscale' : ''} flex-shrink-0`}>{option.icon}</span>
                                    <span className={`font-bold text-sm sm:text-base ${isLocked ? 'text-gray-500' : 'text-gray-900'} flex-1`}>{option.name}</span>
                                    {isUpgradeNeeded && (
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 flex-shrink-0">
                                        Master Chef+
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-xs sm:text-sm leading-relaxed ${isLocked ? 'text-gray-400' : 'text-gray-600'} font-medium`}>
                                    {option.description}
                                  </p>
                                </div>
                                {!isLocked && isSelected && (
                                  <div className="absolute -top-1 -right-1">
                                    <div className="w-7 h-7 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                      <Check className="w-4 h-4 text-white stroke-[3]" />
                                    </div>
                                  </div>
                                )}
                                {isLocked && (
                                  <div className="absolute -top-1 -right-1">
                                    <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center shadow-md">
                                      <Lock className="w-4 h-4 text-gray-600" />
                                    </div>
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
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-6 mt-6 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                          <Check className="w-6 h-6 text-white stroke-[3]" />
                        </div>
                        <h5 className="text-lg font-black text-gray-900">Active Default Filters</h5>
                      </div>
                      <p className="text-gray-800 text-sm mb-4 font-medium">
                        <span className="font-bold text-green-700">{settings.defaultDietaryFilters.length} {settings.defaultDietaryFilters.length === 1 ? 'filter' : 'filters'}</span> will be automatically applied to all recipe searches:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {settings.defaultDietaryFilters.map((filter) => {
                          const filterData = dietaryOptionsWithLockStatus.find(opt => opt.name === filter);
                          return (
                            <span
                              key={filter}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border-2 border-green-200 text-gray-900 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                            >
                              <span className="text-lg">{filterData?.icon}</span>
                              {filter}
                              <button
                                onClick={() => {
                                  const newFilters = settings.defaultDietaryFilters.filter(f => f !== filter);
                                  updateSetting('defaultDietaryFilters', newFilters);
                                }}
                                className="ml-1 w-5 h-5 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center text-red-600 hover:text-red-700 transition-all duration-200"
                              >
                                <X className="w-3 h-3 stroke-[3]" />
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
              <div className="group relative bg-white rounded-2xl border-2 border-orange-200 hover:border-orange-300 p-6 sm:p-8 shadow-xl ring-4 ring-orange-200/50 hover:ring-orange-300/50 hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500">
                {/* Decorative Pattern Background */}
                <div className="absolute inset-0 opacity-5 rounded-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400 rounded-full -translate-x-1/2 translate-y-1/2"></div>
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(249, 115, 22, 0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="relative flex flex-col sm:flex-row items-center gap-6">
                  {/* Premium Badge Icon */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-lg ring-4 ring-orange-200 group-hover:ring-orange-300 transition-all duration-300">
                        <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
                      </div>
                      {/* Premium Crown Badge */}
                      <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl p-2 shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform duration-300">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 text-orange-800 px-3 py-1.5 rounded-full text-xs font-bold mb-3 shadow-sm">
                      <Crown className="w-3 h-3" />
                      <span>Premium Feature</span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-black text-gray-900 mb-3 leading-tight">
                      Advanced Dietary Filters & Preferences
                    </h4>

                    <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                      Unlock personalized dietary filters with <span className="font-bold text-orange-600">any paid plan</span>. Auto-apply your preferences and get recipes tailored to your lifestyle.
                    </p>

                    {/* Features List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Auto-apply filters</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">12+ diet options</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Allergen support</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Medical conditions</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => onShowUpgradeModal && onShowUpgradeModal()}
                      className="group/btn relative bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-3.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 text-sm touch-friendly min-h-[44px] w-full sm:w-auto shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                        Unlock Dietary Filters
                      </span>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                  </div>
                </div>
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
            <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
              <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">Notifications</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Control how and when you receive updates from Recipe Revamped. Customize email preferences, push notifications, and marketing communications to suit your needs.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-2xl p-4 sm:p-5">
              <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-medium">
                <span className="font-bold text-blue-700">💡 Quick Tip:</span> Manage your notification preferences to stay informed without being overwhelmed. You can enable or disable specific types of communications at any time.
              </p>
            </div>

            <div className="space-y-6">
              {/* Main notification toggles */}
              <div className="bg-gradient-to-br from-white to-green-50/20 border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                <h5 className="text-base sm:text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                  <span className="text-2xl">📧</span> Communication Preferences
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-green-300 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-xl">✉️</span>
                        </div>
                        <div>
                          <h6 className="text-base font-black text-gray-900">Email Notifications</h6>
                          <p className="text-xs text-gray-600 font-medium">Receive updates and information</p>
                        </div>
                      </div>
                    </div>
                    <Toggle
                      enabled={settings.emailNotifications}
                      onChange={(enabled) => updateSetting('emailNotifications', enabled)}
                      label=""
                      description=""
                      size="md"
                    />
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-green-300 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-xl">📢</span>
                        </div>
                        <div>
                          <h6 className="text-base font-black text-gray-900">Marketing Emails</h6>
                          <p className="text-xs text-gray-600 font-medium">Toggle all marketing communications</p>
                        </div>
                      </div>
                    </div>
                    <Toggle
                      enabled={hasAnyMarketingEmails}
                      onChange={handleMarketingEmailsToggle}
                      label=""
                      description=""
                      size="md"
                    />
                  </div>
                </div>
              </div>

              {/* Marketing emails group - only show when marketing emails is enabled */}
              {hasAnyMarketingEmails && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-xl">📬</span>
                    </div>
                    <h5 className="text-base sm:text-lg font-black text-gray-900">Marketing Email Types</h5>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-green-100 rounded-xl p-4 hover:border-green-300 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h6 className="text-sm font-bold text-gray-900">General Marketing</h6>
                          <p className="text-xs text-gray-600 font-medium">Newsletters and general communications</p>
                        </div>
                      </div>
                      <Toggle
                        enabled={settings.marketingEmails}
                        onChange={(enabled) => updateSetting('marketingEmails', enabled)}
                        label=""
                        description=""
                        size="sm"
                      />
                    </div>

                    <div className="bg-white border-2 border-green-100 rounded-xl p-4 hover:border-green-300 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h6 className="text-sm font-bold text-gray-900">Product Updates</h6>
                          <p className="text-xs text-gray-600 font-medium">New features and improvements</p>
                        </div>
                      </div>
                      <Toggle
                        enabled={settings.productUpdates}
                        onChange={(enabled) => updateSetting('productUpdates', enabled)}
                        label=""
                        description=""
                        size="sm"
                      />
                    </div>

                    <div className="bg-white border-2 border-green-100 rounded-xl p-4 hover:border-green-300 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h6 className="text-sm font-bold text-gray-900">Feature Announcements</h6>
                          <p className="text-xs text-gray-600 font-medium">New tools and capabilities</p>
                        </div>
                      </div>
                      <Toggle
                        enabled={settings.featuresAnnouncements}
                        onChange={(enabled) => updateSetting('featuresAnnouncements', enabled)}
                        label=""
                        description=""
                        size="sm"
                      />
                    </div>

                    <div className="bg-white border-2 border-green-100 rounded-xl p-4 hover:border-green-300 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h6 className="text-sm font-bold text-gray-900">Promotional Offers</h6>
                          <p className="text-xs text-gray-600 font-medium">Special deals and discounts</p>
                        </div>
                      </div>
                      <Toggle
                        enabled={settings.promotionalOffers}
                        onChange={(enabled) => updateSetting('promotionalOffers', enabled)}
                        label=""
                        description=""
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'recipe-settings':
        return (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 rounded-3xl border-2 border-green-100 p-6 sm:p-8 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
              {/* Animated background blobs */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/30">
                    <Bot className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Recipe Settings</h3>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed font-medium">
                  Configure your recipe conversion preferences and cooking defaults. Set up auto-save, serving sizes, and measurement units to streamline your cooking experience.
                </p>
              </div>
            </div>

            {featureAccess?.canSetDefaultPreferences ? (
              <div className="space-y-6">
                {/* Auto-save Recipes */}
                <div className="relative overflow-hidden bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 rounded-3xl border-2 border-green-100 p-6 sm:p-8 shadow-xl">
                  {/* Animated background blobs */}
                  <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000" />
                  </div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                        <Save className="w-7 h-7 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Auto-save Recipes</h4>
                        <p className="text-sm text-gray-600 font-medium">Automatically save recipes as you work</p>
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

                  {settings.autoSaveRecipes && (
                    <div className="mt-4 flex items-start gap-2 p-3 bg-green-50/50 border-l-4 border-green-500 rounded-lg animate-in slide-in-from-top-2 fade-in duration-300">
                      <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-green-800">
                        <p className="font-semibold mb-1">Auto-save is enabled</p>
                        <p>Your recipes will be automatically saved when you generate them.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recipe Conversion Defaults */}
                <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/20 to-green-50/20 rounded-3xl border-2 border-green-100 p-6 sm:p-8 shadow-xl">
                  {/* Animated background blobs */}
                  <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Bot className="w-7 h-7 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Recipe Conversion Defaults</h4>
                        <p className="text-sm text-gray-600 font-medium">Set your preferred recipe generation settings</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Default Serving Size */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-white to-green-50/30 rounded-3xl p-6 sm:p-8 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        {/* Subtle animated blob */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-200 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob"></div>

                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                              <span className="text-2xl">🍽️</span>
                            </div>
                            <div>
                              <label className="block text-base font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Default Serving Size</label>
                              <p className="text-xs text-gray-600 font-medium">Choose how many people to cook for</p>
                            </div>
                          </div>

                          {/* Quick Selection Buttons */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Quick Select</span>
                              <div className="flex-1 h-px bg-gradient-to-r from-green-200 to-transparent"></div>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                              {[1, 2, 4, 6, 8].map((size) => (
                                <button
                                  key={size}
                                  onClick={() => updateSetting('defaultServingSize', size)}
                                  className={`group relative py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                                    settings.defaultServingSize === size
                                      ? 'bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-xl shadow-green-500/50 scale-110 ring-4 ring-green-200'
                                      : 'bg-white text-gray-700 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:scale-105 border-2 border-gray-200 hover:border-green-400 shadow-md hover:shadow-lg'
                                  }`}
                                >
                                  {settings.defaultServingSize === size && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  <div className={`text-2xl font-black mb-1 ${settings.defaultServingSize === size ? 'text-white' : 'text-green-600 group-hover:text-emerald-600'}`}>{size}</div>
                                  <div className={`text-[9px] font-bold uppercase tracking-wide ${settings.defaultServingSize === size ? 'text-white/90' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                    {size === 1 ? 'person' : 'people'}
                                  </div>
                                </button>
                              ))}
                            </div>

                            {/* Current selection indicator */}
                            <div className="flex items-center gap-2 p-3 bg-green-50/50 rounded-xl border border-green-200">
                              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg text-white font-black text-sm shadow-md">
                                {settings.defaultServingSize}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-green-900">Current Default</p>
                                <p className="text-[10px] text-green-700">Recipes will be scaled for {settings.defaultServingSize} {settings.defaultServingSize === 1 ? 'person' : 'people'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t-2 border-green-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                              <span className="bg-gradient-to-br from-white to-green-50/30 px-4 py-1 rounded-full text-xs font-bold text-green-700 uppercase tracking-wider shadow-sm border border-green-200">Custom Size</span>
                            </div>
                          </div>

                          {/* Custom Input with Stepper */}
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-600 text-center">Enter any value between 1 and 20</p>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  const newValue = Math.max(1, settings.defaultServingSize - 1);
                                  updateSetting('defaultServingSize', newValue);
                                }}
                                disabled={settings.defaultServingSize <= 1}
                                className="group w-14 h-14 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 hover:border-green-500 disabled:border-gray-200 rounded-2xl flex items-center justify-center text-gray-700 hover:text-green-600 disabled:text-gray-400 disabled:cursor-not-allowed font-black text-2xl transition-all duration-300 hover:scale-110 disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-sm"
                              >
                                <span className="group-hover:scale-110 transition-transform duration-200">−</span>
                              </button>
                              <div className="flex-1 relative">
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={settings.defaultServingSize}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    const servingSize = isNaN(value) || value < 1 ? 1 : Math.min(value, 20);
                                    updateSetting('defaultServingSize', servingSize);
                                  }}
                                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/30 focus:border-green-500 bg-white text-3xl font-black text-center transition-all duration-300 hover:border-green-400 shadow-lg hover:shadow-xl"
                                  placeholder="#"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                  <span className="text-green-600 text-xs font-bold uppercase tracking-wide bg-green-50 px-2 py-1 rounded-lg">
                                    {settings.defaultServingSize === 1 ? 'person' : 'people'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const newValue = Math.min(20, settings.defaultServingSize + 1);
                                  updateSetting('defaultServingSize', newValue);
                                }}
                                disabled={settings.defaultServingSize >= 20}
                                className="group w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 border-2 border-green-600 hover:border-green-700 disabled:border-gray-300 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center text-white font-black text-2xl transition-all duration-300 hover:scale-110 disabled:hover:scale-100 shadow-xl hover:shadow-2xl disabled:shadow-sm"
                              >
                                <span className="group-hover:scale-110 transition-transform duration-200">+</span>
                              </button>
                            </div>
                            <div className="flex items-center justify-center gap-6 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                <span className="text-xs text-gray-600 font-semibold">Min: 1</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                <span className="text-xs text-gray-600 font-semibold">Max: 20</span>
                              </div>
                            </div>
                          </div>
                      </div>
                    </div>

                      {/* Preferred Units / Measurement Units */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 rounded-3xl p-6 sm:p-8 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        {/* Subtle animated blob */}
                        <div className="absolute top-0 left-0 w-24 h-24 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob animation-delay-2000"></div>

                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                              <span className="text-2xl">📏</span>
                            </div>
                            <div>
                              <label className="block text-base font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Measurement Units</label>
                              <p className="text-xs text-gray-600 font-medium">Choose your preferred system</p>
                            </div>
                          </div>

                          {/* Unit Selection Cards */}
                          <div className="space-y-4">
                            {/* Metric System Card */}
                            <button
                              onClick={() => updateSetting('preferredUnits', 'metric')}
                              className={`group w-full p-5 rounded-2xl border-3 transition-all duration-300 text-left relative overflow-hidden ${
                                settings.preferredUnits === 'metric'
                                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 border-blue-600 text-white shadow-2xl shadow-blue-500/50 scale-[1.03] ring-4 ring-blue-200'
                                  : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:scale-[1.02] shadow-lg hover:shadow-xl'
                              }`}
                            >
                              {/* Selection checkmark badge */}
                              {settings.preferredUnits === 'metric' && (
                                <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-xl animate-in zoom-in duration-300">
                                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}

                              <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                                  settings.preferredUnits === 'metric'
                                    ? 'bg-white/20 ring-2 ring-white/30'
                                    : 'bg-gradient-to-br from-blue-100 to-indigo-100 group-hover:scale-110'
                                }`}>
                                  <span className="text-3xl">🌍</span>
                                </div>
                                <div className="flex-1 pr-8">
                                  <div className={`text-lg font-black mb-1 transition-colors duration-200 ${settings.preferredUnits === 'metric' ? 'text-white' : 'text-gray-900 group-hover:text-blue-900'}`}>
                                    Metric System
                                  </div>
                                  <div className={`text-xs font-semibold mb-3 ${settings.preferredUnits === 'metric' ? 'text-white/90' : 'text-gray-600 group-hover:text-blue-800'}`}>
                                    International standard measurements
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {['grams', 'ml', '°C', 'kg', 'liters'].map((unit) => (
                                      <span
                                        key={unit}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                                          settings.preferredUnits === 'metric'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-blue-100 text-blue-700 group-hover:bg-blue-200'
                                        }`}
                                      >
                                        {unit}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </button>

                            {/* Imperial System Card */}
                            <button
                              onClick={() => updateSetting('preferredUnits', 'imperial')}
                              className={`group w-full p-5 rounded-2xl border-3 transition-all duration-300 text-left relative overflow-hidden ${
                                settings.preferredUnits === 'imperial'
                                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 border-blue-600 text-white shadow-2xl shadow-blue-500/50 scale-[1.03] ring-4 ring-blue-200'
                                  : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:scale-[1.02] shadow-lg hover:shadow-xl'
                              }`}
                            >
                              {/* Selection checkmark badge */}
                              {settings.preferredUnits === 'imperial' && (
                                <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-xl animate-in zoom-in duration-300">
                                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}

                              <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                                  settings.preferredUnits === 'imperial'
                                    ? 'bg-white/20 ring-2 ring-white/30'
                                    : 'bg-gradient-to-br from-blue-100 to-indigo-100 group-hover:scale-110'
                                }`}>
                                  <span className="text-3xl">🦅</span>
                                </div>
                                <div className="flex-1 pr-8">
                                  <div className={`text-lg font-black mb-1 transition-colors duration-200 ${settings.preferredUnits === 'imperial' ? 'text-white' : 'text-gray-900 group-hover:text-blue-900'}`}>
                                    Imperial System
                                  </div>
                                  <div className={`text-xs font-semibold mb-3 ${settings.preferredUnits === 'imperial' ? 'text-white/90' : 'text-gray-600 group-hover:text-blue-800'}`}>
                                    US customary measurements
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {['cups', 'oz', '°F', 'lbs', 'tbsp'].map((unit) => (
                                      <span
                                        key={unit}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                                          settings.preferredUnits === 'imperial'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-blue-100 text-blue-700 group-hover:bg-blue-200'
                                        }`}
                                      >
                                        {unit}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </button>
                          </div>

                          {/* Info Box with Current Selection */}
                          <div className="mt-5 space-y-3">
                            <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg flex-shrink-0">
                                <span className="text-xl">{settings.preferredUnits === 'metric' ? '🌍' : '🦅'}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-blue-900">Currently Using</p>
                                <p className="text-sm font-black text-blue-700">
                                  {settings.preferredUnits === 'metric' ? 'Metric System' : 'Imperial System'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-blue-50/50 border-l-4 border-blue-500 rounded-lg">
                              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-blue-800">
                                <p className="font-semibold mb-1">💡 Automatic Conversion</p>
                                <p>All recipes will be instantly converted to {settings.preferredUnits === 'metric' ? 'metric' : 'imperial'} measurements when generated</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="group relative bg-white rounded-2xl border-2 border-orange-200 hover:border-orange-300 p-6 sm:p-8 shadow-xl ring-4 ring-orange-200/50 hover:ring-orange-300/50 hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500">
                {/* Decorative Pattern Background */}
                <div className="absolute inset-0 opacity-5 rounded-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400 rounded-full -translate-x-1/2 translate-y-1/2"></div>
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(249, 115, 22, 0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="relative flex flex-col sm:flex-row items-center gap-6">
                  {/* Premium Badge Icon */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-lg ring-4 ring-orange-200 group-hover:ring-orange-300 transition-all duration-300">
                        <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
                      </div>
                      {/* Premium Crown Badge */}
                      <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl p-2 shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform duration-300">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 text-orange-800 px-3 py-1.5 rounded-full text-xs font-bold mb-3 shadow-sm">
                      <Crown className="w-3 h-3" />
                      <span>Premium Feature</span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-black text-gray-900 mb-3 leading-tight">
                      Smart Recipe Settings & Defaults
                    </h4>

                    <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                      Streamline your cooking with <span className="font-bold text-orange-600">premium settings</span>. Auto-save recipes and set default preferences to save time.
                    </p>

                    {/* Features List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Auto-save recipes</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Default servings</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Preferred units</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Quick conversions</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => onShowUpgradeModal && onShowUpgradeModal()}
                      className="group/btn relative bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-3.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 text-sm touch-friendly min-h-[44px] w-full sm:w-auto shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                        Unlock Recipe Settings
                      </span>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                  </div>
                </div>
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
            <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
              <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">Health Conditions & Dietary Needs</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Tell us about your health conditions so we can suggest recipes that support your specific dietary requirements and wellness goals.
              </p>
            </div>

            {!canAccessHealthConditions && (
              <div className="group relative bg-white rounded-2xl border-2 border-orange-200 hover:border-orange-300 p-6 sm:p-8 shadow-xl ring-4 ring-orange-200/50 hover:ring-orange-300/50 hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500">
                {/* Decorative Pattern Background */}
                <div className="absolute inset-0 opacity-5 rounded-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400 rounded-full -translate-x-1/2 translate-y-1/2"></div>
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(249, 115, 22, 0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="relative flex flex-col sm:flex-row items-center gap-6">
                  {/* Premium Badge Icon */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-lg ring-4 ring-orange-200 group-hover:ring-orange-300 transition-all duration-300">
                        <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
                      </div>
                      {/* Premium Crown Badge */}
                      <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl p-2 shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform duration-300">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 text-orange-800 px-3 py-1.5 rounded-full text-xs font-bold mb-3 shadow-sm">
                      <Crown className="w-3 h-3" />
                      <span>Premium Feature</span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-black text-gray-900 mb-3 leading-tight">
                      Health Conditions & Medical Support
                    </h4>

                    <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                      Get recipes tailored to your health with <span className="font-bold text-orange-600">Master Chef plan</span>. Track conditions and receive personalized dietary guidance.
                    </p>

                    {/* Features List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Diabetes support</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Heart health</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Digestive care</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Allergen safety</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => onShowUpgradeModal && onShowUpgradeModal()}
                      className="group/btn relative bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-3.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 text-sm touch-friendly min-h-[44px] w-full sm:w-auto shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                        Unlock Health Features
                      </span>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {canAccessHealthConditions && (
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-2xl p-4 sm:p-5 mb-6">
                  <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-medium">
                    <span className="font-bold text-blue-700">💡 Quick Tip:</span> Select health conditions to get personalized recipe recommendations. These will help us suggest recipes that support your specific dietary requirements and wellness goals.
                  </p>
                </div>

                <div className="space-y-6">
                  {Object.entries(categorizedConditions).map(([category, conditions]) => (
                    <div key={category} className="bg-gradient-to-br from-white to-green-50/20 border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                      <h5 className="text-base sm:text-lg font-black text-gray-900 capitalize mb-4 flex items-center gap-2">
                        {category === 'metabolic' && <><span className="text-2xl">🧬</span> Metabolic Conditions</>}
                        {category === 'cardiovascular' && <><span className="text-2xl">💗</span> Heart Health</>}
                        {category === 'digestive' && <><span className="text-2xl">🌱</span> Digestive Health</>}
                        {category === 'hormonal' && <><span className="text-2xl">⚖️</span> Hormonal Health</>}
                        {category === 'lifestyle' && <><span className="text-2xl">🎯</span> Lifestyle Goals</>}
                      </h5>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {conditions.map((condition) => {
                          const isSelected = settings.healthConditions?.includes(condition.name) || false;
                          return (
                            <label
                              key={condition.name}
                              className={`relative flex items-start p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                                isSelected
                                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50/50 shadow-lg hover:shadow-xl transform scale-[1.02]'
                                  : 'bg-white border-gray-200 hover:border-green-300 hover:bg-green-50/50 hover:shadow-md hover:scale-[1.01]'
                              }`}
                            >
                              <div className="flex items-center h-6">
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
                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-gradient-to-br from-green-600 to-emerald-600 border-green-600 shadow-md'
                                      : 'bg-white border-gray-300 group-hover:border-green-500'
                                  }`}>
                                    {isSelected && (
                                      <Check className="w-4 h-4 text-white stroke-[3]" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="flex items-center mb-1 flex-wrap gap-2">
                                  <span className="text-xl flex-shrink-0">{condition.icon}</span>
                                  <span className="font-bold text-sm sm:text-base text-gray-900 flex-1">{condition.name}</span>
                                </div>
                                <p className="text-xs sm:text-sm leading-relaxed text-gray-600 font-medium">{condition.description}</p>
                              </div>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1">
                                  <div className="w-7 h-7 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                    <Check className="w-4 h-4 text-white stroke-[3]" />
                                  </div>
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {settings.healthConditions && settings.healthConditions.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                        <Shield className="w-6 h-6 text-white stroke-[3]" />
                      </div>
                      <h5 className="text-lg font-black text-gray-900">Your Health Profile</h5>
                    </div>
                    <p className="text-gray-800 text-sm mb-4 font-medium">
                      We'll prioritize recipes that align with <span className="font-bold text-green-700">{settings.healthConditions.length} health {settings.healthConditions.length === 1 ? 'consideration' : 'considerations'}</span>:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {settings.healthConditions.map((condition) => {
                          const conditionData = healthConditions.find(c => c.name === condition);
                          return (
                            <span
                              key={condition}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border-2 border-green-200 text-gray-900 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                            >
                              <span className="text-lg">{conditionData?.icon}</span>
                              {condition}
                              <button
                                onClick={() => {
                                  const newConditions = settings.healthConditions?.filter(c => c !== condition) || [];
                                  updateSetting('healthConditions', newConditions);
                                }}
                                className="ml-1 w-5 h-5 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center text-red-600 hover:text-red-700 transition-all duration-200"
                              >
                                <X className="w-3 h-3 stroke-[3]" />
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
            <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
              <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">Data & Backup</h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                Protect your recipes and cooking data with secure cloud backups. Restore your collection anytime and keep your culinary creations safe.
              </p>
            </div>

            {/* Backup features restricted to paid plans */}
            {featureAccess?.canBackupRestore ? (
              <>
                {/* Manual Backup & Recovery */}
                <div className="bg-gradient-to-br from-white to-green-50/20 border-2 border-green-100 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-md">
                        <Database className="w-5 h-5 text-green-600" />
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-gray-900">Backup & Recovery</h4>
                    </div>
                    <div className="text-sm">
                      {(() => {
                        const currentPlan = featureAccess?.currentPlan || 'free';
                        const { limit, planName } = getBackupLimits(currentPlan);
                        const isAtLimit = backups.length >= limit;
                        return (
                          <span className={`px-3 py-1.5 rounded-full font-bold ${isAtLimit ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {backups.length}/{limit} backups ({planName})
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Recipe count indicator */}
                  <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-800 font-medium">Recipes in your collection:</span>
                      <span className="font-black text-gray-900 text-lg">{recipeCount} recipes</span>
                    </div>
                    {recipeCount === 0 && (
                      <p className="text-xs text-orange-700 mt-2 font-medium">
                        ⚠️ You need at least 1 recipe to create a backup
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
                      className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
                    >
                      <Download className="w-5 h-5" />
                      {backupLoading ? 'Creating Backup...' : 'Create Manual Backup'}
                    </button>

                    {/* Show backup limit warning */}
                    {(() => {
                      const currentPlan = featureAccess?.currentPlan || 'free';
                      const { limit, planName } = getBackupLimits(currentPlan);
                      const isAtLimit = backups.length >= limit;

                      if (isAtLimit) {
                        return (
                          <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50/50 border-2 border-orange-200 rounded-xl">
                            <p className="text-sm text-gray-800 font-medium">
                              <span className="font-bold text-orange-700">⚠️ Backup limit reached!</span> Your {planName} plan allows {limit} backups.
                              Delete existing backups to create new ones.
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Available Backups Section - Always Visible */}
                  <div className="mt-6 pt-6 border-t-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center shadow-md">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-gray-900">Available Backups (90-day retention)</h4>
                    </div>

                  {backups.length === 0 ? (
                    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-xl text-center">
                      <p className="text-sm text-gray-600 font-medium">📦 No backups available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {backups.map((backup) => (
                        <div key={backup.id} className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200">
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {backup.createdAt?.toLocaleDateString()} at {backup.createdAt?.toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-gray-600 font-medium mt-1">
                              📚 {backup.recipes?.length || 0} recipes • ⏰ Expires: {backup.expiresAt?.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRestoreClick(backup)}
                              disabled={restoringBackup === backup.id}
                              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                                restoringBackup === backup.id
                                  ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105'
                              }`}
                            >
                              {restoringBackup === backup.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                                  Restoring...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Restore
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteClick(backup)}
                              disabled={restoringBackup === backup.id}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-700 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                            >
                              <Trash2 className="w-4 h-4" />
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
              <div className="group relative bg-white rounded-2xl border-2 border-orange-200 hover:border-orange-300 p-6 sm:p-8 shadow-xl ring-4 ring-orange-200/50 hover:ring-orange-300/50 hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500">
                {/* Decorative Pattern Background */}
                <div className="absolute inset-0 opacity-5 rounded-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400 rounded-full -translate-x-1/2 translate-y-1/2"></div>
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(249, 115, 22, 0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="relative flex flex-col sm:flex-row items-center gap-6">
                  {/* Premium Badge Icon */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-lg ring-4 ring-orange-200 group-hover:ring-orange-300 transition-all duration-300">
                        <Database className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
                      </div>
                      {/* Premium Crown Badge */}
                      <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl p-2 shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform duration-300">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 text-orange-800 px-3 py-1.5 rounded-full text-xs font-bold mb-3 shadow-sm">
                      <Crown className="w-3 h-3" />
                      <span>Premium Feature</span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-black text-gray-900 mb-3 leading-tight">
                      Cloud Backup & Recipe Recovery
                    </h4>

                    <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                      Protect your recipes with <span className="font-bold text-orange-600">cloud backups</span>. Never lose your culinary creations with automatic backup and recovery tools.
                    </p>

                    {/* Features List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Auto backups</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">90-day retention</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">One-click restore</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                        <span className="font-medium">Secure storage</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => onShowUpgradeModal && onShowUpgradeModal()}
                      className="group/btn relative bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-3.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 text-sm touch-friendly min-h-[44px] w-full sm:w-auto shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                        Unlock Backup Features
                      </span>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                  </div>
                </div>
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
            {/* Admin Panel Header */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50/50 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl flex items-center justify-center shadow-md">
                  <UserCog className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    Admin Panel
                  </h2>
                  <p className="text-sm text-red-700 font-medium">Manage users, notifications, and content</p>
                </div>
              </div>
            </div>

            {/* Admin Section Tabs */}
            <div className="bg-gradient-to-br from-white to-red-50/20 border-2 border-red-100 rounded-2xl p-4 shadow-lg">
              <nav className="flex flex-wrap gap-3">
                <button
                  onClick={() => changeSection('admin-users')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                    (activeSection === 'admin' || activeSection === 'admin-users')
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30 transform scale-105'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:scale-105 hover:shadow-md'
                  }`}
                >
                  <UserCog className="w-4 h-4" />
                  <span>User Management</span>
                </button>
                <button
                  onClick={() => changeSection('admin-notifications')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                    activeSection === 'admin-notifications'
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30 transform scale-105'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:scale-105 hover:shadow-md'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </button>
                <button
                  onClick={() => changeSection('admin-marketing')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                    activeSection === 'admin-marketing'
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30 transform scale-105'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:scale-105 hover:shadow-md'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Marketing Emails</span>
                </button>
                <button
                  onClick={() => changeSection('admin-blog')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                    activeSection === 'admin-blog'
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30 transform scale-105'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:scale-105 hover:shadow-md'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Blog Management</span>
                </button>
              </nav>
            </div>

            {/* Admin Content */}
            <div key={activeSection} className="bg-gradient-to-br from-white to-gray-50/50 border-2 border-gray-200 rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
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
    <div className="min-h-screen">
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Mobile Navigation Tabs */}
          <div className="lg:hidden">
            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50/50 to-white rounded-2xl border-2 border-green-100 p-3 shadow-lg mb-4">
              {/* Subtle animated blobs for mobile */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
              </div>

              <div className="relative z-10 flex overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                <div className="flex gap-2 min-w-max">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id || (section.id === 'admin' && (activeSection === 'admin-users' || activeSection === 'admin-notifications' || activeSection === 'admin-marketing' || activeSection === 'admin-blog'));
                    const showPremiumBadge = section.premium && !section.hasAccess;
                    return (
                      <button
                        key={section.id}
                        onClick={() => changeSection(section.id)}
                        className={`group relative flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 whitespace-nowrap touch-friendly min-h-[44px] ${
                          isActive
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/40 transform scale-105'
                            : 'text-gray-700 bg-white/80 backdrop-blur-sm border-2 border-green-100 hover:border-green-300 hover:bg-white hover:shadow-md hover:scale-105'
                        }`}
                      >
                        {showPremiumBadge && (
                          <Crown className={`absolute -top-1 -left-1 w-4 h-4 transition-all duration-300 ${
                            isActive
                              ? 'text-yellow-300'
                              : 'text-orange-500 group-hover:text-orange-600'
                          }`} />
                        )}
                        <div className={`flex items-center justify-center w-7 h-7 rounded-lg mr-2 transition-all duration-300 ${
                          isActive
                            ? 'bg-white/20'
                            : 'bg-green-50 group-hover:bg-green-100 border border-green-200'
                        }`}>
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-green-600'}`} />
                        </div>
                        <span className="text-xs sm:text-sm truncate">{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save Changes Button - Mobile */}
              {hasUnsavedChanges && !activeSection.startsWith('admin') && (
                <div className="relative z-10 mt-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold px-4 py-3.5 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-xl shadow-green-500/40 hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span className="text-sm">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span className="text-sm">Save Changes</span>
                          {saveStatus === 'saved' && (
                            <Check className="w-5 h-5 animate-in zoom-in duration-200" />
                          )}
                        </>
                      )}
                    </span>
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50/50 to-white rounded-3xl border-2 border-green-100 p-4 shadow-xl">
              {/* Animated background blobs */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000" />
                <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000" />
              </div>

              <nav className="relative z-10 space-y-2">
                {sections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id || (section.id === 'admin' && (activeSection === 'admin-users' || activeSection === 'admin-notifications' || activeSection === 'admin-marketing' || activeSection === 'admin-blog'));
                  const showPremiumBadge = section.premium && !section.hasAccess;
                  return (
                    <button
                      key={section.id}
                      onClick={() => changeSection(section.id)}
                      className={`w-full group relative flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${!preventAnimations ? `animate-in fade-in slide-in-from-left-4` : ''} ${
                        isActive
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl shadow-green-500/40 transform scale-[1.02]'
                          : 'text-gray-700 bg-white/80 backdrop-blur-sm border-2 border-green-100 hover:border-green-300 hover:bg-white hover:shadow-lg hover:scale-[1.02]'
                      }`}
                      style={!preventAnimations ? {
                        animationDuration: '600ms',
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'backwards'
                      } : {}}
                    >
                      {showPremiumBadge && (
                        <Crown className={`absolute -top-1.5 -left-1.5 w-5 h-5 transition-all duration-300 ${
                          isActive
                            ? 'text-yellow-300'
                            : 'text-orange-500 group-hover:text-orange-600'
                        }`} />
                      )}
                      <div className={`flex items-center justify-center w-9 h-9 rounded-xl mr-3 transition-all duration-300 ${
                        isActive
                          ? 'bg-white/20'
                          : 'bg-green-50 group-hover:bg-green-100 border border-green-200'
                      }`}>
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-green-600'}`} />
                      </div>
                      <span className="flex-1 text-left">{section.label}</span>
                      <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${
                        isActive ? 'text-white translate-x-1' : 'text-gray-400 group-hover:translate-x-1 group-hover:text-green-600'
                      }`} />
                    </button>
                  );
                })}
              </nav>

              {/* Save Changes Button - Desktop */}
              {hasUnsavedChanges && !activeSection.startsWith('admin') && (
                <div className="relative z-10 mt-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold px-4 py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-xl shadow-green-500/40 hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span className="text-sm">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span className="text-sm">Save Changes</span>
                          {saveStatus === 'saved' && (
                            <Check className="w-5 h-5 animate-in zoom-in duration-200" />
                          )}
                        </>
                      )}
                    </span>
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 relative">
            <div key={activeSection.startsWith('admin') ? 'admin' : activeSection} className={`pl-4 sm:pl-6 lg:pl-8 ${!preventAnimations ? 'animate-in fade-in slide-in-from-right-4 duration-700 ease-out' : ''}`}>
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
      {showDeleteAccountModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => !deletingAccount && setShowDeleteAccountModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-8 relative overflow-hidden">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}></div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={deletingAccount}
                className="absolute top-6 right-6 p-2 text-white/90 hover:text-white transition-all duration-200 rounded-xl hover:bg-white/20 backdrop-blur-sm z-10 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg ring-2 ring-white/30">
                  <AlertTriangle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 drop-shadow-sm">
                  Delete Account
                </h3>
                <p className="text-red-50 text-base sm:text-lg font-semibold max-w-lg mx-auto">
                  Choose how you want to handle your account. Both options will automatically cancel any active subscription.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              <div className="space-y-4 mb-8">
                {/* Deactivate Option */}
                <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50/50 border-2 border-yellow-300 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
                  {/* Decorative gradient overlay */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/20 to-amber-200/20 rounded-full blur-2xl -mr-16 -mt-16"></div>

                  <div className="relative">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl flex items-center justify-center shadow-md ring-2 ring-yellow-200 group-hover:ring-yellow-300 transition-all duration-300">
                        <UserX className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-black text-yellow-900 mb-2">Deactivate Account</h4>
                        <p className="text-sm sm:text-base text-yellow-800 leading-relaxed font-semibold">
                          Temporarily disable your account. You can reactivate it by logging in again. All your data will be preserved.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAccount('deactivate')}
                      disabled={deletingAccount}
                      className="w-full px-6 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl hover:from-yellow-600 hover:to-amber-600 transition-all duration-200 font-bold shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 disabled:transform-none"
                    >
                      {deletingAccount ? 'Deactivating...' : 'Deactivate Account'}
                    </button>
                  </div>
                </div>

                {/* Permanently Delete Option */}
                <div className="relative bg-gradient-to-br from-red-50 to-rose-50/50 border-2 border-red-300 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
                  {/* Decorative gradient overlay */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-200/20 to-rose-200/20 rounded-full blur-2xl -mr-16 -mt-16"></div>

                  <div className="relative">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center shadow-md ring-2 ring-red-200 group-hover:ring-red-300 transition-all duration-300">
                        <Trash2 className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-black text-red-900 mb-2">Permanently Delete</h4>
                        <p className="text-sm sm:text-base text-red-800 leading-relaxed font-semibold">
                          Permanently delete your account and all data. <span className="font-black">This action cannot be undone</span> and all data will be lost.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAccount('delete')}
                      disabled={deletingAccount}
                      className="w-full px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 disabled:transform-none"
                    >
                      {deletingAccount ? 'Deleting Account...' : 'Delete Account & All Data'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={deletingAccount}
                className="w-full px-6 py-3.5 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};