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
                  <div className="bg-orange-100 rounded-full p-2 mr-3">
                    <Cookie className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">We value your privacy</h2>
                    <p className="text-sm text-muted-foreground">Choose how we use cookies to improve your experience</p>
                  </div>
                </div>
                {/* Removed dismiss button - consent is required */}
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-foreground mb-3">
                  We use cookies for essential functionality, preferences, analytics, and advertising. Recipe processing uses OpenAI with automatic consent for AI data sharing.
                  <strong className="text-red-600"> We also share analytics data with Google Ads for personalized advertising.</strong>
                </p>

                {/* Privacy Highlights */}
                <div className="space-y-3 mb-4">
                  <Alert className="bg-green-50 border-green-200">
                    <Shield className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm">
                      <span className="font-medium">Privacy compliance:</span>
                      <span className="ml-1">GDPR, CCPA, VCDPA & US state privacy laws</span>
                    </AlertDescription>
                  </Alert>

                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      <span className="font-medium">Data sharing:</span>
                      <span className="ml-1">Google Analytics + Ads for personalized advertising • OpenAI for recipe generation</span>
                    </AlertDescription>
                  </Alert>

                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-sm">
                      <span className="font-medium">US residents:</span>
                      <span className="ml-1">This may constitute "sale/sharing" under CCPA • You can opt-out anytime</span>
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Quick Options */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Essential cookies are always active</span>
                  <Button
                    variant="link"
                    onClick={() => setCurrentView('detailed')}
                    className="h-auto p-0 text-blue-600 hover:text-blue-700 font-medium"
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
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Accept all cookies
                </Button>
                <Button
                  onClick={handleRejectAll}
                  variant="outline"
                  className="flex-1"
                >
                  Reject optional cookies
                </Button>
              </div>

              {/* Legal Links */}
              <Separator className="mt-4" />
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                <Link to="/privacy" className="hover:text-foreground transition-colors underline">Privacy Policy</Link>
                <Link to="/cookies" className="hover:text-foreground transition-colors underline">Cookie Policy</Link>
                <Link to="/terms" className="hover:text-foreground transition-colors underline">Terms of Service</Link>
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
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <Shield className="w-6 h-6 text-green-600 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Essential Cookies</CardTitle>
                            <Badge className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Always Active
                            </Badge>
                          </div>
                          <CardDescription className="text-sm mt-1 mb-3">
                            Required for authentication, security, and basic website functionality. Cannot be disabled.
                          </CardDescription>
                          <div className="text-xs text-muted-foreground">
                            <strong>Examples:</strong> Login sessions, security tokens, form submissions
                          </div>
                        </div>
                      </div>
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
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Analytics Cookies</CardTitle>
                            <Switch
                              checked={preferences.analytics}
                              onCheckedChange={() => togglePreference('analytics')}
                            />
                          </div>
                          <CardDescription className="text-sm mt-1 mb-3">
                            Help us understand how you use our service to improve performance and user experience.
                          </CardDescription>
                          <div className="text-xs text-muted-foreground mb-2">
                            <strong>Google Analytics + Ads:</strong> Page views, user behavior, demographics, advertising measurement
                          </div>
                          <Alert className="border-muted">
                            <AlertDescription className="text-xs">
                              <strong>Data sharing:</strong> Analytics data shared with Google Ads for personalized advertising • You can opt-out anytime
                            </AlertDescription>
                          </Alert>
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
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Preference Cookies</CardTitle>
                            <Switch
                              checked={preferences.preferences}
                              onCheckedChange={() => togglePreference('preferences')}
                            />
                          </div>
                          <CardDescription className="text-sm mt-1 mb-3">
                            Remember your settings, preferences, and choices to provide a personalized experience.
                          </CardDescription>
                          <div className="text-xs text-muted-foreground mb-2">
                            <strong>What we remember:</strong> Theme preferences, dietary filter selections, UI settings
                          </div>
                          <Alert className="bg-blue-50 border-blue-200">
                            <AlertDescription className="text-xs text-blue-700">
                              <strong>Recommended:</strong> Enables a more personalized and convenient experience
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Marketing/Advertising Cookies */}
                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <AlertTriangle className="w-6 h-6 text-red-600 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Marketing/Advertising Cookies</CardTitle>
                            <Switch
                              checked={preferences.marketing}
                              onCheckedChange={() => togglePreference('marketing')}
                            />
                          </div>
                          <CardDescription className="text-sm mt-1 mb-3">
                            Enable personalized advertising and measurement through Google Ads integration.
                          </CardDescription>
                          <div className="text-xs text-muted-foreground mb-2">
                            <strong>Google Ads Features:</strong> Remarketing, audience targeting, conversion tracking, personalized ads
                          </div>
                          <Alert className="bg-amber-50 border-amber-200">
                            <AlertDescription className="text-xs text-amber-700">
                              <strong>US residents:</strong> This constitutes "sale/sharing" under CCPA • You have the right to opt-out • Affects ads you see on Google services
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Third-Party Services Info */}
                <Alert className="bg-yellow-50 border-yellow-200">
                  <Info className="w-4 h-4 text-yellow-600" />
                  <AlertDescription>
                    <h4 className="font-semibold text-foreground mb-2">
                      Third-Party Services
                    </h4>
                    <p className="text-foreground text-sm mb-3">
                      We use select third-party services, each with their own privacy policies:
                    </p>
                    <div className="grid md:grid-cols-2 gap-3 text-xs">
                      <Card className="p-2">
                        <strong>Firebase (Google):</strong> Authentication & secure data storage
                      </Card>
                      <Card className="p-2">
                        <strong>Google Analytics & Ads:</strong> Usage analytics & personalized advertising
                      </Card>
                      <Card className="p-2">
                        <strong>OpenAI:</strong> AI-powered recipe generation & processing
                      </Card>
                      <Card className="p-2">
                        <strong>Netlify:</strong> Website hosting & content delivery
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
                    className="flex-1"
                  >
                    Save my preferences
                  </Button>
                  <Button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Accept all
                  </Button>
                  <Button
                    onClick={handleRejectAll}
                    variant="outline"
                    className="flex-1"
                  >
                    Reject optional
                  </Button>
                </div>

                {/* Legal Compliance Info */}
                <Separator className="mt-4" />
                <div className="mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex flex-wrap gap-3">
                      <Link to="/privacy" className="hover:text-foreground transition-colors underline">Privacy Policy</Link>
                      <Link to="/cookies" className="hover:text-foreground transition-colors underline">Cookie Policy</Link>
                      <Link to="/terms" className="hover:text-foreground transition-colors underline">Terms of Service</Link>
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