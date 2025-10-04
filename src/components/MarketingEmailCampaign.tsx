import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Mail, Users, Send, Search, Clock, AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
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
                <select
                  id="emailTemplate"
                  onChange={(e) => {
                    const template = e.target.value;
                    if (template === 'welcome') {
                      setMarketingEmailData(prev => ({
                        ...prev,
                        recipeName: 'Welcome to Recipe Revamped!',
                        recipeContent: 'Transform your cooking experience with our AI-powered recipe tools and personalized meal planning.'
                      }));
                    } else if (template === 'weekly_recipe') {
                      setMarketingEmailData(prev => ({
                        ...prev,
                        recipeName: 'This Week\'s Featured Recipe',
                        recipeContent: 'Discover a delicious new recipe handpicked by our culinary team and convert it to your perfect serving size!'
                      }));
                    } else if (template === 'features') {
                      setMarketingEmailData(prev => ({
                        ...prev,
                        recipeName: 'Unlock Recipe Revamped\'s Full Potential',
                        recipeContent: 'From AI recipe conversion to meal planning - explore all the features that make cooking easier and more enjoyable.'
                      }));
                    } else if (template === 'comeback') {
                      setMarketingEmailData(prev => ({
                        ...prev,
                        recipeName: 'We Miss You in the Kitchen!',
                        recipeContent: 'Come back and discover new recipes, convert your favorites, and plan your meals with Recipe Revamped.'
                      }));
                    } else if (template === 'custom') {
                      setMarketingEmailData(prev => ({
                        ...prev,
                        recipeName: '',
                        recipeContent: ''
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
                >
                  <option value="custom">📝 Custom Email</option>
                  <option value="welcome">🎉 Welcome Email</option>
                  <option value="weekly_recipe">🍳 Weekly Recipe Feature</option>
                  <option value="features">✨ Feature Showcase</option>
                  <option value="comeback">💚 Re-engagement Email</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipeName">Email Subject</Label>
                  <Input
                    id="recipeName"
                    value={marketingEmailData.recipeName}
                    onChange={(e) => setMarketingEmailData(prev => ({ ...prev, recipeName: e.target.value }))}
                    placeholder="e.g., Welcome to Recipe Revamped!"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Email Frequency</Label>
                  <select
                    id="frequency"
                    value={marketingEmailData.frequency}
                    onChange={(e) => setMarketingEmailData(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipeContent">Email Content</Label>
              <textarea
                id="recipeContent"
                value={marketingEmailData.recipeContent}
                onChange={(e) => setMarketingEmailData(prev => ({ ...prev, recipeContent: e.target.value }))}
                placeholder="Enter your marketing message. This will be the main content of your email campaign..."
                className="min-h-[200px] w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="text-sm text-gray-500">
                💡 Tip: Use the templates above for pre-written content designed to engage users and drive them to your website.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="overrideFrequency"
                checked={marketingEmailData.overrideFrequency}
                onChange={(e) => setMarketingEmailData(prev => ({ ...prev, overrideFrequency: e.target.checked }))}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <Label htmlFor="overrideFrequency" className="text-sm">
                Override frequency limits (send regardless of user's last email date)
              </Label>
            </div>

            <Separator />

            {/* User Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Target Recipients</h3>
                <div className="flex items-center gap-2">
                  {marketingEmailData.overrideFrequency ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        Override frequency limits - Send immediately
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Respects user frequency preferences
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="allUsers"
                    name="userSelection"
                    checked={sendMarketingToAllUsers}
                    onChange={() => setSendMarketingToAllUsers(true)}
                    className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <Label htmlFor="allUsers">Send to all eligible users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="selectedUsers"
                    name="userSelection"
                    checked={!sendMarketingToAllUsers}
                    onChange={() => setSendMarketingToAllUsers(false)}
                    className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <Label htmlFor="selectedUsers">Send to selected users</Label>
                </div>
              </div>

              {!sendMarketingToAllUsers && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Select Users</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUserList(!showUserList)}
                    >
                      {showUserList ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showUserList ? 'Hide' : 'Show'} User List
                    </Button>
                  </div>

                  {showUserList && (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Search users by email or name..."
                              value={userSearchTerm}
                              onChange={(e) => setUserSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="emailEnabled"
                            checked={showOnlyEmailEnabled}
                            onChange={(e) => setShowOnlyEmailEnabled(e.target.checked)}
                            className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <Label htmlFor="emailEnabled" className="text-sm">Marketing emails enabled (Settings &gt; Notifications)</Label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {selectedMarketingUsers.length} of {filteredUsers.length} selected
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleMarketingSelectAll}
                        >
                          {selectedMarketingUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>

                      {loadingUsers ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="ml-2">Loading users...</span>
                        </div>
                      ) : (
                        <div className="max-h-80 overflow-y-auto border rounded">
                          {filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                              No users found matching your criteria.
                            </div>
                          ) : (
                            <div className="divide-y">
                              {filteredUsers.map((user) => (
                                <div key={user.uid} className="flex items-center space-x-3 p-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedMarketingUsers.includes(user.uid)}
                                    onChange={() => handleMarketingUserToggle(user.uid)}
                                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium truncate">{user.email}</span>
                                      {user.marketingEmails !== true && (
                                        <Badge variant="secondary" className="text-xs">
                                          Marketing disabled
                                        </Badge>
                                      )}
                                    </div>
                                    {user.displayName && (
                                      <p className="text-sm text-muted-foreground truncate">{user.displayName}</p>
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