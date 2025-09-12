// Consent-based storage service that respects user privacy preferences
// Only stores preference data when user has consented to preference cookies

interface StorageItem {
  value: any;
  timestamp: number;
  expiresAt?: number;
}

class ConsentBasedStorage {
  private hasPreferenceConsent = false;

  constructor() {
    // Listen for cookie consent changes
    if (typeof window !== 'undefined') {
      window.addEventListener('cookieConsentUpdated', (event: any) => {
        const preferences = event.detail.preferences;
        this.updateConsent(preferences.preferences);
      });

      // Check initial consent status
      this.checkInitialConsent();
    }
  }

  private checkInitialConsent() {
    try {
      const storedConsent = localStorage.getItem('cookieConsent');
      const timestamp = localStorage.getItem('cookieConsentTimestamp');
      const version = localStorage.getItem('cookieConsentVersion');

      if (storedConsent && timestamp && version) {
        const preferences = JSON.parse(storedConsent);
        const consentTimestamp = parseInt(timestamp);
        
        // Check if consent is still valid (6 months)
        const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
        const isValid = consentTimestamp > sixMonthsAgo && version === '1.0';
        
        if (isValid) {
          this.hasPreferenceConsent = preferences.preferences;
        }
      }
    } catch (error) {
      // Error checking consent, default to no consent
      this.hasPreferenceConsent = false;
    }
  }

  private updateConsent(preferenceConsent: boolean) {
    const previousConsent = this.hasPreferenceConsent;
    this.hasPreferenceConsent = preferenceConsent;

    if (!preferenceConsent && previousConsent) {
      // Consent revoked - clear preference data
      this.clearAllPreferences();
    }
  }

  private clearAllPreferences() {
    if (typeof window === 'undefined') return;

    // List of preference keys that should be cleared when consent is revoked
    const preferenceKeys = [
      'recipeTheme',
      'defaultFilters',
      'userPreferences',
      'savedViewMode',
      'collapsedSections',
      'tooltipSettings',
      'displayPreferences',
      'uiSettings'
    ];

    preferenceKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        // Ignore errors when clearing preferences
      }
    });
  }

  /**
   * Set a preference item (only if consent is given)
   */
  setPreference(key: string, value: any, expirationDays?: number): boolean {
    if (!this.hasPreferenceConsent) {
      return false;
    }

    if (typeof window === 'undefined') return false;

    try {
      const item: StorageItem = {
        value,
        timestamp: Date.now(),
        expiresAt: expirationDays ? Date.now() + (expirationDays * 24 * 60 * 60 * 1000) : undefined
      };

      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a preference item (only if consent is given)
   */
  getPreference<T = any>(key: string, defaultValue?: T): T | undefined {
    if (!this.hasPreferenceConsent) {
      return defaultValue;
    }

    if (typeof window === 'undefined') return defaultValue;

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;

      const item: StorageItem = JSON.parse(stored);
      
      // Check if item has expired
      if (item.expiresAt && Date.now() > item.expiresAt) {
        localStorage.removeItem(key);
        return defaultValue;
      }

      return item.value;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Remove a preference item
   */
  removePreference(key: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if preference storage is allowed
   */
  isPreferenceStorageAllowed(): boolean {
    return this.hasPreferenceConsent;
  }

  /**
   * Set user theme preference
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): boolean {
    return this.setPreference('recipeTheme', theme);
  }

  /**
   * Get user theme preference
   */
  getTheme(): 'light' | 'dark' | 'auto' | undefined {
    return this.getPreference('recipeTheme', 'auto');
  }

  /**
   * Set default dietary filters
   */
  setDefaultFilters(filters: string[]): boolean {
    return this.setPreference('defaultFilters', filters);
  }

  /**
   * Get default dietary filters
   */
  getDefaultFilters(): string[] {
    return this.getPreference('defaultFilters', []);
  }

  /**
   * Set UI preferences
   */
  setUIPreference(key: string, value: any): boolean {
    const current = this.getPreference('uiSettings', {});
    return this.setPreference('uiSettings', { ...current, [key]: value });
  }

  /**
   * Get UI preference
   */
  getUIPreference<T = any>(key: string, defaultValue?: T): T {
    const uiSettings = this.getPreference('uiSettings', {});
    return uiSettings[key] !== undefined ? uiSettings[key] : defaultValue;
  }
}

// Export singleton instance
export const consentStorage = new ConsentBasedStorage();

// Export helper functions for common operations
export const setTheme = (theme: 'light' | 'dark' | 'auto') => consentStorage.setTheme(theme);
export const getTheme = () => consentStorage.getTheme();
export const setDefaultFilters = (filters: string[]) => consentStorage.setDefaultFilters(filters);
export const getDefaultFilters = () => consentStorage.getDefaultFilters();
export const isPreferenceStorageAllowed = () => consentStorage.isPreferenceStorageAllowed();