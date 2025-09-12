import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Shield, Eye, Settings, X, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import type { CookiePreferences } from '../types/cookies';

interface CookieConsentProps {
  onAcceptAll: (preferences: CookiePreferences) => void;
  onSavePreferences: (preferences: CookiePreferences) => void;
  onReject: () => void;
  onManage?: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({
  onAcceptAll,
  onSavePreferences,
  onReject,
  onManage
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [currentView, setCurrentView] = useState<'banner' | 'detailed'>('banner');
  
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    preferences: true, // Default to true for better UX
    marketing: false // We don't use marketing cookies, but included for completeness
  });

  // Component is only rendered when consent is needed (controlled by parent)

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      preferences: true,
      marketing: false // We don't use marketing cookies
    };
    
    saveConsent(allAccepted);
    onAcceptAll(allAccepted);
  };

  const handleRejectAll = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      preferences: false,
      marketing: false
    };
    
    saveConsent(essentialOnly);
    onReject();
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    onSavePreferences(preferences);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentTimestamp', Date.now().toString());
    localStorage.setItem('cookieConsentVersion', '1.0');
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        onClick={() => currentView === 'detailed' ? setCurrentView('banner') : undefined}
      />
      
      {/* Cookie Consent Popup */}
      <div className="relative w-full max-w-4xl mx-4 mb-4 pointer-events-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {currentView === 'banner' ? (
            // Simple Banner View
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-orange-100 rounded-full p-2 mr-3">
                    <Cookie className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">We value your privacy</h2>
                    <p className="text-sm text-gray-600">Choose how we use cookies to improve your experience</p>
                  </div>
                </div>
                {/* Removed dismiss button - consent is required */}
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  We use cookies to provide essential functionality, remember your preferences, and analyze usage to improve our service. 
                  Recipe processing is powered by OpenAI with automatic consent for AI data sharing.
                </p>
                
                {/* Privacy Highlights */}
                <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-200">
                  <div className="flex items-center text-green-800 text-sm">
                    <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="font-medium">Privacy-focused:</span>
                    <span className="ml-1">Google Analytics only • OpenAI API processing • GDPR & CCPA compliant</span>
                  </div>
                </div>

                {/* Quick Options */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>Essential cookies are always active</span>
                  <button
                    onClick={() => setCurrentView('detailed')}
                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Customize settings
                    <Settings className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Accept all cookies
                </button>
                <button
                  onClick={handleRejectAll}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Reject optional cookies
                </button>
              </div>

              {/* Legal Links */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <Link to="/privacy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
                <Link to="/cookies" className="hover:text-gray-700 transition-colors">Cookie Policy</Link>
                <Link to="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
                <span>•</span>
                <span>Your choices will be saved for 6 months</span>
              </div>
            </div>
          ) : (
            // Detailed Settings View
            <div className="max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={() => setCurrentView('banner')}
                      className="p-2 mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Cookie Settings</h2>
                      <p className="text-sm text-gray-600">Manage your cookie preferences</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Info className="w-4 h-4 mr-1" />
                    GDPR & CCPA Compliant
                  </div>
                </div>
              </div>

              {/* Cookie Categories */}
              <div className="p-6 space-y-6">
                {/* Essential Cookies */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <Shield className="w-6 h-6 text-green-600 mr-3 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Essential Cookies</h3>
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-green-700">Always Active</span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm mt-1 mb-3">
                          Required for authentication, security, and basic website functionality. Cannot be disabled.
                        </p>
                        <div className="text-xs text-gray-600">
                          <strong>Examples:</strong> Login sessions, security tokens, form submissions
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <Eye className="w-6 h-6 text-purple-600 mr-3 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Analytics Cookies</h3>
                          <button
                            onClick={() => togglePreference('analytics')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              preferences.analytics ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        <p className="text-gray-700 text-sm mt-1 mb-3">
                          Help us understand how you use our service to improve performance and user experience.
                        </p>
                        <div className="text-xs text-gray-600 mb-2">
                          <strong>Google Analytics:</strong> Page views, feature usage, performance metrics (no personal recipe content)
                        </div>
                        <div className="bg-white rounded p-2 text-xs text-gray-600 border border-gray-200">
                          <strong>Privacy protection:</strong> No personal information • No recipe content tracked • Standard Google Analytics data collection
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preference Cookies */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <Settings className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Preference Cookies</h3>
                          <button
                            onClick={() => togglePreference('preferences')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              preferences.preferences ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                preferences.preferences ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        <p className="text-gray-700 text-sm mt-1 mb-3">
                          Remember your settings, preferences, and choices to provide a personalized experience.
                        </p>
                        <div className="text-xs text-gray-600 mb-2">
                          <strong>What we remember:</strong> Theme preferences, dietary filter selections, UI settings
                        </div>
                        <div className="bg-blue-50 rounded p-2 text-xs text-blue-700 border border-blue-200">
                          <strong>Recommended:</strong> Enables a more personalized and convenient experience
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marketing Cookies (Disabled) */}
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <AlertTriangle className="w-6 h-6 text-gray-400 mr-3 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-500">Marketing Cookies</h3>
                          <span className="text-sm font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">Not Used</span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1 mb-3">
                          We don't use marketing or advertising cookies. This category is shown for transparency.
                        </p>
                        <div className="bg-green-100 rounded p-2 text-xs text-green-700 border border-green-200">
                          <strong>Privacy commitment:</strong> No advertising networks • No tracking pixels • No behavioral profiling
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Third-Party Services Info */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Info className="w-5 h-5 text-yellow-600 mr-2" />
                    Third-Party Services
                  </h4>
                  <p className="text-gray-700 text-sm mb-3">
                    We use minimal third-party services, each with their own privacy policies:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white rounded p-2 border border-yellow-200">
                      <strong>Firebase (Google):</strong> Authentication & secure storage
                    </div>
                    <div className="bg-white rounded p-2 border border-yellow-200">
                      <strong>Netlify:</strong> Hosting & content delivery
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Save my preferences
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Accept all
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Reject optional
                  </button>
                </div>

                {/* Legal Compliance Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
                    <div className="flex flex-wrap gap-3">
                      <Link to="/privacy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
                      <Link to="/cookies" className="hover:text-gray-700 transition-colors">Cookie Policy</Link>
                      <Link to="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span>GDPR & CCPA Rights</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Consent expires in 6 months</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};