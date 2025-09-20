import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Calendar, Users, CreditCard, AlertTriangle, Scale, FileText, Mail, MapPin } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';

export const TermsOfUse: React.FC = () => {
  // Set page title and scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Terms of Use | Recipe Revamped - Service Terms & Conditions';

    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Read our terms of use for Recipe Revamped. Understand your rights, responsibilities, and service conditions for our AI recipe conversion platform.');
    if (!metaDescription.parentNode) {
      document.head.appendChild(metaDescription);
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-20 sm:top-24 bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 sm:mb-4">Contents</h2>
              <nav className="space-y-2">
                {[
                  { id: 'acceptance', title: 'Acceptance of Terms', icon: Shield },
                  { id: 'service', title: 'Description of Service', icon: FileText },
                  { id: 'ai-consent', title: 'AI Data Sharing Consent', icon: Shield },
                  { id: 'accounts', title: 'User Accounts', icon: Users },
                  { id: 'billing', title: 'Subscription & Billing', icon: CreditCard },
                  { id: 'acceptable-use', title: 'Acceptable Use', icon: AlertTriangle },
                  { id: 'intellectual-property', title: 'Intellectual Property', icon: Scale },
                  { id: 'privacy', title: 'Privacy & Data Security', icon: Shield },
                  { id: 'disclaimers', title: 'Disclaimers', icon: AlertTriangle },
                  { id: 'contact', title: 'Contact Information', icon: Mail }
                ].map(({ id, title, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className="flex items-center w-full text-left px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
              <div className="bg-gradient-to-r from-green-600 to-blue-600 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 text-white">
                <div className="flex items-start sm:items-center mb-3 sm:mb-4">
                  <Scale className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 mr-2 sm:mr-3 flex-shrink-0" />
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Terms of Use</h1>
                </div>
                <p className="text-base sm:text-lg lg:text-xl text-green-100 mb-4 sm:mb-6 leading-relaxed">
                  Clear, fair terms for using Recipe Revamped
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-green-100">
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
                {/* Section 1: Acceptance of Terms */}
                <section id="acceptance" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-green-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
                      <p className="text-gray-500">Understanding your agreement with us</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed">
                      By accessing or using Recipe Revamped ("the Service"), you agree to be bound by these Terms of Use ("Terms"). 
                      If you do not agree to these Terms, please do not use the Service.
                    </p>
                  </div>
                </section>

                {/* Section 2: Description of Service */}
                <section id="service" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-blue-100 rounded-full p-3 mr-4">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">2. Description of Service</h2>
                      <p className="text-gray-500">What Recipe Revamped offers</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      Recipe Revamped is an AI-powered recipe conversion tool that helps users adapt recipes to meet various dietary requirements.
                      Free plan users receive local processing only, while paid plan users access cloud-based AI features powered by OpenAI's API for enhanced personalized recipe responses.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Free Plan Features</h4>
                        <ul className="space-y-1 text-gray-600">
                          <li>• 3 recipe conversions per day</li>
                          <li>• 5 recipes in Recipe Book</li>
                          <li>• Basic diet filters (4 options)</li>
                          <li>• Local processing only</li>
                        </ul>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Paid Plan Features</h4>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Cloud-based AI processing (OpenAI)</li>
                          <li>• 100+ recipes in Recipe Book</li>
                          <li>• All diet filters (16+ options)</li>
                          <li>• Meal planning calendar</li>
                          <li>• Health conditions support</li>
                          <li>• Backup & restore recipes</li>
                          <li>• Team collaboration (Enterprise)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 3: AI Data Sharing Consent */}
                <section id="ai-consent" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-blue-100 rounded-full p-3 mr-4">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">3. AI Data Sharing Consent</h2>
                      <p className="text-gray-500">Automatic consent for AI recipe generation</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6 space-y-4 border-l-4 border-blue-400">
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Automatic Consent to AI Data Sharing</h3>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        By upgrading to a paid plan (Chef, Master Chef, or Enterprise), you automatically consent to the sharing of your recipe-related data with OpenAI for AI-powered recipe generation. Free plan users receive local processing only with no data sharing. This consent includes:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                        <li>Recipe input text (ingredients, cooking instructions, dish names)</li>
                        <li>Your dietary preferences and restrictions</li>
                        <li>Your health conditions and medical dietary requirements</li>
                        <li>Recipe conversion and modification requests</li>
                        <li>Usage data for service improvement purposes</li>
                      </ul>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-amber-800 mb-2">Important Notes:</h4>
                        <ul className="text-sm text-amber-700 space-y-1">
                          <li>• Personal information (email, account details) is NOT shared with OpenAI</li>
                          <li>• Only recipe-related content is processed by OpenAI's services</li>
                          <li>• Data is used to generate personalized recipe responses</li>
                          <li>• OpenAI may use this data to improve their AI models and services</li>
                        </ul>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        This consent is required to provide our AI-powered recipe generation service. If you do not agree to this data sharing, please do not use Recipe Revamped's services. For more details about data handling, see our Privacy Policy.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 4: User Accounts */}
                <section id="accounts" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-purple-100 rounded-full p-3 mr-4">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">4. User Accounts</h2>
                      <p className="text-gray-500">Your responsibilities as a user</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      To access certain features of the Service, you may need to create an account. You are responsible for:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          Providing accurate and complete information
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          Maintaining the confidentiality of your credentials
                        </li>
                      </ul>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          All activities that occur under your account
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          Notifying us immediately of any unauthorized use
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 4: Subscription Plans and Billing */}
                <section id="billing" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-emerald-100 rounded-full p-3 mr-4">
                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">4. Subscription Plans and Billing</h2>
                      <p className="text-gray-500">Pricing and payment terms</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Free Plan</h4>
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">$0<span className="text-sm text-gray-500">/month</span></div>
                        <p className="text-gray-600 text-sm mb-4">Perfect for trying out the service</p>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• 3 recipe conversions per day</li>
                          <li>• 5 recipes in Recipe Book</li>
                          <li>• Basic diet filters (4 options)</li>
                          <li>• No meal planning</li>
                          <li>• No backup & restore</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Chef Plan</h4>
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">$14.99<span className="text-sm text-gray-500">/month</span></div>
                        <p className="text-gray-600 text-sm mb-4">For home cooking enthusiasts</p>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• 100 conversions per day</li>
                          <li>• 100 recipes in Recipe Book</li>
                          <li>• All diet filters (16 options)</li>
                          <li>• Meal planning calendar</li>
                          <li>• Default recipe preferences</li>
                          <li>• Custom profile pictures</li>
                        </ul>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border-2 border-green-300 relative">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">POPULAR</span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Master Chef Plan</h4>
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">$19.99<span className="text-sm text-gray-500">/month</span></div>
                        <p className="text-gray-600 text-sm mb-4">For passionate home cooks</p>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• Everything in Chef plan</li>
                          <li>• 1,000 recipes in Recipe Book</li>
                          <li>• Advanced nutrition analysis</li>
                          <li>• Recipe collections & tags</li>
                          <li>• Health Conditions</li>
                          <li>• Backup & restore recipes</li>
                          <li>• Priority support</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Enterprise</h4>
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">$39.95<span className="text-sm text-gray-500">/month</span></div>
                        <p className="text-gray-600 text-sm mb-4">For teams and businesses</p>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• 2,500 recipes per user</li>
                          <li>• Everything in Master Chef</li>
                          <li>• Team meal planning</li>
                          <li>• Organization-wide preferences</li>
                          <li>• Enterprise backup/restore</li>
                          <li>• Unlimited cloud storage</li>
                          <li>• Team collaboration</li>
                          <li>• API access</li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-3">Payment Terms</h4>
                      <ul className="grid md:grid-cols-2 gap-2 text-gray-700">
                        <li>• Subscriptions are billed monthly or yearly in advance</li>
                        <li>• No free trials - all plans start immediately upon subscription</li>
                        <li>• Yearly plans offer 20% savings for Chef and Master Chef, 25% for Enterprise</li>
                        <li>• Prices include VAT where applicable based on location</li>
                        <li>• All fees are non-refundable except as required by law</li>
                        <li>• We reserve the right to change pricing with 30 days notice</li>
                        <li>• Yearly subscriptions are billed as single payment</li>
                        <li>• Prices shown in local currency based on detected location</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 5: Acceptable Use Policy */}
                <section id="acceptable-use" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-red-100 rounded-full p-3 mr-4">
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">5. Acceptable Use Policy</h2>
                      <p className="text-gray-500">What you agree not to do</p>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                    <p className="text-gray-700 leading-relaxed mb-4">You agree not to:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                          Use the Service for any illegal purpose
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                          Attempt to reverse engineer or extract source code
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                          Interfere with or disrupt the Service or servers
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                          Transmit viruses or malicious code
                        </li>
                      </ul>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                          Violate any applicable laws or regulations
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                          Resell or redistribute the Service without permission
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                          Use automated systems to access the Service
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                          Impersonate others or provide false information
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 6: Intellectual Property */}
                <section id="intellectual-property" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-indigo-100 rounded-full p-3 mr-4">
                      <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">6. Intellectual Property</h2>
                      <p className="text-gray-500">Rights and ownership</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Our Rights</h4>
                      <p className="text-gray-700 leading-relaxed">
                        All content, features, and functionality of the Service are owned by Recipe Revamped and are protected by international 
                        copyright, trademark, and other intellectual property laws.
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Your Rights</h4>
                      <p className="text-gray-700 leading-relaxed">
                        You retain ownership of your recipe content. By using the Service, you grant us a limited license to process and 
                        display your content solely for providing the Service to you.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 7: Privacy and Data Security */}
                <section id="privacy" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-green-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">7. Privacy and Data Security</h2>
                      <p className="text-gray-500">How we protect your data</p>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Your use of the Service is also governed by our <Link to="/privacy" className="text-green-600 hover:text-green-700 font-semibold">Privacy Policy</Link>. Key highlights:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-center">
                          <Shield className="w-4 h-4 text-green-600 mr-2" />
                          All recipe processing happens locally in your browser
                        </li>
                        <li className="flex items-center">
                          <Shield className="w-4 h-4 text-green-600 mr-2" />
                          We do not access or store recipes unless you save them
                        </li>
                      </ul>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-center">
                          <Shield className="w-4 h-4 text-green-600 mr-2" />
                          Saved recipes are encrypted and stored securely
                        </li>
                        <li className="flex items-center">
                          <Shield className="w-4 h-4 text-green-600 mr-2" />
                          Industry-standard security measures implemented
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 8: Disclaimers */}
                <section id="disclaimers" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-amber-100 rounded-full p-3 mr-4">
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">8. Disclaimers and Limitations</h2>
                      <p className="text-gray-500">Important limitations and disclaimers</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                        Medical Disclaimer
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        Recipe Revamped is not a medical service. Dietary conversions are suggestions only and should not replace professional 
                        medical or nutritional advice. Always consult with healthcare providers regarding dietary restrictions or allergies.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Service Disclaimer</h4>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT GUARANTEE 
                        THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 9: Contact Information */}
                <section id="contact" className="scroll-mt-24">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-6">
                    <div className="bg-blue-100 rounded-full p-3 mr-4">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">9. Contact Information</h2>
                      <p className="text-gray-500">Get in touch with us</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      For questions about these Terms, please contact us at:
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-700">
                          <Mail className="w-5 h-5 text-blue-600 mr-3" />
                          <span><strong>Email:</strong> legal@reciperevamped.com</span>
                        </div>
                        <div className="flex items-start text-gray-700">
                          <MapPin className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                          <div>
                            <strong>Address:</strong><br />
                            Recipe Revamped<br />
                            Besnyő, Akácfa utca 8<br />
                            2456 Hungary
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Quick Links</h4>
                        <div className="space-y-2">
                          <Link to="/privacy" className="block text-blue-600 hover:text-blue-700">Privacy Policy</Link>
                          <Link to="/cookies" className="block text-blue-600 hover:text-blue-700">Cookie Policy</Link>
                          <Link to="/app" className="block text-green-600 hover:text-green-700">Try Recipe Revamped</Link>
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
    </div>
  );
};