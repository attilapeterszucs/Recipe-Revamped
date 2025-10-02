import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Shield, Eye, Settings, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import type { CookiePreferences } from '../types/cookies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        onClick={() => currentView === 'detailed' ? setCurrentView('banner') : undefined}
      />

      {/* Cookie Consent Popup */}
      <div className="relative w-full max-w-4xl mx-4 mb-4 pointer-events-auto">
        <Card className="shadow-2xl overflow-hidden">
          {currentView === 'banner' ? (
            // Simple Banner View
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full p-2 mr-3">
                    <Cookie className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">We value your privacy</h2>
                    <p className="text-sm text-gray-600">Choose how we use cookies to improve your experience</p>
                  </div>
                </div>
                {/* Removed dismiss button - consent is required */}
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-700 mb-3 leading-relaxed">
                  We use cookies for essential functionality, preferences, analytics, and advertising. Recipe processing uses OpenAI with automatic consent for AI data sharing.
                  <strong className="text-green-700 font-bold"> We also share analytics data with Google Ads for personalized advertising.</strong>
                </p>

                {/* Privacy Highlights */}
                <div className="space-y-3 mb-4">
                  <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm">
                    <Shield className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm">
                      <span className="font-bold">Privacy compliance:</span>
                      <span className="ml-1 font-medium">GDPR, CCPA, VCDPA & US state privacy laws</span>
                    </AlertDescription>
                  </Alert>

                  <Alert className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-sm">
                    <Info className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      <span className="font-bold">Data sharing:</span>
                      <span className="ml-1 font-medium">Google Analytics + Ads for personalized advertising • OpenAI for recipe generation</span>
                    </AlertDescription>
                  </Alert>

                  <Alert className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-sm">
                      <span className="font-bold">US residents:</span>
                      <span className="ml-1 font-medium">This may constitute "sale/sharing" under CCPA • You can opt-out anytime</span>
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Quick Options */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Essential cookies are always active</span>
                  <Button
                    variant="link"
                    onClick={() => setCurrentView('detailed')}
                    className="h-auto p-0 text-green-600 hover:text-green-700 font-bold"
                  >
                    Customize settings
                    <Settings className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105"
                >
                  Accept all cookies
                </Button>
                <Button
                  onClick={handleRejectAll}
                  variant="outline"
                  className="flex-1 border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 font-semibold transition-all duration-300"
                >
                  Reject optional cookies
                </Button>
              </div>

              {/* Legal Links */}
              <Separator className="mt-4" />
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                <Link to="/privacy" className="hover:text-green-700 transition-colors underline text-green-600 font-medium">Privacy Policy</Link>
                <Link to="/cookies" className="hover:text-green-700 transition-colors underline text-green-600 font-medium">Cookie Policy</Link>
                <Link to="/terms" className="hover:text-green-700 transition-colors underline text-green-600 font-medium">Terms of Service</Link>
                <span>•</span>
                <span>Your choices will be saved for 6 months</span>
              </div>
            </CardContent>
          ) : (
            // Detailed Settings View
            <div className="max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <CardHeader className="sticky top-0 bg-background border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentView('banner')}
                      className="mr-2"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <div>
                      <CardTitle className="text-xl">Cookie Settings</CardTitle>
                      <CardDescription>Manage your cookie preferences</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Info className="w-4 h-4 mr-1" />
                    GDPR, CCPA & US State Law Compliant
                  </Badge>
                </div>
              </CardHeader>

              {/* Cookie Categories */}
              <CardContent className="p-6 space-y-6">
                {/* Essential Cookies */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-3">
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
                <Card className="border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <Eye className="w-6 h-6 text-purple-600 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold">Analytics Cookies</CardTitle>
                            <Switch
                              checked={preferences.analytics}
                              onCheckedChange={() => togglePreference('analytics')}
                            />
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
                <Card className="border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <Settings className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold">Preference Cookies</CardTitle>
                            <Switch
                              checked={preferences.preferences}
                              onCheckedChange={() => togglePreference('preferences')}
                            />
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
                <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <AlertTriangle className="w-6 h-6 text-red-600 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold">Marketing/Advertising Cookies</CardTitle>
                            <Switch
                              checked={preferences.marketing}
                              onCheckedChange={() => togglePreference('marketing')}
                            />
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
                <Alert className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 shadow-md">
                  <Info className="w-4 h-4 text-yellow-600" />
                  <AlertDescription>
                    <h4 className="font-bold text-gray-900 mb-2">
                      Third-Party Services
                    </h4>
                    <p className="text-gray-700 text-sm mb-3 font-medium">
                      We use select third-party services, each with their own privacy policies:
                    </p>
                    <div className="grid md:grid-cols-2 gap-3 text-xs">
                      <Card className="p-2 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <strong className="font-bold text-gray-900">Firebase (Google):</strong> <span className="text-gray-700">Authentication & secure data storage</span>
                      </Card>
                      <Card className="p-2 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <strong className="font-bold text-gray-900">Google Analytics & Ads:</strong> <span className="text-gray-700">Usage analytics & personalized advertising</span>
                      </Card>
                      <Card className="p-2 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <strong className="font-bold text-gray-900">OpenAI:</strong> <span className="text-gray-700">AI-powered recipe generation & processing</span>
                      </Card>
                      <Card className="p-2 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <strong className="font-bold text-gray-900">Netlify:</strong> <span className="text-gray-700">Website hosting & content delivery</span>
                      </Card>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-background border-t p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSavePreferences}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105"
                  >
                    Save my preferences
                  </Button>
                  <Button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105"
                  >
                    Accept all
                  </Button>
                  <Button
                    onClick={handleRejectAll}
                    variant="outline"
                    className="flex-1 border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 font-semibold transition-all duration-300"
                  >
                    Reject optional
                  </Button>
                </div>

                {/* Legal Compliance Info */}
                <Separator className="mt-4" />
                <div className="mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex flex-wrap gap-3">
                      <Link to="/privacy" className="hover:text-green-700 transition-colors underline text-green-600 font-medium">Privacy Policy</Link>
                      <Link to="/cookies" className="hover:text-green-700 transition-colors underline text-green-600 font-medium">Cookie Policy</Link>
                      <Link to="/terms" className="hover:text-green-700 transition-colors underline text-green-600 font-medium">Terms of Service</Link>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        GDPR & CCPA Rights
                      </Badge>
                      <span className="hidden sm:inline">•</span>
                      <span>Consent expires in 6 months</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};