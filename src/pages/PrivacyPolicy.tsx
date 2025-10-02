import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Database, Eye, Globe, Users, Settings, Mail, MapPin, Calendar, FileText, Zap, Server, CheckCircle } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

export const PrivacyPolicy: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleManageAccount = () => {
    if (user) {
      navigate('/app');
    } else {
      navigate('/signin');
    }
  };

  // Set page title and scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Privacy Policy | Recipe Revamped - Data Protection & Privacy';

    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Learn how Recipe Revamped protects your privacy and data. Comprehensive privacy policy covering data collection, usage, storage, and your rights.');
    if (!metaDescription.parentNode) {
      document.head.appendChild(metaDescription);
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50/30 to-white">
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-20 sm:top-24 shadow-lg shadow-green-100 border-2 border-green-100">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {[
                    { id: 'commitment', title: 'Our Commitment', icon: Shield },
                    { id: 'information', title: 'Information We Collect', icon: Database },
                    { id: 'usage', title: 'How We Use Information', icon: Settings },
                    { id: 'local-processing', title: 'Local Processing Tech', icon: Zap },
                    { id: 'security', title: 'Data Security', icon: Lock },
                    { id: 'sharing', title: 'Information Sharing', icon: Users },
                    { id: 'rights', title: 'Your Rights', icon: CheckCircle },
                    { id: 'cookies', title: 'Cookies & Tracking', icon: Eye },
                    { id: 'international', title: 'International Transfers', icon: Globe },
                    { id: 'contact', title: 'Contact Us', icon: Mail }
                  ].map(({ id, title, icon: Icon }) => (
                    <Button
                      key={id}
                      variant="ghost"
                      onClick={() => scrollToSection(id)}
                      className="flex items-center w-full justify-start text-xs sm:text-sm h-auto py-2 px-2 sm:px-3 hover:bg-green-50 hover:text-green-700"
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      <span className="truncate">{title}</span>
                    </Button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="overflow-hidden shadow-2xl shadow-green-100 border-2 border-green-100">
              {/* Hero Section */}
              <CardHeader className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-500 text-white relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

                <div className="flex items-start sm:items-center mb-3 sm:mb-4 relative z-10">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 mr-2 sm:mr-3 flex-shrink-0" />
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight text-white">Privacy Policy</CardTitle>
                </div>
                <CardDescription className="text-base sm:text-lg lg:text-xl text-white/90 mb-4 sm:mb-6 leading-relaxed relative z-10 font-medium">
                  Your privacy is our priority - built into every line of code
                </CardDescription>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 relative z-10">
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 w-fit border-white/30">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                    Effective: January 1, 2025
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 w-fit border-white/30">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                    Last Updated: January 1, 2025
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 lg:space-y-12">
                {/* Privacy Highlights Banner */}
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl flex items-center">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mr-2" />
                      Privacy at a Glance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="p-4">
                        <Server className="w-8 h-8 text-green-600 mb-2" />
                        <h4 className="font-semibold text-foreground">AI Processing</h4>
                        <p className="text-sm text-muted-foreground">AI-powered recipe conversion with data protection</p>
                      </Card>
                      <Card className="p-4">
                        <Lock className="w-8 h-8 text-blue-600 mb-2" />
                        <h4 className="font-semibold text-foreground">Encrypted Storage</h4>
                        <p className="text-sm text-muted-foreground">All user data securely stored with Firebase encryption</p>
                      </Card>
                      <Card className="p-4">
                        <Eye className="w-8 h-8 text-purple-600 mb-2" />
                        <h4 className="font-semibold text-foreground">Smart Analytics</h4>
                        <p className="text-sm text-muted-foreground">Google Analytics with Ads integration for service optimization</p>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 1: Our Commitment */}
                <section id="commitment" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-green-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground">Our Commitment to Privacy</h2>
                      <p className="text-muted-foreground">Privacy isn't just a feature - it's our foundation</p>
                    </div>
                  </div>
                  <Card className="bg-muted/30">
                    <CardContent className="p-6">
                      <p className="text-sm sm:text-base text-foreground leading-relaxed mb-3 sm:mb-4">
                        At Recipe Revamped, privacy is not just a feature—it's the foundation of our service. We've built our entire
                        architecture around the principle that your recipes and dietary preferences are yours alone.
                      </p>
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <p className="text-green-800 font-semibold">🔒 Privacy-First Architecture</p>
                          <p className="text-green-700 mt-1">This Privacy Policy explains how we achieve maximum privacy and what limited information we do collect to provide you with the best service.</p>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </section>

                {/* Section 2: Information We Collect */}
                <section id="information" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-blue-100 rounded-full p-3 mr-4">
                      <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground">1. Information We Collect</h2>
                      <p className="text-muted-foreground">Only what's necessary to provide our service</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg flex items-center">
                          <Users className="w-5 h-5 text-blue-600 mr-2" />
                          Account Information
                        </CardTitle>
                        <CardDescription>When you create an account, we collect:</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-3">
                          <ul className="space-y-2 text-foreground">
                            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Email address</li>
                            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Password (encrypted and hashed)</li>
                          </ul>
                          <ul className="space-y-2 text-foreground">
                            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Display name (optional)</li>
                            <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" /> Subscription plan information</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg flex items-center">
                          <Server className="w-5 h-5 text-green-600 mr-2" />
                          Recipe Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Card className="bg-green-100 border-green-300 mb-4">
                          <CardContent className="p-4">
                            <p className="text-green-800 font-semibold">🔥 Important: AI Data Processing</p>
                            <p className="text-green-700 mt-1">Free plan users get local processing only (no data sharing). Paid plan users can access cloud-based AI features powered by OpenAI's API, where recipe data and dietary preferences may be processed externally to provide enhanced recipe suggestions. Personal information like email addresses are never shared with third parties.</p>
                          </CardContent>
                        </Card>
                        <p className="text-foreground mb-3">For saved recipes (paid plans only), we store:</p>
                        <div className="grid md:grid-cols-2 gap-3">
                          <ul className="space-y-2 text-foreground">
                            <li className="flex items-center"><Lock className="w-4 h-4 text-green-600 mr-2" /> Recipe title and ingredients (encrypted)</li>
                            <li className="flex items-center"><Lock className="w-4 h-4 text-green-600 mr-2" /> Dietary filters applied</li>
                            <li className="flex items-center"><Lock className="w-4 h-4 text-green-600 mr-2" /> Health conditions (encrypted)</li>
                          </ul>
                          <ul className="space-y-2 text-foreground">
                            <li className="flex items-center"><Lock className="w-4 h-4 text-green-600 mr-2" /> Date saved</li>
                            <li className="flex items-center"><Lock className="w-4 h-4 text-green-600 mr-2" /> User-added notes (encrypted)</li>
                            <li className="flex items-center"><Lock className="w-4 h-4 text-green-600 mr-2" /> Notification preferences</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg flex items-center">
                          <Eye className="w-5 h-5 text-purple-600 mr-2" />
                          Analytics & Advertising Information
                        </CardTitle>
                        <CardDescription>We collect analytics data to improve our service and enable advertising measurement:</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-3 mb-4">
                          <ul className="space-y-2 text-foreground">
                            <li className="flex items-center"><Eye className="w-4 h-4 text-purple-600 mr-2" /> Daily conversion counts and feature usage</li>
                            <li className="flex items-center"><Eye className="w-4 h-4 text-purple-600 mr-2" /> Page views, user flows, and engagement metrics</li>
                            <li className="flex items-center"><Eye className="w-4 h-4 text-purple-600 mr-2" /> Demographic information (age, gender, interests)</li>
                          </ul>
                          <ul className="space-y-2 text-foreground">
                            <li className="flex items-center"><Eye className="w-4 h-4 text-purple-600 mr-2" /> Device and browser information</li>
                            <li className="flex items-center"><Eye className="w-4 h-4 text-purple-600 mr-2" /> Geographic location (city/region level)</li>
                            <li className="flex items-center"><Eye className="w-4 h-4 text-purple-600 mr-2" /> Advertising interaction data</li>
                          </ul>
                        </div>
                        <Card className="bg-amber-50 border-amber-200">
                          <CardContent className="p-4">
                            <p className="text-amber-800 font-semibold">🔗 Google Analytics & Google Ads Integration</p>
                            <p className="text-amber-700 mt-1">We share analytics data with Google Ads to measure advertising effectiveness, create audience segments, and show you relevant ads across Google's advertising network. You can opt-out via our cookie settings.</p>
                          </CardContent>
                        </Card>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/30">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg flex items-center">
                          <Settings className="w-5 h-5 text-muted-foreground mr-2" />
                          Technical Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-3">
                          <ul className="space-y-2 text-foreground">
                            <li className="flex items-center"><Settings className="w-4 h-4 text-muted-foreground mr-2" /> Browser type and version</li>
                            <li className="flex items-center"><Settings className="w-4 h-4 text-muted-foreground mr-2" /> Device type (desktop/mobile)</li>
                          </ul>
                          <ul className="space-y-2 text-foreground">
                            <li className="flex items-center"><Settings className="w-4 h-4 text-muted-foreground mr-2" /> IP address (for security only)</li>
                            <li className="flex items-center"><Settings className="w-4 h-4 text-muted-foreground mr-2" /> Performance data</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Section 3: How We Use Information */}
                <section id="usage" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-purple-100 rounded-full p-3 mr-4">
                      <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">2. How We Use Information</h2>
                      <p className="text-gray-500">Solely for providing and improving our service</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">We use collected information solely for:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                          Providing and maintaining the Service
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                          Processing payments and managing subscriptions
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                          Sending service-related communications
                        </li>
                      </ul>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                          Improving AI models (aggregate, anonymized data)
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                          Preventing fraud and ensuring security
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                          Complying with legal obligations
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 4: Local Processing Technology */}
                <section id="local-processing" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-emerald-100 rounded-full p-3 mr-4">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">3. Local Processing Technology</h2>
                      <p className="text-gray-500">Cutting-edge privacy protection</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-6 border border-emerald-200">
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                      Recipe Revamped uses cutting-edge technology to ensure your privacy:
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border border-emerald-200">
                          <div className="flex items-center mb-2">
                            <Server className="w-5 h-5 text-emerald-600 mr-2" />
                            <h4 className="font-semibold text-gray-900">OpenAI Integration</h4>
                          </div>
                          <p className="text-sm text-gray-600">Recipe conversion powered by OpenAI's advanced AI models via secure API</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-emerald-200">
                          <div className="flex items-center mb-2">
                            <Lock className="w-5 h-5 text-emerald-600 mr-2" />
                            <h4 className="font-semibold text-gray-900">Secure API Processing</h4>
                          </div>
                          <p className="text-sm text-gray-600">Recipe data is processed securely through encrypted API calls</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border border-emerald-200">
                          <div className="flex items-center mb-2">
                            <Globe className="w-5 h-5 text-emerald-600 mr-2" />
                            <h4 className="font-semibold text-gray-900">Internet Required</h4>
                          </div>
                          <p className="text-sm text-gray-600">Active internet connection required for AI recipe processing</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-emerald-200">
                          <div className="flex items-center mb-2">
                            <Database className="w-5 h-5 text-emerald-600 mr-2" />
                            <h4 className="font-semibold text-gray-900">Cloud Storage</h4>
                          </div>
                          <p className="text-sm text-gray-600">All user data and preferences are securely stored in the cloud</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 5: Data Storage and Security */}
                <section id="security" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-red-100 rounded-full p-3 mr-4">
                      <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">4. Data Storage and Security</h2>
                      <p className="text-gray-500">Bank-level security measures</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center">
                        <Lock className="w-5 h-5 text-red-600 mr-2" />
                        Security Measures
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ul className="space-y-3 text-gray-700">
                          <li className="flex items-center">
                            <Lock className="w-4 h-4 text-red-600 mr-3" />
                            End-to-end encryption for saved recipes
                          </li>
                          <li className="flex items-center">
                            <Lock className="w-4 h-4 text-red-600 mr-3" />
                            TLS/SSL encryption for all data transmission
                          </li>
                          <li className="flex items-center">
                            <Lock className="w-4 h-4 text-red-600 mr-3" />
                            Firebase Authentication with 2FA support
                          </li>
                        </ul>
                        <ul className="space-y-3 text-gray-700">
                          <li className="flex items-center">
                            <Lock className="w-4 h-4 text-red-600 mr-3" />
                            Regular security audits and penetration testing
                          </li>
                          <li className="flex items-center">
                            <Lock className="w-4 h-4 text-red-600 mr-3" />
                            Content Security Policy (CSP) headers
                          </li>
                          <li className="flex items-center">
                            <Lock className="w-4 h-4 text-red-600 mr-3" />
                            OWASP compliance and best practices
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center">
                        <Database className="w-5 h-5 text-blue-600 mr-2" />
                        Data Retention Policy
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ul className="space-y-3 text-gray-700">
                          <li className="flex items-center">
                            <Calendar className="w-4 h-4 text-blue-600 mr-3" />
                            Account data: Retained until account deletion
                          </li>
                          <li className="flex items-center">
                            <Calendar className="w-4 h-4 text-blue-600 mr-3" />
                            Saved recipes: Retained until you delete them
                          </li>
                        </ul>
                        <ul className="space-y-3 text-gray-700">
                          <li className="flex items-center">
                            <Calendar className="w-4 h-4 text-blue-600 mr-3" />
                            Analytics data: Anonymized after 90 days
                          </li>
                          <li className="flex items-center">
                            <Calendar className="w-4 h-4 text-blue-600 mr-3" />
                            Server logs: Deleted after 30 days
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 6: Information Sharing */}
                <section id="sharing" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-orange-100 rounded-full p-3 mr-4">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">5. Information Sharing</h2>
                      <p className="text-gray-500">We NEVER sell your data</p>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                    <div className="bg-red-100 rounded-lg p-4 mb-4 border border-red-300">
                      <p className="text-red-800 font-bold">🚫 We do NOT sell your personal information for monetary consideration.</p>
                      <p className="text-red-700 text-sm mt-1">However, we do share certain data with advertising partners as described below.</p>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">We share information in the following circumstances:</p>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <ul className="space-y-3 text-gray-700">
                          <li className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-1" />
                            <div>
                              <strong>With your consent:</strong> When you explicitly authorize sharing
                            </div>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-1" />
                            <div>
                              <strong>Service providers:</strong> Trusted partners (payment, hosting, analytics)
                            </div>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-1" />
                            <div>
                              <strong>AI processing:</strong> Recipe data shared with OpenAI for generation
                            </div>
                          </li>
                        </ul>
                        <ul className="space-y-3 text-gray-700">
                          <li className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-1" />
                            <div>
                              <strong>Legal requirements:</strong> When required by law or legal process
                            </div>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-1" />
                            <div>
                              <strong>Business transfers:</strong> M&A events (with user notice)
                            </div>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-1" />
                            <div>
                              <strong>Safety & security:</strong> To protect rights and prevent fraud
                            </div>
                          </li>
                        </ul>
                      </div>
                      <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                          <CardTitle className="text-lg">Google Analytics & Advertising Data Sharing</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-3">We share analytics and behavioral data with Google for advertising purposes:</p>
                          <div className="grid md:grid-cols-2 gap-3">
                            <ul className="space-y-2 text-gray-600">
                              <li>• Website usage patterns and user behavior</li>
                              <li>• Demographics and interest data</li>
                              <li>• Conversion events and engagement metrics</li>
                            </ul>
                            <ul className="space-y-2 text-gray-600">
                              <li>• Device and browser characteristics</li>
                              <li>• Geographic location (city/region level)</li>
                              <li>• Marketing campaign effectiveness data</li>
                            </ul>
                          </div>
                          <div className="mt-3 p-3 bg-blue-100 rounded">
                            <p className="text-blue-800 text-sm"><strong>Purpose:</strong> This sharing enables advertising measurement, audience creation, and personalized ad delivery across Google's network. You can opt-out in your cookie preferences.</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </section>

                {/* Section 7: Your Rights */}
                <section id="rights" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-indigo-100 rounded-full p-3 mr-4">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">6. Your Rights and Choices</h2>
                      <p className="text-gray-500">Complete control over your data</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
                        Access and Control
                      </h3>
                      <p className="text-gray-700 mb-3">You have the right to:</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-center"><CheckCircle className="w-4 h-4 text-indigo-600 mr-2" /> Access your personal information</li>
                          <li className="flex items-center"><CheckCircle className="w-4 h-4 text-indigo-600 mr-2" /> Correct inaccurate data</li>
                          <li className="flex items-center"><CheckCircle className="w-4 h-4 text-indigo-600 mr-2" /> Delete your account and data</li>
                        </ul>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-center"><CheckCircle className="w-4 h-4 text-indigo-600 mr-2" /> Export your saved recipes</li>
                          <li className="flex items-center"><CheckCircle className="w-4 h-4 text-indigo-600 mr-2" /> Opt-out of marketing communications</li>
                          <li className="flex items-center"><CheckCircle className="w-4 h-4 text-indigo-600 mr-2" /> Disable analytics collection</li>
                        </ul>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                          <Database className="w-5 h-5 text-green-600 mr-2" />
                          Data Portability
                        </h3>
                        <p className="text-gray-700">
                          Export all saved recipes in standard formats (JSON, PDF) anytime through your account settings.
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                          <Settings className="w-5 h-5 text-red-600 mr-2" />
                          Account Deletion
                        </h3>
                        <p className="text-gray-700">
                          Delete your account anytime. This immediately removes all personal data and saved recipes from our systems.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 8: Cookies and Tracking */}
                <section id="cookies" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-yellow-100 rounded-full p-3 mr-4">
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">7. Cookies and Tracking</h2>
                      <p className="text-gray-500">Minimal cookies, no tracking</p>
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">We use minimal cookies for:</p>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Essential Cookies</h4>
                        <p className="text-sm text-gray-600">Required for authentication and security</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Preference Cookies</h4>
                        <p className="text-sm text-gray-600">Remember your settings and preferences</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Analytics Cookies</h4>
                        <p className="text-sm text-gray-600">Understand usage patterns (can be disabled)</p>
                      </div>
                    </div>
                    <div className="bg-green-100 rounded-lg p-4 border border-green-300">
                      <p className="text-green-800 font-semibold">✨ No Third-Party Tracking</p>
                      <p className="text-green-700 mt-1">We do NOT use third-party tracking cookies or advertising networks. <Link to="/cookies" className="text-green-600 hover:text-green-700 underline">Learn more in our Cookie Policy</Link>.</p>
                    </div>
                  </div>
                </section>

                {/* Section 9: International Data Transfers */}
                <section id="international" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-teal-100 rounded-full p-3 mr-4">
                      <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">8. US & International Privacy Compliance</h2>
                      <p className="text-gray-500">Comprehensive compliance with US state laws, GDPR, and global privacy standards</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* US State Privacy Laws */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                        US State Privacy Rights
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <h4 className="font-semibold text-gray-900 mb-2">California (CCPA/CPRA)</h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            <ul className="space-y-1 text-gray-700 text-sm">
                              <li className="flex items-center"><CheckCircle className="w-3 h-3 text-purple-600 mr-2" /> Right to know what personal information is collected</li>
                              <li className="flex items-center"><CheckCircle className="w-3 h-3 text-purple-600 mr-2" /> Right to delete personal information</li>
                              <li className="flex items-center"><CheckCircle className="w-3 h-3 text-purple-600 mr-2" /> Right to correct inaccurate information</li>
                            </ul>
                            <ul className="space-y-1 text-gray-700 text-sm">
                              <li className="flex items-center"><CheckCircle className="w-3 h-3 text-purple-600 mr-2" /> Right to opt-out of sale/sharing for advertising</li>
                              <li className="flex items-center"><CheckCircle className="w-3 h-3 text-purple-600 mr-2" /> Right to limit use of sensitive personal information</li>
                              <li className="flex items-center"><CheckCircle className="w-3 h-3 text-purple-600 mr-2" /> No discrimination for exercising rights</li>
                            </ul>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Virginia (VCDPA)</h4>
                            <ul className="space-y-1 text-gray-600 text-xs">
                              <li>• Right to access, correct, delete</li>
                              <li>• Right to data portability</li>
                              <li>• Right to opt-out of targeted advertising</li>
                            </ul>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Colorado (CPA)</h4>
                            <ul className="space-y-1 text-gray-600 text-xs">
                              <li>• Right to access, correct, delete</li>
                              <li>• Right to opt-out of processing</li>
                              <li>• Right to data portability</li>
                            </ul>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Connecticut (CTDPA)</h4>
                            <ul className="space-y-1 text-gray-600 text-xs">
                              <li>• Right to access, correct, delete</li>
                              <li>• Right to data portability</li>
                              <li>• Right to opt-out of sales/targeted ads</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Federal and Additional US Laws */}
                    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Shield className="w-5 h-5 text-green-600 mr-2" />
                        Federal & Sector-Specific US Laws
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <h4 className="font-semibold text-gray-900 mb-2">COPPA Compliance</h4>
                          <ul className="space-y-1 text-gray-600 text-sm">
                            <li className="flex items-center"><Shield className="w-3 h-3 text-green-600 mr-2" /> No collection from children under 13</li>
                            <li className="flex items-center"><Shield className="w-3 h-3 text-green-600 mr-2" /> Parental consent required for minors</li>
                            <li className="flex items-center"><Shield className="w-3 h-3 text-green-600 mr-2" /> Age verification mechanisms</li>
                          </ul>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <h4 className="font-semibold text-gray-900 mb-2">CAN-SPAM Act</h4>
                          <ul className="space-y-1 text-gray-600 text-sm">
                            <li className="flex items-center"><Mail className="w-3 h-3 text-green-600 mr-2" /> Clear opt-out mechanisms</li>
                            <li className="flex items-center"><Mail className="w-3 h-3 text-green-600 mr-2" /> Honest subject lines and sender info</li>
                            <li className="flex items-center"><Mail className="w-3 h-3 text-green-600 mr-2" /> Physical address disclosure</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-green-100 rounded border border-green-300">
                        <p className="text-green-800 font-semibold text-sm">Emerging State Laws</p>
                        <p className="text-green-700 text-xs mt-1">We monitor and comply with new state privacy laws in Utah, Oregon, Montana, Texas, Florida, and other states as they come into effect.</p>
                      </div>
                    </div>

                    {/* International Compliance */}
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center">
                        <Globe className="w-5 h-5 text-blue-600 mr-2" />
                        International Privacy Compliance
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                          <h4 className="font-semibold text-gray-900 mb-2">GDPR (EU/UK)</h4>
                          <ul className="space-y-1 text-gray-600 text-sm">
                            <li className="flex items-center"><CheckCircle className="w-3 h-3 text-blue-600 mr-2" /> Legal basis: Consent or legitimate interests</li>
                            <li className="flex items-center"><CheckCircle className="w-3 h-3 text-blue-600 mr-2" /> Data minimization principles</li>
                            <li className="flex items-center"><CheckCircle className="w-3 h-3 text-blue-600 mr-2" /> Right to erasure and portability</li>
                            <li className="flex items-center"><CheckCircle className="w-3 h-3 text-blue-600 mr-2" /> DPO contact: privacy@reciperevamped.com</li>
                          </ul>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                          <h4 className="font-semibold text-gray-900 mb-2">Other Jurisdictions</h4>
                          <ul className="space-y-1 text-gray-600 text-sm">
                            <li className="flex items-center"><Globe className="w-3 h-3 text-blue-600 mr-2" /> Canada (PIPEDA)</li>
                            <li className="flex items-center"><Globe className="w-3 h-3 text-blue-600 mr-2" /> Australia (Privacy Act)</li>
                            <li className="flex items-center"><Globe className="w-3 h-3 text-blue-600 mr-2" /> Brazil (LGPD)</li>
                            <li className="flex items-center"><Globe className="w-3 h-3 text-blue-600 mr-2" /> Other applicable local laws</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 10: Contact Us */}
                <section id="contact" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-blue-100 rounded-full p-3 mr-4">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">9. Contact Us</h2>
                      <p className="text-gray-500">Privacy questions? We're here to help</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                      For privacy-related questions or to exercise your rights, contact us at:
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center text-gray-700">
                          <Mail className="w-5 h-5 text-blue-600 mr-3" />
                          <div>
                            <strong>Privacy Team:</strong><br />
                            privacy@reciperevamped.com
                          </div>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Shield className="w-5 h-5 text-blue-600 mr-3" />
                          <div>
                            <strong>Data Protection Officer:</strong><br />
                            dpo@reciperevamped.com
                          </div>
                        </div>
                        <div className="flex items-start text-gray-700">
                          <MapPin className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                          <div>
                            <strong>Mailing Address:</strong><br />
                            Recipe Revamped<br />
                            Attn: Privacy Team<br />
                            Besnyő, Akácfa utca 8<br />
                            2456 Hungary
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
                        <div className="space-y-2">
                          <Link to="/terms" className="block text-blue-600 hover:text-blue-700">Terms of Use</Link>
                          <Link to="/cookies" className="block text-blue-600 hover:text-blue-700">Cookie Policy</Link>
                          <Button
                            variant="link"
                            onClick={handleManageAccount}
                            className="h-auto p-0 text-green-600 hover:text-green-700 justify-start"
                          >
                            Manage Account Settings
                          </Button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <strong>Response Time:</strong> We respond to all privacy requests within 30 days.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};