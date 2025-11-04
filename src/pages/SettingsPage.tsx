import { useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { Settings } from './Settings';
import type { UserSettings } from '../types/userSettings';
import type { FeatureAccess } from '../hooks/useFeatureAccess';

// Outlet context type
interface AppOutletContext {
  user: User;
  userSettings: UserSettings | null;
  featureAccess: FeatureAccess;
  showUpgradeModal: () => void;
  updateRecipeCount: (count: number) => void;
}

export function SettingsPage() {
  // Get shared state from AppLayout via Outlet context
  const { user, userSettings: initialUserSettings, featureAccess, showUpgradeModal } = useOutletContext<AppOutletContext>();

  const navigate = useNavigate();
  const params = useParams();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(initialUserSettings);

  // Get section from URL params (/app/settings/account, /app/settings/personal, etc.)
  // Map URL sections to internal section IDs
  const sectionMapping: Record<string, string> = {
    'account': 'profile',
    'personal': 'personal',
    'affiliate': 'affiliate',
    'recipe-settings': 'recipe-settings',
    'dietary-filters': 'preferences',
    'health': 'health',
    'notifications': 'notifications',
    'data': 'data',
    'backup': 'data',
    'admin-panel': 'admin',
    'admin-users': 'admin-users',
    'admin-notifications': 'admin-notifications',
    'admin-marketing': 'admin-marketing',
    'admin-blog': 'admin-blog',
    'admin-jobs': 'admin-jobs',
  };

  const urlSection = params.section;
  const mappedSection = urlSection ? sectionMapping[urlSection] : undefined;

  const handleBack = () => {
    // Navigate back to the convert page (or could be previous page)
    navigate('/app/convert');
  };

  const handleSettingsUpdate = (updatedSettings: UserSettings) => {
    setUserSettings(updatedSettings);
  };

  // Handle section navigation by updating URL
  const handleSectionChange = (sectionId: string) => {
    // Reverse map internal section ID to URL-friendly name
    const urlMapping: Record<string, string> = {
      'profile': 'account',
      'personal': 'personal',
      'affiliate': 'affiliate',
      'recipe-settings': 'recipe-settings',
      'preferences': 'dietary-filters',
      'health': 'health',
      'notifications': 'notifications',
      'data': 'backup',
      'admin': 'admin-panel',
      'admin-users': 'admin-users',
      'admin-notifications': 'admin-notifications',
      'admin-marketing': 'admin-marketing',
      'admin-blog': 'admin-blog',
      'admin-jobs': 'admin-jobs',
    };

    const urlSection = urlMapping[sectionId] || 'account';
    navigate(`/app/settings/${urlSection}`, { replace: true });
  };

  return (
    <Settings
      user={user}
      onBack={handleBack}
      onSettingsUpdate={handleSettingsUpdate}
      onShowUpgradeModal={showUpgradeModal}
      initialActiveSection={mappedSection || 'profile'}
      onSectionChange={handleSectionChange}
      featureAccess={{
        canSetDefaultPreferences: featureAccess.canSetDefaultPreferences,
        canBackupRestore: featureAccess.canBackupRestore,
        canUploadProfilePicture: featureAccess.canUploadProfilePicture,
        canUseHealthConditions: featureAccess.canUseHealthConditions,
        canUseHealthGoals: featureAccess.canUseHealthGoals,
        availableDietaryFilters: featureAccess.availableDietaryFilters,
        currentPlan: featureAccess.currentPlan
      }}
    />
  );
}
