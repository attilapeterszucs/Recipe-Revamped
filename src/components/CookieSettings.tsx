import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Shield, Eye, Settings, Check, X, RotateCcw, Info } from 'lucide-react';
import { useCookieContext } from '../contexts/CookieContext';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <div className="bg-orange-100 rounded-full p-3 mr-4">
          <Cookie className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cookie Settings</h2>
          <p className="text-muted-foreground">Manage your privacy preferences</p>
        </div>
      </div>

      {/* Consent Status */}
      {hasConsent && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="w-4 h-4 text-green-600" />
          <AlertDescription>
            <div className="flex items-start justify-between w-full">
              <div>
                <p className="font-medium text-green-800">
                  Cookie preferences saved
                </p>
                <p className="text-sm text-green-600">
                  {consentTimestamp && `Set on ${formatDate(consentTimestamp)}`}
                  {consentAge && ` (${consentAge} days ago)`}
                </p>
              </div>
              {isStale && (
                <Badge variant="outline" className="bg-yellow-100 border-yellow-200 text-yellow-800">
                  Needs refresh
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Cookie Categories */}
      <div className="space-y-4">
        {/* Essential Cookies */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <Shield className="w-6 h-6 text-green-600 mr-3 mt-0.5" />
                <div>
                  <CardTitle className="text-lg">Essential Cookies</CardTitle>
                  <CardDescription className="text-sm">
                    Required for authentication, security, and basic website functionality. Cannot be disabled.
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-1" />
                Always Active
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Analytics Cookies */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1">
                <Eye className="w-6 h-6 text-purple-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">Analytics Cookies</CardTitle>
                    <Switch
                      checked={preferences.analytics}
                      onCheckedChange={() => handleToggle('analytics')}
                    />
                  </div>
                  <CardDescription className="text-sm mb-2">
                    Help us understand how you use our service to improve performance and user experience.
                  </CardDescription>
                  <div className="text-xs text-muted-foreground">
                    Data anonymized after 90 days • No personal recipe content tracked
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Preference Cookies */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1">
                <Settings className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">Preference Cookies</CardTitle>
                    <Switch
                      checked={preferences.preferences}
                      onCheckedChange={() => handleToggle('preferences')}
                    />
                  </div>
                  <CardDescription className="text-sm mb-2">
                    Remember your settings, preferences, and choices to provide a personalized experience.
                  </CardDescription>
                  <div className="text-xs text-muted-foreground">
                    Theme preferences • Dietary filter selections • UI settings
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Marketing Cookies (Disabled) */}
        <Card className="bg-muted/30 opacity-75">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1">
                <X className="w-6 h-6 text-muted-foreground mr-3 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg text-muted-foreground">Marketing Cookies</CardTitle>
                    <Badge variant="secondary">
                      Not Used
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    We don't use marketing or advertising cookies.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSave}
            className="flex-1"
          >
            Save Preferences
          </Button>
          <Button
            onClick={acceptAll}
            variant="default"
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Accept All
          </Button>
          <Button
            onClick={rejectAll}
            variant="outline"
            className="flex-1"
          >
            Essential Only
          </Button>
        </div>

        {/* Additional Actions */}
        <div className="flex justify-start">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Settings
          </Button>
        </div>
      </div>

      {/* Information Panel */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-2">Important Information</h4>
            <ul className="text-sm text-foreground space-y-1">
              <li>• Your preferences are stored locally and will expire after 6 months</li>
              <li>• Essential cookies are always active to ensure proper functionality</li>
              <li>• We never use tracking or advertising cookies</li>
              <li>• All recipe processing happens locally in your browser</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <Link to="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</Link>
              <Link to="/cookies" className="text-blue-600 hover:text-blue-700 underline">Cookie Policy</Link>
              <Link to="/terms" className="text-blue-600 hover:text-blue-700 underline">Terms of Service</Link>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Technical Details */}
      {hasConsent && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Consent version: {CURRENT_VERSION}</span>
            {consentTimestamp && (
              <span>Last updated: {formatDate(consentTimestamp)}</span>
            )}
            <Badge variant="outline" className="text-xs">
              GDPR & CCPA Compliant
            </Badge>
          </div>
        </>
      )}
    </div>
  );
};