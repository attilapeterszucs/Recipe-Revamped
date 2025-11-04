import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Rocket, Heart, Coffee, Globe, Zap, Target, Shield, MapPin, Clock, ArrowRight } from 'lucide-react';
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
        <div className="mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Current Job Openings</h2>

          {/* Cyber Security Internship */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 lg:p-10 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-green-300">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                {/* Position Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold mb-2">
                      INTERNSHIP
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Cyber Security Professional</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>Remote</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Part-time / Full-time</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <span>Internship</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">About the Role</h4>
                    <p className="text-gray-700 leading-relaxed">
                      We're looking for a talented Cyber Security intern to help us strengthen our security posture.
                      You'll work directly with our development team to identify vulnerabilities and ensure our platform
                      is secure for our users.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">What You'll Do</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">Perform comprehensive penetration testing on our web application and infrastructure</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">Conduct security assessments of our database, backend APIs, and frontend code</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">Identify and document security vulnerabilities with detailed reports</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">Work with developers to recommend and implement security improvements</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">Test authentication, authorization, and data protection mechanisms</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">What We're Looking For</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">Knowledge of web application security (OWASP Top 10)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">Experience with penetration testing tools and methodologies</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">Understanding of database security, API security, and frontend vulnerabilities</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">Strong analytical and problem-solving skills</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">Excellent communication skills for reporting findings</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">Currently pursuing or recently completed a degree in Computer Science, Cyber Security, or related field</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Nice to Have</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">Security Certifications (CEH, OSCP, etc.)</span>
                      <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">Bug Bounty Experience</span>
                      <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">Burp Suite</span>
                      <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">Metasploit</span>
                      <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">Nmap</span>
                      <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">Python/Bash scripting</span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-gray-200">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105"
                  >
                    Apply for This Position
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-red-600" />
                    <span>Help us build a secure platform for millions of users</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* General Application CTA */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 text-center shadow-lg">
          <h3 className="text-2xl font-black text-gray-900 mb-3">Don't see the right fit?</h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            We're always interested in hearing from talented people who share our passion for food tech and healthy cooking.
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
  );
};
