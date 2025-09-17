import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Shield, Eye, Settings, Check, X, RotateCcw, Info } from 'lucide-react';
import { useCookieContext } from '../contexts/CookieContext';

export const CookieSettings: React.FC = () => {
  const {
    preferences,
    hasConsent,
    consentTimestamp,
    updatePreference,
    saveCurrentPreferences,
    clearConsent,
    acceptAll,
    rejectAll,
    getConsentAge,
    needsRefresh,
    CURRENT_VERSION
  } = useCookieContext();

  const consentAge = getConsentAge();
  const isStale = needsRefresh();

  const handleToggle = (key: keyof typeof preferences) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled
    updatePreference(key, !preferences[key]);
  };

  const handleSave = () => {
    saveCurrentPreferences();
    // Show confirmation
    const event = new CustomEvent('showToast', {
      detail: { message: 'Cookie preferences saved successfully!', type: 'success' }
    });
    window.dispatchEvent(event);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your cookie preferences? This will clear your current settings.')) {
      clearConsent();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="bg-orange-100 rounded-full p-3 mr-4">
          <Cookie className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cookie Settings</h2>
          <p className="text-gray-600">Manage your privacy preferences</p>
        </div>
      </div>

      {/* Consent Status */}
      {hasConsent && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="font-medium text-green-800">
                  Cookie preferences saved
                </p>
                <p className="text-sm text-green-600">
                  {consentTimestamp && `Set on ${formatDate(consentTimestamp)}`}
                  {consentAge && ` (${consentAge} days ago)`}
                </p>
              </div>
            </div>
            {isStale && (
              <div className="bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200">
                <span className="text-xs font-medium text-yellow-800">
                  Needs refresh
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cookie Categories */}
      <div className="space-y-6 mb-8">
        {/* Essential Cookies */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <Shield className="w-6 h-6 text-green-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Essential Cookies</h3>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-700">Always Active</span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">
                  Required for authentication, security, and basic website functionality. Cannot be disabled.
                </p>
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Analytics Cookies</h3>
                  <button
                    onClick={() => handleToggle('analytics')}
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
                <p className="text-gray-700 text-sm mb-2">
                  Help us understand how you use our service to improve performance and user experience.
                </p>
                <div className="text-xs text-gray-600">
                  Data anonymized after 90 days • No personal recipe content tracked
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Preference Cookies</h3>
                  <button
                    onClick={() => handleToggle('preferences')}
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
                <p className="text-gray-700 text-sm mb-2">
                  Remember your settings, preferences, and choices to provide a personalized experience.
                </p>
                <div className="text-xs text-gray-600">
                  Theme preferences • Dietary filter selections • UI settings
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Cookies (Disabled) */}
        <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 opacity-75">
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <X className="w-6 h-6 text-gray-400 mr-3 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-500">Marketing Cookies</h3>
                  <span className="text-sm font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">Not Used</span>
                </div>
                <p className="text-gray-600 text-sm">
                  We don't use marketing or advertising cookies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Save Preferences
        </button>
        <button
          onClick={acceptAll}
          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Accept All
        </button>
        <button
          onClick={rejectAll}
          className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          Essential Only
        </button>
      </div>

      {/* Additional Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={handleReset}
          className="flex items-center justify-center px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Settings
        </button>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">Important Information</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Your preferences are stored locally and will expire after 6 months</li>
              <li>• Essential cookies are always active to ensure proper functionality</li>
              <li>• We never use tracking or advertising cookies</li>
              <li>• All recipe processing happens locally in your browser</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <Link to="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link>
              <Link to="/cookies" className="text-blue-600 hover:text-blue-700">Cookie Policy</Link>
              <Link to="/terms" className="text-blue-600 hover:text-blue-700">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      {hasConsent && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span>Consent version: {CURRENT_VERSION}</span>
            {consentTimestamp && (
              <span>Last updated: {formatDate(consentTimestamp)}</span>
            )}
            <span>GDPR & CCPA Compliant</span>
          </div>
        </div>
      )}
    </div>
  );
};