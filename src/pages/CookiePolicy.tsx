import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Shield, Calendar, Settings, Eye, ToggleLeft, ToggleRight, CheckCircle, AlertTriangle, Mail, MapPin, FileText, Zap } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { useCookieContext } from '../contexts/CookieContext';
import { CookieSettings } from '../components/CookieSettings';

export const CookiePolicy: React.FC = () => {
  const { showConsentPopup } = useCookieContext();
  const [showCookieSettings, setShowCookieSettings] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = 'Cookie Policy | Recipe Revamped - Cookie Usage & Management';
    
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Learn about how Recipe Revamped uses cookies and similar technologies. Understand our cookie practices and manage your preferences.');
    if (!metaDescription.parentNode) {
      document.head.appendChild(metaDescription);
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-20 sm:top-24 bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Contents</h2>
              <nav className="space-y-2">
                {[
                  { id: 'overview', title: 'Cookie Overview', icon: Cookie },
                  { id: 'essential', title: 'Essential Cookies', icon: Shield },
                  { id: 'analytics', title: 'Analytics Cookies', icon: Eye },
                  { id: 'preferences', title: 'Preference Cookies', icon: Settings },
                  { id: 'third-party', title: 'Third-Party Cookies', icon: AlertTriangle },
                  { id: 'management', title: 'Cookie Management', icon: ToggleLeft },
                  { id: 'updates', title: 'Policy Updates', icon: Calendar },
                  { id: 'contact', title: 'Contact Us', icon: Mail }
                ].map(({ id, title, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className="flex items-center w-full text-left px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="truncate">{title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              {/* Hero Section */}
              <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 text-white">
                <div className="flex items-start sm:items-center mb-3 sm:mb-4">
                  <Cookie className="w-5 h-5 sm:w-6 sm:h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 mr-2 sm:mr-3 flex-shrink-0" />
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Cookie Policy</h1>
                </div>
                <p className="text-base sm:text-lg lg:text-xl text-orange-100 mb-4 sm:mb-6 leading-relaxed">
                  Transparent cookie usage for enhanced user experience
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-orange-100">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                    <span className="text-sm sm:text-base">Effective: September 13, 2025</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                    <span className="text-sm sm:text-base">Last Updated: September 13, 2025</span>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 lg:space-y-12">
                {/* Cookie Summary Banner */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 sm:p-6 border border-orange-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <Cookie className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mr-2" />
                    Our Cookie Approach
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <Shield className="w-8 h-8 text-green-600 mb-2" />
                      <h4 className="font-semibold text-gray-900">Privacy-First</h4>
                      <p className="text-sm text-gray-600">Minimal data collection with maximum user control</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <ToggleLeft className="w-8 h-8 text-blue-600 mb-2" />
                      <h4 className="font-semibold text-gray-900">Your Choice</h4>
                      <p className="text-sm text-gray-600">Easy controls to manage your cookie preferences</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <Eye className="w-8 h-8 text-purple-600 mb-2" />
                      <h4 className="font-semibold text-gray-900">No Tracking</h4>
                      <p className="text-sm text-gray-600">No third-party advertising or tracking cookies</p>
                    </div>
                  </div>
                </div>

                {/* Section 1: Cookie Overview */}
                <section id="overview" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-orange-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                      <Cookie className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">What Are Cookies?</h2>
                      <p className="text-gray-500">Understanding cookies and how we use them</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">What Are Cookies?</h3>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        Cookies are small text files stored on your device when you visit a website. They help websites remember information about your visit, making your experience more efficient and personalized.
                      </p>
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <h4 className="font-semibold text-gray-900 mb-2">How Recipe Revamped Uses Cookies</h4>
                        <p className="text-gray-700">
                          We use cookies sparingly and responsibly to enhance your experience, remember your preferences, and ensure our application works properly. We prioritize your privacy and only collect what's necessary.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 2: Essential Cookies */}
                <section id="essential" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-green-100 rounded-full p-3 mr-4">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">1. Essential Cookies</h2>
                      <p className="text-gray-500">Required for basic website functionality</p>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <div className="bg-green-100 rounded-lg p-4 mb-4 border border-green-300">
                      <p className="text-green-800 font-semibold">🔒 Cannot be disabled</p>
                      <p className="text-green-700 mt-1">These cookies are essential for the website to function and cannot be disabled without breaking core functionality.</p>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">What Essential Cookies Do:</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center mb-2">
                          <Shield className="w-5 h-5 text-green-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">Authentication</h4>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Keep you logged in between pages</li>
                          <li>• Verify your identity securely</li>
                          <li>• Protect against unauthorized access</li>
                        </ul>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center mb-2">
                          <Settings className="w-5 h-5 text-green-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">Security & Session</h4>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Prevent cross-site request forgery</li>
                          <li>• Maintain secure session state</li>
                          <li>• Enable proper form submissions</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Essential Cookies We Use:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 font-semibold">Cookie Name</th>
                              <th className="text-left py-2 font-semibold">Purpose</th>
                              <th className="text-left py-2 font-semibold">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-600">
                            <tr className="border-b border-gray-100">
                              <td className="py-2 font-mono">auth_token</td>
                              <td className="py-2">User authentication</td>
                              <td className="py-2">24 hours</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 font-mono">session_id</td>
                              <td className="py-2">Session management</td>
                              <td className="py-2">Session only</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 font-mono">csrf_token</td>
                              <td className="py-2">Security protection</td>
                              <td className="py-2">Session only</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 3: Analytics Cookies */}
                <section id="analytics" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-purple-100 rounded-full p-3 mr-4">
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">2. Analytics Cookies</h2>
                      <p className="text-gray-500">Help us understand how you use our service</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                    <div className="bg-blue-100 rounded-lg p-4 mb-4 border border-blue-300">
                      <p className="text-blue-800 font-semibold">✨ Can be disabled</p>
                      <p className="text-blue-700 mt-1">These cookies help us improve our service but are not required for functionality.</p>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">What Analytics Cookies Do:</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center mb-2">
                          <Eye className="w-5 h-5 text-purple-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">Usage Analytics</h4>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Track page views and user flows</li>
                          <li>• Measure feature popularity</li>
                          <li>• Identify performance issues</li>
                        </ul>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center mb-2">
                          <Zap className="w-5 h-5 text-purple-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">Performance Monitoring</h4>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Monitor app load times</li>
                          <li>• Detect errors and bugs</li>
                          <li>• Optimize user experience</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Google Analytics</h4>
                      <ul className="text-gray-700 space-y-1">
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-600 mr-2" /> Tracks page views and user interactions</li>
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-600 mr-2" /> Helps us improve user experience</li>
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-600 mr-2" /> Recipe content is never tracked</li>
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-600 mr-2" /> Can be disabled via cookie settings</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 4: Preference Cookies */}
                <section id="preferences" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-blue-100 rounded-full p-3 mr-4">
                      <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">3. Preference Cookies</h2>
                      <p className="text-gray-500">Remember your personal settings</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">What Preference Cookies Do:</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center mb-2">
                          <Settings className="w-5 h-5 text-blue-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">UI Preferences</h4>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Remember theme preferences</li>
                          <li>• Save language settings</li>
                          <li>• Store layout preferences</li>
                        </ul>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center mb-2">
                          <Cookie className="w-5 h-5 text-blue-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">Cookie Preferences</h4>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Remember cookie consent choices</li>
                          <li>• Store privacy preferences</li>
                          <li>• Save notification settings</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 bg-white rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Preference Cookies We Use:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 font-semibold">Cookie Name</th>
                              <th className="text-left py-2 font-semibold">Purpose</th>
                              <th className="text-left py-2 font-semibold">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-600">
                            <tr className="border-b border-gray-100">
                              <td className="py-2 font-mono">user_preferences</td>
                              <td className="py-2">UI settings and preferences</td>
                              <td className="py-2">1 year</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 font-mono">cookie_consent</td>
                              <td className="py-2">Cookie preference choices</td>
                              <td className="py-2">1 year</td>
                            </tr>
                            <tr>
                              <td className="py-2 font-mono">theme_preference</td>
                              <td className="py-2">Dark/light mode choice</td>
                              <td className="py-2">1 year</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 5: Third-Party Cookies */}
                <section id="third-party" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-red-100 rounded-full p-3 mr-4">
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">4. Third-Party Cookies</h2>
                      <p className="text-gray-500">External services we use</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <div className="bg-green-100 rounded-lg p-4 mb-4 border border-green-300">
                        <p className="text-green-800 font-semibold">🎉 Good News: No Tracking!</p>
                        <p className="text-green-700 mt-1">We do NOT use third-party advertising networks, social media pixels, or tracking cookies.</p>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Limited Third-Party Services:</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex items-center mb-2">
                            <Shield className="w-5 h-5 text-green-600 mr-2" />
                            <h4 className="font-semibold text-gray-900">Firebase (Google)</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Authentication and secure data storage</p>
                          <ul className="text-xs text-gray-500 space-y-1">
                            <li>• __session (authentication)</li>
                            <li>• firebase-heartbeat-* (service health)</li>
                          </ul>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex items-center mb-2">
                            <Eye className="w-5 h-5 text-blue-600 mr-2" />
                            <h4 className="font-semibold text-gray-900">Google Analytics</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Usage analytics with consent (ID: G-CR787RJ2VK)</p>
                          <ul className="text-xs text-gray-500 space-y-1">
                            <li>• _ga (2 years) - visitor identification</li>
                            <li>• _ga_* (2 years) - session storage</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                        Third-Party Services We Use & Don't Use
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                            Google Analytics (privacy-focused)
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-red-600 mr-2" />
                            No Facebook/Meta pixels
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-red-600 mr-2" />
                            No advertising networks
                          </li>
                        </ul>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-red-600 mr-2" />
                            No social media widgets
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-red-600 mr-2" />
                            No behavioral tracking
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-red-600 mr-2" />
                            No cross-site tracking
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 6: Cookie Management */}
                <section id="management" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-indigo-100 rounded-full p-3 mr-4">
                      <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">5. Managing Your Cookie Preferences</h2>
                      <p className="text-gray-500">You have full control over your cookies</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cookie Controls</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 border border-indigo-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">Essential Cookies</h4>
                              <ToggleRight className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-sm text-gray-600">Always active - required for basic functionality</p>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-indigo-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">Analytics Cookies</h4>
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600">Optional - help us improve our service</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 border border-indigo-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">Preference Cookies</h4>
                              <ToggleRight className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-sm text-gray-600">Remember your settings and choices</p>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-indigo-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">Third-Party Cookies</h4>
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600">Limited essential services only</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Browser-Level Cookie Management</h3>
                      <p className="text-gray-700 mb-4">You can also control cookies directly in your browser:</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-yellow-200">
                          <h4 className="font-semibold text-gray-900 mb-2">Desktop Browsers</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Chrome: Settings → Privacy → Cookies</li>
                            <li>• Firefox: Preferences → Privacy → Cookies</li>
                            <li>• Safari: Preferences → Privacy → Cookies</li>
                            <li>• Edge: Settings → Privacy → Cookies</li>
                          </ul>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-yellow-200">
                          <h4 className="font-semibold text-gray-900 mb-2">Mobile Browsers</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• iOS Safari: Settings → Safari → Privacy</li>
                            <li>• Android Chrome: Settings → Site settings</li>
                            <li>• Samsung Internet: Settings → Privacy</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-blue-800 font-semibold">💡 Tip: Update Your Preferences</p>
                      <p className="text-blue-700 mt-1">You can change your cookie preferences anytime by visiting your <Link to="/app" className="text-blue-600 hover:text-blue-800 underline">account settings</Link> or clicking the cookie banner when it appears.</p>
                    </div>
                  </div>
                </section>

                {/* Section 7: Policy Updates */}
                <section id="updates" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-teal-100 rounded-full p-3 mr-4">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">6. Policy Updates</h2>
                      <p className="text-gray-500">How we handle changes to this policy</p>
                    </div>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-6 border border-teal-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">When We Update This Policy</h3>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-teal-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Minor Changes</h4>
                        <p className="text-gray-700 text-sm">
                          For clarifications or minor updates, we'll update this page and note the revision date. 
                          We recommend checking this policy periodically.
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-teal-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Major Changes</h4>
                        <p className="text-gray-700 text-sm">
                          For significant changes affecting how we use cookies, we'll notify you via email and/or 
                          a prominent notice on our website at least 30 days before changes take effect.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 bg-teal-100 rounded-lg p-4 border border-teal-300">
                      <p className="text-teal-800 font-semibold">📅 Current Version</p>
                      <p className="text-teal-700 mt-1">This Cookie Policy was last updated on January 1, 2025. Version 1.0</p>
                    </div>
                  </div>
                </section>

                {/* Section 8: Contact Us */}
                <section id="contact" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-blue-100 rounded-full p-3 mr-4">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">7. Questions About Cookies?</h2>
                      <p className="text-gray-500">We're here to help with any cookie-related questions</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      If you have questions about our cookie policy or want to exercise your cookie preferences, contact us:
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
                          <Cookie className="w-5 h-5 text-blue-600 mr-3" />
                          <div>
                            <strong>Cookie Questions:</strong><br />
                            cookies@reciperevamped.com
                          </div>
                        </div>
                        <div className="flex items-start text-gray-700">
                          <MapPin className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                          <div>
                            <strong>Mailing Address:</strong><br />
                            Recipe Revamped<br />
                            Attn: Cookie Policy<br />
                            Besnyő, Akácfa utca 8<br />
                            2456 Hungary
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Related Policies</h4>
                        <div className="space-y-2">
                          <Link to="/privacy" className="block text-blue-600 hover:text-blue-700">Privacy Policy</Link>
                          <Link to="/terms" className="block text-blue-600 hover:text-blue-700">Terms of Use</Link>
                          <button 
                            onClick={() => setShowCookieSettings(true)}
                            className="block text-left text-green-600 hover:text-green-700"
                          >
                            Manage Cookie Preferences
                          </button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <strong>Quick Response:</strong> Cookie questions answered within 5 business days.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cookie Settings Modal */}
      {showCookieSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Cookie Settings</h2>
              <button
                onClick={() => setShowCookieSettings(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4">
              <CookieSettings />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};