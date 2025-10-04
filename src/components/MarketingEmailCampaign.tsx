import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Mail, Users, Send, Search, Clock, AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';
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

export const MarketingEmailCampaign: React.FC = () => {
  const { user } = useAuth();
  const [marketingEmailData, setMarketingEmailData] = useState<MarketingEmailData>({
    recipeName: '',
    recipeContent: '',
    frequency: 'weekly',
    overrideFrequency: false
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
  const [showUserList, setShowUserList] = useState(false);

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

  const handleMarketingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!marketingEmailData.recipeName.trim() || !marketingEmailData.recipeContent.trim()) {
      setMarketingSubmissionStatus({
        type: 'error',
        message: 'Please fill in both recipe name and content.'
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
        overrideFrequency: false
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

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50/50 border-2 border-purple-200 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/50 border-b-2 border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center shadow-md">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Marketing Email Campaign
              </CardTitle>
              <CardDescription className="text-purple-700 font-medium mt-1">
                Send recipe newsletters and marketing content to users who have enabled "Marketing Emails" in their Settings &gt; Notifications preferences.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {marketingSubmissionStatus.type && (
            <Alert className={`rounded-xl border-2 shadow-md ${
              marketingSubmissionStatus.type === 'success'
                ? 'bg-gradient-to-br from-green-50 to-emerald-50/50 border-green-300'
                : 'bg-gradient-to-br from-red-50 to-rose-50/50 border-red-300'
            }`}>
              {marketingSubmissionStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <AlertDescription className={`font-bold ${
                marketingSubmissionStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {marketingSubmissionStatus.message}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleMarketingSubmit} className="space-y-6">
            {/* Email Template Selection */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="emailTemplate">Email Template</Label>
                <CustomDropdown
                  value={marketingEmailData.emailTemplate || 'custom'}
                  onChange={(template) => {
                    if (template === 'welcome') {
                      setMarketingEmailData(prev => ({
                        ...prev,
                        emailTemplate: template,
                        recipeName: 'Welcome to Recipe Revamped!',
                        recipeContent: 'Transform your cooking experience with our AI-powered recipe tools and personalized meal planning.'
                      }));
                    } else if (template === 'weekly_recipe') {
                      setMarketingEmailData(prev => ({
                        ...prev,
                        emailTemplate: template,
                        recipeName: 'This Week\'s Featured Recipe',
                        recipeContent: 'Discover a delicious new recipe handpicked by our culinary team and convert it to your perfect serving size!'
                      }));
                    } else if (template === 'features') {
                      setMarketingEmailData(prev => ({
                        ...prev,
                        emailTemplate: template,
                        recipeName: 'Unlock Recipe Revamped\'s Full Potential',
                        recipeContent: 'From AI recipe conversion to meal planning - explore all the features that make cooking easier and more enjoyable.'
                      }));
                    } else if (template === 'comeback') {
                      setMarketingEmailData(prev => ({
                        ...prev,
                        emailTemplate: template,
                        recipeName: 'We Miss You in the Kitchen!',
                        recipeContent: 'Come back and discover new recipes, convert your favorites, and plan your meals with Recipe Revamped.'
                      }));
                    } else if (template === 'custom') {
                      setMarketingEmailData(prev => ({
                        ...prev,
                        emailTemplate: template,
                        recipeName: '',
                        recipeContent: ''
                      }));
                    }
                  }}
                  options={[
                    { value: 'custom', label: 'Custom Email', icon: '📝' },
                    { value: 'welcome', label: 'Welcome Email', icon: '🎉' },
                    { value: 'weekly_recipe', label: 'Weekly Recipe Feature', icon: '🍳' },
                    { value: 'features', label: 'Feature Showcase', icon: '✨' },
                    { value: 'comeback', label: 'Re-engagement Email', icon: '💚' }
                  ]}
                  className="mb-4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipeName" className="text-sm font-bold text-gray-800">Email Subject</Label>
                  <input
                    id="recipeName"
                    type="text"
                    value={marketingEmailData.recipeName}
                    onChange={(e) => setMarketingEmailData(prev => ({ ...prev, recipeName: e.target.value }))}
                    placeholder="e.g., Welcome to Recipe Revamped!"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-sm font-bold text-gray-800">Email Frequency</Label>
                  <CustomDropdown
                    value={marketingEmailData.frequency}
                    onChange={(value) => setMarketingEmailData(prev => ({ ...prev, frequency: value }))}
                    options={[
                      { value: 'weekly', label: 'Weekly', icon: '📅' },
                      { value: 'bi-weekly', label: 'Bi-weekly', icon: '📆' }
                    ]}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipeContent" className="text-sm font-bold text-gray-800">Email Content</Label>
              <textarea
                id="recipeContent"
                value={marketingEmailData.recipeContent}
                onChange={(e) => setMarketingEmailData(prev => ({ ...prev, recipeContent: e.target.value }))}
                placeholder="Enter your marketing message. This will be the main content of your email campaign..."
                className="min-h-[200px] w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium resize-none"
                required
              />
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-xl p-3 shadow-sm">
                <p className="text-sm text-blue-800 font-medium">
                  💡 <strong className="font-bold">Tip:</strong> Use the templates above for pre-written content designed to engage users and drive them to your website.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-amber-50/50 border-2 border-yellow-200 rounded-xl p-4 shadow-md">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="overrideFrequency"
                  checked={marketingEmailData.overrideFrequency}
                  onChange={(e) => setMarketingEmailData(prev => ({ ...prev, overrideFrequency: e.target.checked }))}
                  className="mt-1 h-5 w-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer transition-all duration-200"
                />
                <div className="flex-1">
                  <Label htmlFor="overrideFrequency" className="text-sm font-bold text-gray-800 cursor-pointer">
                    Override frequency limits
                  </Label>
                  <p className="text-xs text-yellow-800 mt-1 font-medium">
                    Send immediately regardless of user's last email date
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* User Selection */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50/50 border-2 border-purple-200 rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Target Recipients</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {marketingEmailData.overrideFrequency ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 font-bold">
                          Override ON - Send immediately
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-purple-700 font-medium">
                          Respects frequency preferences
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 transition-all duration-200 hover:border-purple-300 hover:shadow-md">
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      id="allUsers"
                      name="userSelection"
                      checked={sendMarketingToAllUsers}
                      onChange={() => setSendMarketingToAllUsers(true)}
                      className="mt-1 h-5 w-5 text-purple-600 border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <Label htmlFor="allUsers" className="text-sm font-bold text-gray-800 cursor-pointer">
                        Send to all eligible users
                      </Label>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        Targets all users with marketing emails enabled
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 transition-all duration-200 hover:border-purple-300 hover:shadow-md">
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      id="selectedUsers"
                      name="userSelection"
                      checked={!sendMarketingToAllUsers}
                      onChange={() => setSendMarketingToAllUsers(false)}
                      className="mt-1 h-5 w-5 text-purple-600 border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <Label htmlFor="selectedUsers" className="text-sm font-bold text-gray-800 cursor-pointer">
                        Send to selected users
                      </Label>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        Manually choose specific recipients
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {!sendMarketingToAllUsers && (
                <div className="space-y-4 p-5 border-2 border-indigo-200 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50/50 shadow-md">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black text-indigo-900">Select Users</h4>
                    <button
                      type="button"
                      onClick={() => setShowUserList(!showUserList)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 font-bold shadow-md shadow-indigo-500/30 hover:shadow-lg hover:scale-105"
                    >
                      {showUserList ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showUserList ? 'Hide' : 'Show'} User List
                    </button>
                  </div>

                  {showUserList && (
                    <>
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-500" />
                          <input
                            type="text"
                            placeholder="Search users by email or name..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium"
                          />
                        </div>

                        <div className="bg-white border-2 border-indigo-200 rounded-xl p-3 shadow-sm">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              id="emailEnabled"
                              checked={showOnlyEmailEnabled}
                              onChange={(e) => setShowOnlyEmailEnabled(e.target.checked)}
                              className="mt-0.5 h-5 w-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                            />
                            <Label htmlFor="emailEnabled" className="text-sm font-bold text-gray-800 cursor-pointer">
                              Show only users with marketing emails enabled
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white border-2 border-indigo-200 rounded-xl">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg text-sm font-bold shadow-md">
                          {selectedMarketingUsers.length} of {filteredUsers.length} selected
                        </span>
                        <button
                          type="button"
                          onClick={handleMarketingSelectAll}
                          className="px-4 py-2 bg-white border-2 border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all duration-200 font-bold text-sm"
                        >
                          {selectedMarketingUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      {loadingUsers ? (
                        <div className="flex items-center justify-center py-8 bg-white border-2 border-indigo-200 rounded-xl">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                          <span className="ml-3 text-indigo-700 font-bold">Loading users...</span>
                        </div>
                      ) : (
                        <div className="max-h-80 overflow-y-auto border-2 border-indigo-200 rounded-xl bg-white shadow-inner">
                          {filteredUsers.length === 0 ? (
                            <div className="p-8 text-center">
                              <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                              <p className="text-gray-600 font-medium">No users found matching your criteria.</p>
                            </div>
                          ) : (
                            <div className="divide-y-2 divide-gray-100">
                              {filteredUsers.map((user) => (
                                <div key={user.uid} className="flex items-center space-x-3 p-4 hover:bg-indigo-50 transition-colors duration-150">
                                  <input
                                    type="checkbox"
                                    checked={selectedMarketingUsers.includes(user.uid)}
                                    onChange={() => handleMarketingUserToggle(user.uid)}
                                    className="h-5 w-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 flex-wrap">
                                      <span className="text-sm font-bold text-gray-900 truncate">{user.email}</span>
                                      {user.marketingEmails !== true && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                          Marketing disabled
                                        </span>
                                      )}
                                    </div>
                                    {user.displayName && (
                                      <p className="text-sm text-gray-600 truncate font-medium mt-0.5">{user.displayName}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="submit"
                disabled={isSubmittingMarketing}
                className="min-w-[160px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                {isSubmittingMarketing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Campaign
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Email Statistics */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/50 border-b-2 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Campaign Statistics
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-5 border-2 border-indigo-200 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50/50 shadow-md">
              <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{allUsers.length}</div>
              <div className="text-sm text-indigo-700 font-bold mt-1">Total Users</div>
            </div>
            <div className="text-center p-5 border-2 border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50/50 shadow-md">
              <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {allUsers.filter(user => user.marketingEmails === true).length}
              </div>
              <div className="text-sm text-green-700 font-bold mt-1">Marketing Enabled</div>
            </div>
            <div className="text-center p-5 border-2 border-purple-200 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50/50 shadow-md">
              <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {sendMarketingToAllUsers ?
                  allUsers.filter(user => user.marketingEmails === true).length :
                  selectedMarketingUsers.length
                }
              </div>
              <div className="text-sm text-purple-700 font-bold mt-1">Target Recipients</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};