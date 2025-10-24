import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Users, Star, TrendingUp, Globe, Zap, Target, MessageCircle } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { SEOHead } from '../components/SEOHead';

export const Partnerships: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/30 via-emerald-50/20 to-white">
      <SEOHead pageKey="partnerships" />
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Handshake className="w-4 h-4" />
            Partner With Us
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
            Let's Grow Together
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join forces with Recipe Revamped to help people cook healthier, personalized meals. We're looking for partners who share our vision.
          </p>
        </div>

        {/* Partnership Types */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Partnership Opportunities</h2>

          {/* Influencer Partnerships */}
          <div className="bg-white rounded-2xl border-2 border-green-200 p-8 lg:p-12 mb-8 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center shadow-lg">
                  <Star className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black text-gray-900 mb-4">Influencer Partnerships</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Are you a food blogger, chef, nutritionist, or wellness influencer with a passionate following?
                  We're looking for creators who align with our mission of making healthy, personalized cooking accessible to everyone.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Grow Your Audience</h4>
                      <p className="text-sm text-gray-600">Access exclusive features and tools to create engaging content</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Early Access</h4>
                      <p className="text-sm text-gray-600">Be the first to try new features and share them with your community</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Community Impact</h4>
                      <p className="text-sm text-gray-600">Help your followers discover healthier cooking options</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Target className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Monetization</h4>
                      <p className="text-sm text-gray-600">Competitive commission structure and partnership benefits</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700 font-semibold mb-3">
                    Perfect for: Food bloggers, recipe creators, nutritionists, fitness coaches, and wellness influencers
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Partnerships */}
          <div className="bg-white rounded-2xl border-2 border-blue-200 p-8 lg:p-12 mb-8 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-lg">
                  <Globe className="w-10 h-10 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black text-gray-900 mb-4">Business & Brand Partnerships</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Looking to integrate AI-powered recipe adaptation into your platform or collaborate on innovative food tech solutions?
                  We're open to exploring strategic partnerships with brands, platforms, and businesses that align with our vision.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <p className="text-gray-700"><span className="font-bold">Food & Beverage Brands:</span> Product integrations and co-marketing opportunities</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <p className="text-gray-700"><span className="font-bold">Health & Wellness Companies:</span> Nutrition-focused collaborations</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <p className="text-gray-700"><span className="font-bold">Tech Platforms:</span> API integrations and white-label solutions</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <p className="text-gray-700"><span className="font-bold">Media & Publishing:</span> Content partnerships and sponsorships</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Affiliate Partnerships */}
          <div className="bg-white rounded-2xl border-2 border-purple-200 p-8 lg:p-12 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-10 h-10 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black text-gray-900 mb-4">Affiliate & Referral Programs</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Earn commissions by recommending Recipe Revamped to your audience. Our affiliate program is designed
                  to reward partners who help us reach people who can benefit from personalized recipe adaptation.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200">
                    <h4 className="font-bold text-gray-900 mb-2">What You Get</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        Competitive commission rates
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        Marketing materials and assets
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        Dedicated partner support
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200">
                    <h4 className="font-bold text-gray-900 mb-2">Ideal For</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        Content creators
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        Food & health websites
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        Community leaders
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 lg:p-12 shadow-2xl text-center">
          <div className="max-w-3xl mx-auto">
            <MessageCircle className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl font-black text-white mb-4">Ready to Partner?</h2>
            <p className="text-green-50 text-lg mb-8 leading-relaxed">
              We'd love to hear from you! Whether you're an influencer, business, or individual with a partnership idea,
              let's explore how we can work together to make cooking healthier and more accessible.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white text-green-600 hover:bg-green-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
            >
              Get in Touch
              <MessageCircle className="w-5 h-5" />
            </Link>
            <p className="text-green-100 text-sm mt-4">
              Tell us about your partnership idea and we'll get back to you within 48 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
