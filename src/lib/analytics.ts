// Consent-based analytics service that respects user privacy preferences
// Only tracks when user has explicitly consented to analytics cookies

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

class AnalyticsService {
  private hasConsent = false;
  private consentCheckCallbacks: (() => void)[] = [];

  constructor() {
    // Listen for cookie consent changes
    if (typeof window !== 'undefined') {
      window.addEventListener('cookieConsentUpdated', (event: any) => {
        const preferences = event.detail.preferences;
        this.updateConsent(preferences.analytics);
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
          this.updateConsent(preferences.analytics);
        }
      }
    } catch (error) {
      // Error checking consent, default to no consent
      this.hasConsent = false;
    }
  }

  private updateConsent(analyticsConsent: boolean) {
    const previousConsent = this.hasConsent;
    this.hasConsent = analyticsConsent;

    if (analyticsConsent && !previousConsent) {
      // Consent granted - initialize analytics
      this.initializeAnalytics();
    } else if (!analyticsConsent && previousConsent) {
      // Consent revoked - disable analytics
      this.disableAnalytics();
    }

    // Execute any waiting callbacks
    this.consentCheckCallbacks.forEach(callback => callback());
    this.consentCheckCallbacks = [];
  }

  private initializeAnalytics() {
    if (typeof window === 'undefined') return;

    // Initialize Google Analytics if consent is given
    if (!window.gtag?.loaded) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-CR787RJ2VK';
      document.head.appendChild(script);
      
      script.onload = () => {
        window.gtag('js', new Date());
        window.gtag('config', 'G-CR787RJ2VK', {
          'anonymize_ip': false,
          'allow_google_signals': true,
          'allow_ad_personalization_signals': false
        });
        (window.gtag as any).loaded = true;
      };
    }
  }

  private disableAnalytics() {
    if (typeof window === 'undefined' || !window.gtag) return;

    // Disable Google Analytics
    window.gtag('config', 'G-CR787RJ2VK', {
      'anonymize_ip': true,
      'storage': 'none',
      'ad_storage': 'denied',
      'analytics_storage': 'denied',
      'allow_google_signals': false,
      'allow_ad_personalization_signals': false
    });
  }

  /**
   * Track page views (only if consent is given)
   */
  trackPageView(page: string, title?: string) {
    if (!this.hasConsent) return;

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-CR787RJ2VK', {
        page_title: title || document.title,
        page_location: window.location.href,
        page_path: page
      });
    }
  }

  /**
   * Track events (only if consent is given)
   */
  trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (!this.hasConsent) return;

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        ...parameters,
        // Ensure no personal data is included
        anonymize_ip: true
      });
    }
  }

  /**
   * Track recipe conversion (only if consent is given)
   */
  trackRecipeConversion(recipeType: 'convert' | 'create' | 'surprise', filters?: string[]) {
    if (!this.hasConsent) return;

    this.trackEvent('recipe_conversion', {
      recipe_type: recipeType,
      filter_count: filters?.length || 0,
      // Don't track actual filter values to protect privacy
      event_category: 'recipe',
      event_label: recipeType
    });
  }

  /**
   * Track user engagement (only if consent is given)
   */
  trackEngagement(action: string, category: string, label?: string, value?: number) {
    if (!this.hasConsent) return;

    this.trackEvent(action, {
      event_category: category,
      event_label: label,
      value: value,
      anonymize_ip: true
    });
  }

  /**
   * Check if analytics tracking is allowed
   */
  isTrackingAllowed(): boolean {
    return this.hasConsent;
  }

  /**
   * Execute callback when consent status is determined
   */
  onConsentReady(callback: () => void) {
    if (this.hasConsent !== undefined) {
      callback();
    } else {
      this.consentCheckCallbacks.push(callback);
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export helper functions
export const trackPageView = (page: string, title?: string) => analytics.trackPageView(page, title);
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => analytics.trackEvent(eventName, parameters);
export const trackRecipeConversion = (recipeType: 'convert' | 'create' | 'surprise', filters?: string[]) => 
  analytics.trackRecipeConversion(recipeType, filters);
export const isTrackingAllowed = () => analytics.isTrackingAllowed();