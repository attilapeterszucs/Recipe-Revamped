import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Users,
  Send,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Filter,
  UserCheck,
  Zap,
  Sparkles,
  TrendingUp,
  CheckCheck,
  Rocket,
  Target,
  BarChart3,
} from 'lucide-react';
import { getAllUsersWithEmails } from '../lib/adminNotifications';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../lib/logger';

interface User {
  uid: string;
  email: string;
  displayName?: string;
  emailPreferences?: {
    notifications?: boolean;
  };
  marketingEmails?: boolean;
}

interface MarketingEmailData {
  recipeName: string;
  recipeContent: string;
  frequency: string;
  overrideFrequency: boolean;
  emailTemplate?: string;
}

const EMAIL_TEMPLATES = [
  {
    id: 'custom',
    name: 'Custom Email',
    icon: '✍️',
    color: 'from-gray-500 to-slate-500',
    bgColor: 'from-gray-50 to-slate-50',
    borderColor: 'border-gray-300',
    description: 'Write your own custom message',
    subject: '',
    content: ''
  },
  {
    id: 'welcome',
    name: 'Welcome Email',
    icon: '🎉',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-300',
    description: 'Greet new users warmly',
    subject: 'Welcome to Recipe Revamped!',
    content: 'Transform your cooking experience with our AI-powered recipe tools and personalized meal planning. Start exploring amazing recipes today!'
  },
  {
    id: 'weekly_recipe',
    name: 'Weekly Feature',
    icon: '🍳',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'from-orange-50 to-amber-50',
    borderColor: 'border-orange-300',
    description: 'Share weekly recipes',
    subject: 'This Week\'s Featured Recipe',
    content: 'Discover a delicious new recipe handpicked by our culinary team and convert it to your perfect serving size!'
  },
  {
    id: 'features',
    name: 'Feature Showcase',
    icon: '✨',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-300',
    description: 'Highlight platform features',
    subject: 'Unlock Recipe Revamped\'s Full Potential',
    content: 'From AI recipe conversion to meal planning - explore all the features that make cooking easier and more enjoyable.'
  },
  {
    id: 'comeback',
    name: 'Re-engagement',
    icon: '💚',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-300',
    description: 'Bring users back',
    subject: 'We Miss You in the Kitchen!',
    content: 'Come back and discover new recipes, convert your favorites, and plan your meals with Recipe Revamped.'
  }
];

