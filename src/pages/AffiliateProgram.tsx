import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Users, TrendingUp, Zap, Clock, CheckCircle, Link as LinkIcon, Lock, Copy } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { SEOHead } from '../components/SEOHead';

export const AffiliateProgram: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 via-pink-50/20 to-white">
      <SEOHead pageKey="affiliateProgram" />

      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Gift className="w-4 h-4" />
            Affiliate Rewards Program
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Earn Free Premium Access
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Share Recipe Revamped with your audience and earn rewards. Get 3 days of Master Chef plan for every referral,
            and your referrals get 7 days free!
          </p>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl border-2 border-purple-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute -top-4 left-8">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black shadow-lg">
                    1
                  </div>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4 mt-2">
                  <Lock className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">Create Your Code</h3>
                <p className="text-gray-600 leading-relaxed">
                  Set a unique affiliate code (3-20 characters). Once set, it's permanently yours!
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl border-2 border-purple-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute -top-4 left-8">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black shadow-lg">
                    2
                  </div>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4 mt-2">
                  <LinkIcon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">Share Your Link</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get your personalized affiliate link and share it with your audience across social media, blogs, or email.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-2xl border-2 border-purple-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute -top-4 left-8">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black shadow-lg">
                    3
                  </div>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4 mt-2">
                  <Gift className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">Earn Rewards</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get 3 days of free Master Chef plan for each new user who signs up with your code!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Breakdown */}
        <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 rounded-3xl border-2 border-purple-200 p-8 lg:p-12 shadow-xl mb-20">
          <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">Rewards Breakdown</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* For Affiliates */}
            <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black text-gray-900">For You (Affiliate)</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-purple-600 mb-1">3 Days Free</p>
                    <p className="text-sm text-gray-600">Master Chef plan per referral</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">Unlimited Referrals</p>
                    <p className="text-sm text-gray-600">No cap on how much you can earn</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">Bonus Days Stack</p>
                    <p className="text-sm text-gray-600">All earned days accumulate and roll over</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Referrals */}
            <div className="bg-white rounded-2xl border-2 border-green-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black text-gray-900">For Your Referrals</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-green-600 mb-1">7 Days Free</p>
                    <p className="text-sm text-gray-600">Master Chef plan trial</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">Full Access</p>
                    <p className="text-sm text-gray-600">All Master Chef features included</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">Instant Activation</p>
                    <p className="text-sm text-gray-600">Bonus applied immediately at signup</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
            <p className="text-center text-gray-700 font-semibold">
              💡 <strong>Win-Win:</strong> Your referrals get premium access to try Recipe Revamped, and you get rewarded for spreading the word!
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Affiliate Dashboard Features</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Real-Time Stats</h3>
                  <p className="text-gray-600 text-sm">Track your referrals, days earned, and days remaining with live updates.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Copy className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Easy Sharing</h3>
                  <p className="text-gray-600 text-sm">One-click copy for your affiliate code and personalized link.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Bonus Days Management</h3>
                  <p className="text-gray-600 text-sm">See exactly how many bonus days you have and when they're active.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Permanent Code</h3>
                  <p className="text-gray-600 text-sm">Your affiliate code is locked in and never expires - it's yours forever.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-3xl p-8 lg:p-12 text-center shadow-2xl">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-lg text-purple-100 mb-8">
              Set up your affiliate code in seconds and start earning free premium access today.
            </p>
            <Link
              to="/app/settings/affiliate"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <Gift className="w-5 h-5" />
              Go to Affiliate Dashboard
            </Link>
            <p className="mt-6 text-sm text-purple-100">
              Already have an account? Sign in and visit Settings → Affiliate Program
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Frequently Asked Questions</h2>

          <div className="space-y-4 max-w-4xl mx-auto">
            <details className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg group">
              <summary className="font-bold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>Can I change my affiliate code after setting it?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                No, once you set your affiliate code, it's permanently locked. This ensures consistency for your audience and prevents confusion. Choose wisely!
              </p>
            </details>

            <details className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg group">
              <summary className="font-bold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>Is there a limit to how many referrals I can make?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                No limit! Share your code with as many people as you want. The more referrals you get, the more bonus days you earn.
              </p>
            </details>

            <details className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg group">
              <summary className="font-bold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>Do bonus days expire?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Bonus days start counting down once you activate them. Days accumulate before activation, and once activated, they run consecutively until depleted.
              </p>
            </details>

            <details className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg group">
              <summary className="font-bold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>Can I use my own affiliate code?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                No, you cannot use your own affiliate code. The program is designed to reward you for bringing new users to Recipe Revamped.
              </p>
            </details>

            <details className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg group">
              <summary className="font-bold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>What if someone already used an affiliate code?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Each user can only use one affiliate code, ever. If someone already used a code during signup or in their account, they cannot apply another one.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};
