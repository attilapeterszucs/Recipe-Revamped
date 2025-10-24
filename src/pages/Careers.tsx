import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Rocket, Heart, Coffee, Globe, Zap, Target } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { SEOHead } from '../components/SEOHead';

export const Careers: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/30 via-emerald-50/20 to-white">
      <SEOHead pageKey="careers" />
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Briefcase className="w-4 h-4" />
            Join Our Team
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
            Build the Future of Cooking
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Help us transform the way people cook with AI-powered recipe adaptation. We're always looking for passionate individuals who want to make a difference.
          </p>
        </div>

        {/* Why Join Us */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Why Recipe Revamped?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-green-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Innovation First</h3>
              <p className="text-sm text-gray-600">
                Work with cutting-edge AI technology and shape the future of food tech.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-green-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Great Team</h3>
              <p className="text-sm text-gray-600">
                Collaborate with talented, passionate people who love food and technology.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-green-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Impact Driven</h3>
              <p className="text-sm text-gray-600">
                Make a real difference in people's lives through healthier, personalized cooking.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-green-300 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Remote Friendly</h3>
              <p className="text-sm text-gray-600">
                Work from anywhere with flexible hours and a focus on results, not location.
              </p>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-8 lg:p-12 mb-20 shadow-lg">
          <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Move Fast</h3>
              <p className="text-gray-700">
                We iterate quickly, learn from feedback, and continuously improve our product.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">User Focused</h3>
              <p className="text-gray-700">
                Every decision we make is guided by what's best for our users and their needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Work-Life Balance</h3>
              <p className="text-gray-700">
                We believe great work comes from well-rested, happy people with fulfilling lives.
              </p>
            </div>
          </div>
        </div>

        {/* Current Openings */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 lg:p-12 mb-12 shadow-lg">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Current Job Openings</h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              We don't have any open positions at the moment, but we're always interested in hearing from talented people who share our passion.
            </p>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 max-w-2xl mx-auto">
              <p className="text-gray-700 font-semibold mb-4">
                Think you'd be a great fit for our team?
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
