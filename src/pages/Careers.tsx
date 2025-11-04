import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Rocket, Heart, Coffee, Globe, Zap, Target, Shield, MapPin, Clock, ArrowRight, ChevronDown, ChevronUp, Building } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { SEOHead } from '../components/SEOHead';
import { getActiveJobPostings } from '../lib/jobPostingService';
import type { JobPosting } from '../types/jobPosting';

export const Careers: React.FC = () => {
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load job postings from Firestore
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        const activeJobs = await getActiveJobPostings();
        setJobs(activeJobs);
      } catch (error) {
        console.error('Error loading job postings:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  const toggleJob = (jobId: string) => {
    setOpenJobId(openJobId === jobId ? null : jobId);
  };

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

        {/* Current Openings - Loaded from Firestore */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Current Job Openings</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center text-gray-600 py-12">
              <p className="text-lg">No open positions at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-green-300"
                >
                  {/* Job Header - Always Visible */}
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleJob(job.id!)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-gray-900 mb-2">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4 text-green-600" />
                            <span className="font-semibold">{job.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="font-semibold">{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4 text-green-600" />
                            <span className="font-semibold">{job.workType}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <button className="ml-4 p-2 hover:bg-green-50 rounded-lg transition-colors">
                        {openJobId === job.id ? (
                          <ChevronUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>

                    <p className="text-gray-700 font-medium">{job.description}</p>
                  </div>

                  {/* Job Details - Expanded */}
                  {openJobId === job.id && (
                    <div className="mt-6 pt-6 border-t-2 border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Responsibilities */}
                      {job.responsibilities.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-black text-gray-900 mb-3">Responsibilities</h4>
                          <ul className="space-y-2">
                            {job.responsibilities.map((item, index) => (
                              <li key={index} className="flex items-start gap-2 text-gray-700">
                                <ArrowRight className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Requirements */}
                      <div className="mb-6">
                        <h4 className="text-lg font-black text-gray-900 mb-3">Requirements</h4>
                        <ul className="space-y-2">
                          {job.requirements.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-700">
                              <ArrowRight className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Nice to Have */}
                      {job.niceToHave.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-black text-gray-900 mb-3">Nice to Have</h4>
                          <ul className="space-y-2">
                            {job.niceToHave.map((item, index) => (
                              <li key={index} className="flex items-start gap-2 text-gray-700">
                                <ArrowRight className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Apply Button */}
                      <div className="mt-6">
                        <Link
                          to="/contact?subject=Job%20Application"
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105"
                        >
                          Apply Now
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
