import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Settings, ArrowLeft, Shield, Heart } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { SEOHead } from '../components/SEOHead';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { db } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

interface UnsubscribeStatus {
  status: 'idle' | 'processing' | 'success' | 'error' | 'already_unsubscribed';
  message?: string;
  isAuthenticated?: boolean;
}

export const Unsubscribe: React.FC = () => {
  const { user, getIdToken } = useAuth();
  const [searchParams] = useSearchParams();
  const [unsubscribeStatus, setUnsubscribeStatus] = useState<UnsubscribeStatus>({ status: 'idle' });
  const [userEmail, setUserEmail] = useState<string>('');

  // Get email from URL parameters (for direct unsubscribe links)
  const emailParam = searchParams.get('email');
  const tokenParam = searchParams.get('token');

  useEffect(() => {
    // Set page title and meta
    document.title = 'Unsubscribe from Recipe Revamped Marketing Emails';

    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Unsubscribe from Recipe Revamped marketing emails and manage your email preferences.');
    if (!metaDescription.parentNode) {
      document.head.appendChild(metaDescription);
    }

    // Auto-unsubscribe if email and token are provided
    if (emailParam && tokenParam) {
      handleDirectUnsubscribe();
    } else if (user) {
      setUserEmail(user.email || '');
      checkCurrentSubscriptionStatus();
    }
  }, [emailParam, tokenParam, user]);

  const checkCurrentSubscriptionStatus = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'userSettings', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Check both structures: new (marketingEmails) and legacy (emailPreferences.marketing)
        const isSubscribed = userData.marketingEmails !== false && userData.emailPreferences?.marketing !== false;

        if (!isSubscribed) {
          setUnsubscribeStatus({
            status: 'already_unsubscribed',
            message: 'You are currently unsubscribed from marketing emails.',
            isAuthenticated: true
          });
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleDirectUnsubscribe = async () => {
    if (!emailParam || !tokenParam) return;

    setUnsubscribeStatus({ status: 'processing' });

    try {
      const EMAIL_SERVICE_URL = 'https://emailservice-428797186446.us-central1.run.app/unsubscribe';

      const response = await fetch(EMAIL_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailParam,
          token: tokenParam
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process unsubscribe request');
      }

      const result = await response.json();

      setUnsubscribeStatus({
        status: 'success',
        message: 'You have been successfully unsubscribed from marketing emails.',
        isAuthenticated: false
      });
      setUserEmail(emailParam);

    } catch (error) {
      console.error('Direct unsubscribe error:', error);
      setUnsubscribeStatus({
        status: 'error',
        message: 'There was an error processing your unsubscribe request. Please try again or contact support.',
        isAuthenticated: false
      });
    }
  };

  const handleAuthenticatedUnsubscribe = async () => {
    if (!user) {
      setUnsubscribeStatus({
        status: 'error',
        message: 'Please sign in to manage your email preferences.',
        isAuthenticated: false
      });
      return;
    }

    setUnsubscribeStatus({ status: 'processing' });

    try {
      // Update user settings in Firestore - update both structures for compatibility
      const userDocRef = doc(db, 'userSettings', user.uid);
      await updateDoc(userDocRef, {
        // Settings page structure (main field)
        'marketingEmails': false,
        'productUpdates': false,
        'featuresAnnouncements': false,
        'promotionalOffers': false,
        // Legacy structure for email service compatibility
        'emailPreferences.marketing': false,
        'emailPreferences.marketingUnsubscribedAt': new Date().toISOString(),
        'emailPreferences.lastUpdated': new Date().toISOString()
      });

      setUnsubscribeStatus({
        status: 'success',
        message: 'You have been successfully unsubscribed from marketing emails.',
        isAuthenticated: true
      });

    } catch (error) {
      console.error('Authenticated unsubscribe error:', error);
      setUnsubscribeStatus({
        status: 'error',
        message: 'There was an error updating your preferences. Please try again.',
        isAuthenticated: true
      });
    }
  };

  const handleResubscribe = async () => {
    if (!user) return;

    setUnsubscribeStatus({ status: 'processing' });

    try {
      const userDocRef = doc(db, 'userSettings', user.uid);
      await updateDoc(userDocRef, {
        // Settings page structure (main field)
        'marketingEmails': true,
        'productUpdates': true,
        'featuresAnnouncements': true,
        'promotionalOffers': true,
        // Legacy structure for email service compatibility
        'emailPreferences.marketing': true,
        'emailPreferences.marketingResubscribedAt': new Date().toISOString(),
        'emailPreferences.lastUpdated': new Date().toISOString()
      });

      setUnsubscribeStatus({
        status: 'idle',
        isAuthenticated: true
      });

    } catch (error) {
      console.error('Resubscribe error:', error);
      setUnsubscribeStatus({
        status: 'error',
        message: 'There was an error updating your preferences. Please try again.',
        isAuthenticated: true
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
      <SEOHead pageKey="unsubscribe" />

      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back to App */}
        <div className="mb-8">
          <Link
            to="/app"
            className="inline-flex items-center text-gray-700 hover:text-green-600 transition-all duration-200 font-semibold group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Recipe Revamped
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden shadow-2xl border-2 border-green-200 rounded-3xl">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 sm:px-8 py-8 relative overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="flex items-start mb-6 relative">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4 shadow-lg ring-2 ring-white/30">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl sm:text-3xl font-black leading-tight drop-shadow-sm">
                      Email Preferences
                    </CardTitle>
                    <CardDescription className="text-green-50 text-base sm:text-lg mt-2 font-semibold">
                      Manage your Recipe Revamped marketing email subscriptions
                    </CardDescription>
                  </div>
                </div>

                {userEmail && (
                  <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white w-fit font-bold shadow-lg ring-2 ring-white/30 px-4 py-2 relative">
                    <Mail className="w-4 h-4 mr-2" />
                    {userEmail}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="p-6 sm:p-8">
                {/* Status Messages */}
                {unsubscribeStatus.status === 'processing' && (
                  <Alert className="mb-6">
                    <Settings className="w-4 h-4 animate-spin" />
                    <AlertDescription>
                      Processing your request...
                    </AlertDescription>
                  </Alert>
                )}

                {unsubscribeStatus.status === 'success' && (
                  <Alert className="mb-6 bg-green-50 border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {unsubscribeStatus.message}
                    </AlertDescription>
                  </Alert>
                )}

                {unsubscribeStatus.status === 'already_unsubscribed' && (
                  <Alert className="mb-6 bg-blue-50 border-blue-200">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      {unsubscribeStatus.message}
                    </AlertDescription>
                  </Alert>
                )}

                {unsubscribeStatus.status === 'error' && (
                  <Alert className="mb-6 bg-red-50 border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {unsubscribeStatus.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Main Content */}
                {user ? (
                  // Authenticated User Interface
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        Marketing Email Preferences
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Choose whether you'd like to receive our weekly recipe newsletters and cooking tips.
                      </p>
                    </div>

                    {/* Email Types */}
                    <div className="space-y-4">
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-start">
                            <Shield className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-green-900">Essential Emails</h4>
                              <p className="text-green-700 text-sm">
                                Account security, password resets, and important service updates.
                              </p>
                              <Badge className="mt-2 bg-green-600">Always Active</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start flex-1">
                              <Heart className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-foreground">Marketing Emails</h4>
                                <p className="text-muted-foreground text-sm">
                                  Weekly recipe newsletters, cooking tips, and feature updates.
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Sent weekly or bi-weekly • You can unsubscribe anytime
                                </p>
                              </div>
                            </div>
                            <div className="ml-4">
                              {unsubscribeStatus.status === 'success' || unsubscribeStatus.status === 'already_unsubscribed' ? (
                                <Button
                                  onClick={handleResubscribe}
                                  variant="outline"
                                  className="border-green-600 text-green-600 hover:bg-green-50"
                                >
                                  Resubscribe
                                </Button>
                              ) : (
                                <Button
                                  onClick={handleAuthenticatedUnsubscribe}
                                  disabled={unsubscribeStatus.status === 'processing'}
                                  variant="outline"
                                  className="border-red-600 text-red-600 hover:bg-red-50"
                                >
                                  Unsubscribe
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  // Non-authenticated Interface
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        Unsubscribe from Marketing Emails
                      </h3>
                      <p className="text-muted-foreground">
                        {emailParam ? (
                          'We are processing your unsubscribe request...'
                        ) : (
                          'To manage your email preferences, please sign in to your account.'
                        )}
                      </p>
                    </div>

                    {!emailParam && (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <Settings className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-blue-900 mb-2">How to Manage Email Preferences</h4>
                              <p className="text-blue-800 text-sm mb-2">
                                You can also manage your marketing email preferences directly in your account:
                              </p>
                              <ol className="text-blue-800 text-sm space-y-1 ml-4">
                                <li className="list-decimal">Sign in to your Recipe Revamped account</li>
                                <li className="list-decimal">Go to <strong>Settings</strong></li>
                                <li className="list-decimal">Navigate to <strong>Notifications</strong></li>
                                <li className="list-decimal">Toggle <strong>Marketing Emails</strong> on/off</li>
                              </ol>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild>
                          <Link to="/signin">
                            Sign In to Manage Preferences
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link to="/contact">
                            Contact Support
                          </Link>
                        </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Why We Send Emails */}
              <Card className="shadow-xl border-2 border-green-200 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-b-2 border-green-200">
                  <CardTitle className="text-lg font-black text-gray-900">Why We Send Emails</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-rose-100 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                        <Heart className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="text-gray-700 font-semibold leading-relaxed">Weekly recipe inspirations tailored to your dietary preferences</span>
                    </div>
                    <div className="flex items-start group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                        <Settings className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700 font-semibold leading-relaxed">New features and cooking tips to enhance your experience</span>
                    </div>
                    <div className="flex items-start group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                        <Shield className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-semibold leading-relaxed">Important account and security updates</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Frequency Information */}
              <Card className="shadow-xl border-2 border-green-200 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-b-2 border-green-200">
                  <CardTitle className="text-lg font-black text-gray-900">Email Frequency</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-700 font-semibold"><strong className="font-black text-gray-900">Marketing Emails:</strong> Weekly or bi-weekly</p>
                    <p className="text-gray-700 font-semibold"><strong className="font-black text-gray-900">Essential Emails:</strong> As needed</p>
                    <p className="text-gray-700 font-semibold"><strong className="font-black text-gray-900">Promotional:</strong> Monthly (opt-in only)</p>
                  </div>
                  <Separator className="my-4 bg-green-200" />
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    We respect your inbox and never spam. You can adjust preferences anytime.
                  </p>
                </CardContent>
              </Card>

              {/* Contact Support */}
              <Card className="shadow-xl border-2 border-green-200 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-b-2 border-green-200">
                  <CardTitle className="text-lg font-black text-gray-900">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-700 mb-4 font-semibold leading-relaxed">
                    Having trouble with your email preferences? Our support team is here to help.
                  </p>
                  <Button variant="outline" asChild className="w-full border-2 border-green-600 text-green-700 hover:bg-green-50 font-bold py-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                    <Link to="/contact">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Support
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};