export const MarketingEmailCampaign: React.FC = () => {
  const { user } = useAuth();
  const [marketingEmailData, setMarketingEmailData] = useState<MarketingEmailData>({
    recipeName: '',
    recipeContent: '',
    frequency: 'weekly',
    overrideFrequency: false,
    emailTemplate: 'custom'
  });
  const [sendMarketingToAllUsers, setSendMarketingToAllUsers] = useState(true);
  const [selectedMarketingUsers, setSelectedMarketingUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showOnlyEmailEnabled, setShowOnlyEmailEnabled] = useState(true);
  const [isSubmittingMarketing, setIsSubmittingMarketing] = useState(false);
  const [marketingSubmissionStatus, setMarketingSubmissionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [loadingUsers, setLoadingUsers] = useState(false);

  const adminUserId = user?.uid || '';
  const adminEmail = user?.email || '';

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const users = await getAllUsersWithEmails();
      setAllUsers(users);
    } catch (error) {
      logger.error('Error loading users:', { error });
      setMarketingSubmissionStatus({
        type: 'error',
        message: 'Failed to load users. Please refresh the page.'
      });
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const filterUsers = useCallback(() => {
    let filtered = allUsers;

    if (showOnlyEmailEnabled) {
      filtered = filtered.filter(user => user.marketingEmails === true);
    }

    if (userSearchTerm.trim()) {
      const searchLower = userSearchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchLower) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchLower))
      );
    }

    setFilteredUsers(filtered);
  }, [allUsers, showOnlyEmailEnabled, userSearchTerm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const handleMarketingUserToggle = (userId: string) => {
    setSelectedMarketingUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleMarketingSelectAll = () => {
    const currentlySelected = selectedMarketingUsers.length === filteredUsers.length;
    if (currentlySelected) {
      setSelectedMarketingUsers([]);
    } else {
      setSelectedMarketingUsers(filteredUsers.map(user => user.uid));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setMarketingEmailData({
        ...marketingEmailData,
        emailTemplate: templateId,
        recipeName: template.subject,
        recipeContent: template.content
      });
    }
  };

  const handleMarketingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!marketingEmailData.recipeName.trim() || !marketingEmailData.recipeContent.trim()) {
      setMarketingSubmissionStatus({
        type: 'error',
        message: 'Please fill in both email subject and content.'
      });
      return;
    }

    if (!sendMarketingToAllUsers && selectedMarketingUsers.length === 0) {
      setMarketingSubmissionStatus({
        type: 'error',
        message: 'Please select at least one user to send the marketing email to.'
      });
      return;
    }

    setIsSubmittingMarketing(true);
    setMarketingSubmissionStatus({ type: null, message: '' });

    try {
      const EMAIL_SERVICE_URL = 'https://emailservice-428797186446.us-central1.run.app/marketing';

      const requestBody = {
        recipeName: marketingEmailData.recipeName,
        recipeContent: marketingEmailData.recipeContent,
        frequency: marketingEmailData.frequency,
        overrideFrequency: marketingEmailData.overrideFrequency,
        adminUserId: adminUserId,
        adminEmail: adminEmail,
        ...(sendMarketingToAllUsers ? {} : { targetUserIds: selectedMarketingUsers })
      };

      logger.debug('[MARKETING_DEBUG] Sending request with admin credentials:', {
        adminUserId,
        adminEmail,
        userUid: user?.uid,
        userEmail: user?.email
      });

      const response = await fetch(EMAIL_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Marketing email failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      setMarketingSubmissionStatus({
        type: 'success',
        message: `Marketing email sent successfully to ${result.emailsSent || 'selected'} users!`
      });

      // Reset form
      setMarketingEmailData({
        recipeName: '',
        recipeContent: '',
        frequency: 'weekly',
        overrideFrequency: false,
        emailTemplate: 'custom'
      });
      setSendMarketingToAllUsers(true);
      setSelectedMarketingUsers([]);

    } catch (error) {
      logger.error('Marketing email error:', { error });
      setMarketingSubmissionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while sending the marketing email.'
      });
    } finally {
      setIsSubmittingMarketing(false);
    }
  };

  const selectedTemplate = EMAIL_TEMPLATES.find(t => t.id === marketingEmailData.emailTemplate) || EMAIL_TEMPLATES[0];
  const marketingEnabledCount = allUsers.filter(user => user.marketingEmails === true).length;
  const targetCount = sendMarketingToAllUsers ? marketingEnabledCount : selectedMarketingUsers.length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header - Landing Page Style */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 rounded-3xl shadow-2xl">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="relative px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white mb-1">Marketing Email Campaign</h1>
                <p className="text-white/90 text-sm font-medium">Send engaging email campaigns to users who opted in for marketing</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
              <Rocket className="w-4 h-4" />
              Email Marketing
            </div>
          </div>

          {/* Stats Grid - Landing Page Style */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Total Users</p>
                  <p className="text-3xl font-black text-white">
                    {allUsers.length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Opted In</p>
                  <p className="text-3xl font-black text-white">
                    {marketingEnabledCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Target Reach</p>
                  <p className="text-3xl font-black text-white">
                    {targetCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Opt-in Rate</p>
                  <p className="text-3xl font-black text-white">
                    {allUsers.length > 0 ? Math.round((marketingEnabledCount / allUsers.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Alert */}
      {marketingSubmissionStatus.type && (
        <div className={`p-5 rounded-2xl border-2 shadow-lg ${
          marketingSubmissionStatus.type === 'success'
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
              marketingSubmissionStatus.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {marketingSubmissionStatus.type === 'success' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-bold text-lg ${
                marketingSubmissionStatus.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {marketingSubmissionStatus.type === 'success' ? 'Campaign Sent!' : 'Error'}
              </h4>
              <p className={`mt-1 ${
                marketingSubmissionStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {marketingSubmissionStatus.message}
              </p>
            </div>
            <button
              onClick={() => setMarketingSubmissionStatus({ type: null, message: '' })}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Form - Modern Card Design */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-xl overflow-hidden">
        <form onSubmit={handleMarketingSubmit} className="p-8 space-y-8">
          {/* Section 1: Email Template Selection */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Email Template</h3>
                <p className="text-sm text-gray-600">Choose a pre-designed template or create custom</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {EMAIL_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                    marketingEmailData.emailTemplate === template.id
                      ? `${template.borderColor} bg-gradient-to-br ${template.bgColor} shadow-lg transform scale-105 ring-2 ring-purple-300`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-102'
                  }`}
                >
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    marketingEmailData.emailTemplate === template.id
                      ? `bg-gradient-to-br ${template.color} shadow-lg`
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <span className="text-2xl">{template.icon}</span>
                  </div>
                  <h4 className={`text-sm font-bold text-center mb-1 ${
                    marketingEmailData.emailTemplate === template.id ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {template.name}
                  </h4>
                  <p className="text-xs text-gray-500 text-center">
                    {template.description}
                  </p>
                  {marketingEmailData.emailTemplate === template.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCheck className="w-5 h-5 text-purple-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-100" />

          {/* Section 2: Email Content */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${selectedTemplate.bgColor}`}>
                <Mail className={`w-5 h-5 bg-gradient-to-br ${selectedTemplate.color} bg-clip-text text-transparent`} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Email Content</h3>
                <p className="text-sm text-gray-600">Write your marketing message</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Subject */}
              <div>
                <label htmlFor="recipeName" className="block text-sm font-bold text-gray-800 mb-2">
                  Email Subject *
                </label>
                <input
                  id="recipeName"
                  type="text"
                  value={marketingEmailData.recipeName}
                  onChange={(e) => setMarketingEmailData(prev => ({ ...prev, recipeName: e.target.value }))}
                  placeholder="e.g., Welcome to Recipe Revamped!"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium text-gray-900 placeholder:text-gray-400"
                  required
                />
                <p className="text-xs text-gray-500 font-medium mt-2">Make it compelling to increase open rates</p>
              </div>

              {/* Content */}
              <div>
                <label htmlFor="recipeContent" className="block text-sm font-bold text-gray-800 mb-2">
                  Email Message *
                </label>
                <textarea
                  id="recipeContent"
                  value={marketingEmailData.recipeContent}
                  onChange={(e) => setMarketingEmailData(prev => ({ ...prev, recipeContent: e.target.value }))}
                  placeholder="Enter your marketing message. This will be the main content of your email campaign..."
                  rows={6}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium text-gray-900 placeholder:text-gray-400 resize-none"
                  required
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 font-medium">Be clear, engaging, and actionable</p>
                  <p className={`text-xs font-bold ${marketingEmailData.recipeContent.length > 450 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {marketingEmailData.recipeContent.length} characters
                  </p>
                </div>
              </div>

              {/* Live Preview */}
              {marketingEmailData.recipeName && marketingEmailData.recipeContent && (
                <div className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <label className="block text-sm font-bold text-gray-800">Live Preview</label>
                  </div>
                  <div className={`p-6 rounded-2xl border-2 ${selectedTemplate.borderColor} bg-gradient-to-br ${selectedTemplate.bgColor} shadow-md`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${selectedTemplate.color} shadow-lg`}>
                        <span className="text-2xl">{selectedTemplate.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 mb-2 text-lg">{marketingEmailData.recipeName}</h4>
                        <p className="text-gray-700 leading-relaxed">{marketingEmailData.recipeContent}</p>
                        <div className="mt-4 pt-4 border-t-2 border-gray-200">
                          <p className="text-xs text-gray-500">This email will be sent with Recipe Revamped branding and unsubscribe link</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-100" />

          {/* Section 3: Sending Options */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Sending Options</h3>
                <p className="text-sm text-gray-600">Configure frequency and timing</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Frequency Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Email Frequency
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'weekly', label: 'Weekly', icon: '📅', desc: 'Send once per week' },
                    { value: 'bi-weekly', label: 'Bi-weekly', icon: '📆', desc: 'Send every two weeks' }
                  ].map(({ value, label, icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMarketingEmailData(prev => ({ ...prev, frequency: value }))}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                        marketingEmailData.frequency === value
                          ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{label}</span>
                            {marketingEmailData.frequency === value && (
                              <CheckCheck className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Override Option */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Frequency Override
                </label>
                <button
                  type="button"
                  onClick={() => setMarketingEmailData(prev => ({ ...prev, overrideFrequency: !prev.overrideFrequency }))}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    marketingEmailData.overrideFrequency
                      ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      marketingEmailData.overrideFrequency
                        ? 'bg-gradient-to-br from-orange-500 to-amber-500'
                        : 'bg-gray-100'
                    }`}>
                      <Zap className={`w-5 h-5 ${marketingEmailData.overrideFrequency ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">Override Frequency Limits</span>
                        {marketingEmailData.overrideFrequency && (
                          <CheckCheck className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        Send immediately, ignoring last email date
                      </p>
                    </div>
                  </div>
                </button>

                {marketingEmailData.overrideFrequency && (
                  <div className="mt-3 p-3 bg-orange-50 border-2 border-orange-200 rounded-xl">
                    <p className="text-xs text-orange-700 font-medium">
                      ⚠️ This will send to all selected users regardless of when they last received an email
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-100" />

          {/* Section 4: Recipients */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Select Recipients</h3>
                <p className="text-sm text-gray-600">Choose who will receive this campaign</p>
              </div>
            </div>

            {/* Recipient Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setSendMarketingToAllUsers(true)}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                  sendMarketingToAllUsers
                    ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-2 ring-green-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    sendMarketingToAllUsers
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg'
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Users className={`w-6 h-6 ${sendMarketingToAllUsers ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900">All Eligible Users</h4>
                      {sendMarketingToAllUsers && <CheckCheck className="w-5 h-5 text-green-600" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Send to all users with marketing enabled</p>
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                      <UserCheck className="w-3 h-3" />
                      {marketingEnabledCount.toLocaleString()} users
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSendMarketingToAllUsers(false)}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                  !sendMarketingToAllUsers
                    ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg ring-2 ring-purple-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    !sendMarketingToAllUsers
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg'
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Filter className={`w-6 h-6 ${!sendMarketingToAllUsers ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900">Selected Users</h4>
                      {!sendMarketingToAllUsers && <CheckCheck className="w-5 h-5 text-purple-600" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Manually choose specific recipients</p>
                    {!sendMarketingToAllUsers && selectedMarketingUsers.length > 0 && (
                      <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                        <UserCheck className="w-3 h-3" />
                        {selectedMarketingUsers.length} selected
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* User Selection Interface */}
            {!sendMarketingToAllUsers && (
              <div className="border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-md">
                {/* Search */}
                <div className="mb-5">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by email or name..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Filter Toggle */}
                <div className="mb-5 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="emailEnabled"
                      checked={showOnlyEmailEnabled}
                      onChange={(e) => setShowOnlyEmailEnabled(e.target.checked)}
                      className="mt-0.5 h-5 w-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor="emailEnabled" className="text-sm font-bold text-gray-900 cursor-pointer flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        Show only users with marketing emails enabled
                      </label>
                      <p className="text-xs text-blue-700 mt-1 font-medium">
                        {showOnlyEmailEnabled
                          ? `Showing ${filteredUsers.length} users with marketing enabled`
                          : `Showing all ${filteredUsers.length} users`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center justify-between mb-4 p-4 bg-white border-2 border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold shadow-md">
                      {selectedMarketingUsers.length} of {filteredUsers.length}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">selected</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleMarketingSelectAll}
                      className="px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-all duration-200 font-bold text-sm hover:scale-105"
                    >
                      {selectedMarketingUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedMarketingUsers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedMarketingUsers([])}
                        className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-bold text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* User List */}
                <div className="max-h-96 overflow-y-auto border-2 border-gray-200 rounded-xl bg-white shadow-inner">
                  {loadingUsers ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
                      <span className="text-purple-700 font-bold">Loading users...</span>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 font-bold mb-1">No users found</p>
                      <p className="text-sm text-gray-500">Try adjusting your filters</p>
                    </div>
                  ) : (
                    <div className="divide-y-2 divide-gray-100">
                      {filteredUsers.map((user) => (
                        <label
                          key={user.uid}
                          className="flex items-center gap-4 p-4 hover:bg-purple-50 transition-colors duration-150 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMarketingUsers.includes(user.uid)}
                            onChange={() => handleMarketingUserToggle(user.uid)}
                            className="h-5 w-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                                {user.email}
                              </span>
                              {user.marketingEmails !== true && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                  Marketing disabled
                                </span>
                              )}
                            </div>
                            {user.displayName && (
                              <p className="text-xs text-gray-600 truncate font-medium mt-0.5">{user.displayName}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {user.marketingEmails === true ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                <CheckCircle className="w-3 h-3" />
                                Opted In
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">
                                Opted Out
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-100" />

          {/* Submit Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4">
            <div className="flex-1">
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200">
                <BarChart3 className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Campaign Summary</p>
                  <p className="text-sm text-gray-700">
                    Sending to <span className="font-bold text-purple-600">{targetCount.toLocaleString()}</span> user{targetCount !== 1 ? 's' : ''}
                    {sendMarketingToAllUsers ? ' (all eligible)' : ' (selected)'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {marketingEmailData.overrideFrequency ? '⚡ Immediate send (override on)' : `📅 ${marketingEmailData.frequency} frequency`}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingMarketing || !marketingEmailData.recipeName.trim() || !marketingEmailData.recipeContent.trim() || (!sendMarketingToAllUsers && selectedMarketingUsers.length === 0)}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-lg min-w-[220px]"
            >
              {isSubmittingMarketing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending Campaign...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
