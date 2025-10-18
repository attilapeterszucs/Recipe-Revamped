import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Cookie, Shield, Eye, Settings, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import type { CookiePreferences } from '../types/cookies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface CookieConsentProps {
  onAcceptAll: (preferences: CookiePreferences) => void;
  onSavePreferences: (preferences: CookiePreferences) => void;
  onReject: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({
  onAcceptAll,
  onSavePreferences,
  onReject
}) => {
  const [currentView, setCurrentView] = useState<'banner' | 'detailed'>('banner');

  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    preferences: true, // Default to true for better UX
    marketing: false // Default to false - user must explicitly opt-in to advertising
  });

  // Lock body scroll when cookie consent is displayed
  useBodyScrollLock(true);

  // Component is only rendered when consent is needed (controlled by parent)

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      preferences: true,
      marketing: true // Accept all includes marketing/advertising cookies
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        // Prevent closing when clicking the modal content
        if (e.target === e.currentTarget && currentView === 'banner') {
          // Allow closing by clicking backdrop only in banner view
          handleRejectAll();
        }
      }}
    >
      {/* Cookie Consent Banner */}
      <div
        className="w-full max-w-7xl px-4 sm:px-6 py-3 sm:py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="shadow-xl shadow-green-500/10 overflow-hidden rounded-xl sm:rounded-2xl border-2 border-green-200 bg-white">
          {currentView === 'banner' ? (
            // Slim Banner View
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                {/* Icon & Message */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex-shrink-0">
                    <Cookie className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      We use cookies to enhance your experience. By continuing, you consent to our use of cookies.
                      {' '}
                      <Button
                        variant="link"
                        onClick={() => setCurrentView('detailed')}
                        className="h-auto p-0 text-green-600 hover:text-green-700 font-bold text-xs sm:text-sm inline underline"
                      >
                        Customize
                      </Button>
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-shrink-0">
                  <Button
                    onClick={handleRejectAll}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 font-semibold transition-all duration-300 text-xs sm:text-sm min-h-[44px] sm:min-h-[40px] rounded-lg"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={handleAcceptAll}
                    size="sm"
                    className="flex-1 sm:flex-initial bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 text-xs sm:text-sm min-h-[44px] sm:min-h-[40px] rounded-lg"
                  >
                    Accept All
                  </Button>
                </div>
              </div>
            </CardContent>
          ) : (
            // Detailed Settings View
            <div className="max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <CardHeader className="sticky top-0 bg-white border-b-2 border-green-200 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentView('banner')}
                      className="hover:bg-green-50 hover:text-green-600 transition-colors rounded-xl"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl font-black text-gray-900">Cookie Settings</CardTitle>
                      <CardDescription className="text-sm text-gray-600">Manage your cookie preferences</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs font-semibold border-0 hidden sm:flex">
                    <Shield className="w-3 h-3 mr-1" />
                    Privacy Protected
                  </Badge>
                </div>
              </CardHeader>

              {/* Cookie Categories */}
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Essential Cookies */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 rounded-xl">
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <Shield className="w-6 h-6 text-green-600 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold">Essential Cookies</CardTitle>
                            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Always Active
                            </Badge>
                          </div>
                          <CardDescription className="text-sm mt-1 mb-3 text-gray-700">
                            Required for authentication, security, and basic website functionality. Cannot be disabled.
                          </CardDescription>
                          <div className="text-xs text-gray-600">
                            <strong className="font-bold">Examples:</strong> Login sessions, security tokens, form submissions
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Analytics Cookies */}
                <Card className="border-2 border-gray-200 shadow-md hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-0.5 rounded-xl">
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <Eye className="w-6 h-6 text-purple-600 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-lg font-bold">Analytics Cookies</CardTitle>
                            <div className="p-2 -m-2">
                              <Switch
                                checked={preferences.analytics}
                                onCheckedChange={() => togglePreference('analytics')}
                              />
                            </div>
                          </div>
                          <CardDescription className="text-sm mt-1 mb-3 text-gray-700">
                            Help us understand how you use our service to improve performance and user experience.
                          </CardDescription>
                          <div className="text-xs text-gray-600 mb-2">
                            <strong className="font-bold">Google Analytics + Ads:</strong> Page views, user behavior, demographics, advertising measurement
                          </div>
                          <Alert className="border-2 border-gray-200 bg-gray-50">
                            <AlertDescription className="text-xs text-gray-700">
                              <strong className="font-bold">Data sharing:</strong> Analytics data shared with Google Ads for personalized advertising • You can opt-out anytime
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Preference Cookies */}
                <Card className="border-2 border-gray-200 shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-0.5 rounded-xl">
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <Settings className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-lg font-bold">Preference Cookies</CardTitle>
                            <div className="p-2 -m-2">
                              <Switch
                                checked={preferences.preferences}
                                onCheckedChange={() => togglePreference('preferences')}
                              />
                            </div>
                          </div>
                          <CardDescription className="text-sm mt-1 mb-3 text-gray-700">
                            Remember your settings, preferences, and choices to provide a personalized experience.
                          </CardDescription>
                          <div className="text-xs text-gray-600 mb-2">
                            <strong className="font-bold">What we remember:</strong> Theme preferences, dietary filter selections, UI settings
                          </div>
                          <Alert className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-sm">
                            <AlertDescription className="text-xs text-blue-700">
                              <strong className="font-bold">Recommended:</strong> Enables a more personalized and convenient experience
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Marketing/Advertising Cookies */}
                <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 rounded-xl">
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <AlertTriangle className="w-6 h-6 text-red-600 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-lg font-bold">Marketing/Advertising Cookies</CardTitle>
                            <div className="p-2 -m-2">
                              <Switch
                                checked={preferences.marketing}
                                onCheckedChange={() => togglePreference('marketing')}
                              />
                            </div>
                          </div>
                          <CardDescription className="text-sm mt-1 mb-3 text-gray-700">
                            Enable personalized advertising and measurement through Google Ads integration.
                          </CardDescription>
                          <div className="text-xs text-gray-600 mb-2">
                            <strong className="font-bold">Google Ads Features:</strong> Remarketing, audience targeting, conversion tracking, personalized ads
                          </div>
                          <Alert className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 shadow-sm">
                            <AlertDescription className="text-xs text-amber-700">
                              <strong className="font-bold">US residents:</strong> This constitutes "sale/sharing" under CCPA • You have the right to opt-out • Affects ads you see on Google services
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Third-Party Services Info */}
                <Alert className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl">
                  <Info className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <AlertDescription>
                    <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                      Third-Party Services
                    </h4>
                    <p className="text-gray-700 text-xs sm:text-sm mb-3 font-medium">
                      We use select third-party services, each with their own privacy policies:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                      <Card className="p-2 sm:p-3 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg">
                        <strong className="font-bold text-gray-900">Firebase:</strong> <span className="text-gray-700">Authentication & storage</span>
                      </Card>
                      <Card className="p-2 sm:p-3 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg">
                        <strong className="font-bold text-gray-900">Google Analytics:</strong> <span className="text-gray-700">Usage & advertising</span>
                      </Card>
                      <Card className="p-2 sm:p-3 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg">
                        <strong className="font-bold text-gray-900">OpenAI:</strong> <span className="text-gray-700">AI recipe generation</span>
                      </Card>
                      <Card className="p-2 sm:p-3 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg">
                        <strong className="font-bold text-gray-900">Netlify:</strong> <span className="text-gray-700">Website hosting</span>
                      </Card>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t-2 border-green-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={handleSavePreferences}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-lg min-h-[44px] text-sm"
                  >
                    Save Preferences
                  </Button>
                  <Button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-lg min-h-[44px] text-sm"
                  >
                    Accept All
                  </Button>
                  <Button
                    onClick={handleRejectAll}
                    variant="outline"
                    className="flex-1 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 font-semibold transition-all duration-300 rounded-lg min-h-[44px] text-sm"
                  >
                    Reject Optional
                  </Button>
                </div>

                {/* Legal Compliance Info */}
                <Separator className="mt-4 bg-gray-200" />
                <div className="mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-600">
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <Link to="/privacy" className="hover:text-green-700 transition-colors underline text-green-600 font-semibold">Privacy</Link>
                      <span className="hidden sm:inline text-gray-400">•</span>
                      <Link to="/cookies" className="hover:text-green-700 transition-colors underline text-green-600 font-semibold">Cookies</Link>
                      <span className="hidden sm:inline text-gray-400">•</span>
                      <Link to="/terms" className="hover:text-green-700 transition-colors underline text-green-600 font-semibold">Terms</Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-green-100 text-green-700 text-xs font-semibold border-0">
                        <Shield className="w-3 h-3 mr-1" />
                        GDPR & CCPA
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>,
    document.body
  );
};