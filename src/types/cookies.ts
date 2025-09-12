export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
}

export interface CookieConsentData {
  preferences: CookiePreferences;
  timestamp: number;
  version: string;
}