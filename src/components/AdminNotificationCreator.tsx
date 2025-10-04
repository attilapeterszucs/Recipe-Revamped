import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Users,
  CheckCircle,
  Info,
  AlertTriangle,
  AlertCircle,
  Loader,
  BarChart3,
  Shield,
  Mail,
  Search,
} from 'lucide-react';
import { createNotificationForAllUsers, createNotificationForSelectedUsers, getAdminStats, getAllUsersWithEmails } from '../lib/adminNotifications';
import type { NotificationData } from '../types/notifications';
import { useToast } from './ToastContainer';
import { logger } from '../lib/logger';

interface AdminNotificationCreatorProps {
  adminUserId: string;
  adminEmail: string;
}

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  emailPreferences?: {
    notifications?: boolean;
  };
  emailNotifications?: boolean;
}

export const AdminNotificationCreator: React.FC<AdminNotificationCreatorProps> = ({
  adminUserId,
  adminEmail
}) => {
  const [formData, setFormData] = useState<NotificationData>({
    title: '',
    message: '',
    type: 'info'
  });

  const [sendAsEmail, setSendAsEmail] = useState(false);
  const [sendToAllUsers, setSendToAllUsers] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showOnlyEmailEnabled, setShowOnlyEmailEnabled] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalNotifications: 0 });
  const [loadingStats, setLoadingStats] = useState(true);


  const { showSuccess, showError } = useToast();

  const loadStats = useCallback(async () => {
    try {
      const adminStats = await getAdminStats();
      setStats(adminStats);
    } catch (error) {
      logger.error('Error loading admin stats', { error });
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const users = await getAllUsersWithEmails();
      setAvailableUsers(users);
      logger.info(`Admin notifications: Loaded ${users.length} total users`);
    } catch (error) {
      logger.error('Error loading users', { error });
      showError('Error', 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [showError]);

  const filterUsers = useCallback(() => {
    let filtered = availableUsers;

    // Only filter by email notifications when "Send as Email" is enabled
    if (sendAsEmail && showOnlyEmailEnabled) {
      filtered = filtered.filter(user => user.emailNotifications === true);
    }

    if (userSearchTerm.trim()) {
      const searchLower = userSearchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchLower) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchLower))
      );
    }

    setFilteredUsers(filtered);
  }, [availableUsers, sendAsEmail, showOnlyEmailEnabled, userSearchTerm]);

  useEffect(() => {
    loadStats();
    loadUsers();
  }, [loadStats, loadUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    const currentlySelected = selectedUsers.length === filteredUsers.length;
    if (currentlySelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.uid));
    }
  };

  const handleDeselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      showError('Validation Error', 'Title and message are required');
      return;
    }

    if (!sendToAllUsers && selectedUsers.length === 0) {
      showError('Validation Error', 'Please select at least one user or choose "Send to All Users"');
      return;
    }

    setIsSubmitting(true);
    try {
      let successCount: number;

      if (sendToAllUsers) {
        successCount = await createNotificationForAllUsers(formData, adminUserId, adminEmail, sendAsEmail);
      } else {
        successCount = await createNotificationForSelectedUsers(formData, selectedUsers, adminUserId, adminEmail, sendAsEmail);
      }

      const emailMessage = sendAsEmail ? ' (including email notifications)' : '';
      showSuccess(
        'Notifications Sent!',
        `Successfully sent notification to ${successCount} users${emailMessage}`
      );

      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info'
      });
      setSendAsEmail(false);
      setSendToAllUsers(true);
      setSelectedUsers([]);

      // Reload stats
      await loadStats();

    } catch (error) {
      logger.error('Error sending notifications', { error });
      showError('Send Failed', 'Failed to send notifications. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'update':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'update':
        return 'border-blue-200 bg-blue-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50/50 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Admin Notification Center</h3>
            <p className="text-sm text-red-700 font-medium">Send notifications to all registered users</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 rounded-2xl p-5 border-2 border-blue-200 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-bold">Total Users</p>
              <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {loadingStats ? '...' : stats.totalUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-2xl p-5 border-2 border-green-200 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-md">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-bold">Total Notifications</p>
              <p className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {loadingStats ? '...' : stats.totalNotifications}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50/50 rounded-2xl p-5 border-2 border-purple-200 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center shadow-md">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-700 font-bold">Reach</p>
              <p className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {loadingStats ? '...' : `${stats.totalUsers}`}
              </p>
              <p className="text-xs text-purple-600 font-medium">users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Creation Form */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-2xl border-2 border-indigo-200 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center shadow-md">
            <Send className="w-5 h-5 text-indigo-600" />
          </div>
          <h4 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Create New Notification</h4>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Notification Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'info', label: 'Info', icon: Info, gradient: 'from-blue-500 to-cyan-500', bg: 'from-blue-50 to-cyan-50/50', border: 'border-blue-300' },
                { value: 'success', label: 'Success', icon: CheckCircle, gradient: 'from-green-500 to-emerald-500', bg: 'from-green-50 to-emerald-50/50', border: 'border-green-300' },
                { value: 'warning', label: 'Warning', icon: AlertTriangle, gradient: 'from-yellow-500 to-amber-500', bg: 'from-yellow-50 to-amber-50/50', border: 'border-yellow-300' },
                { value: 'update', label: 'Update', icon: AlertCircle, gradient: 'from-purple-500 to-pink-500', bg: 'from-purple-50 to-pink-50/50', border: 'border-purple-300' }
              ].map(({ value, label, icon: Icon, gradient, bg, border }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: value as NotificationData['type'] }))}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.type === value
                      ? `${border} bg-gradient-to-br ${bg} shadow-lg transform scale-105`
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
                  }`}
                >
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${
                    formData.type === value ? `bg-gradient-to-br ${gradient}` : 'bg-gray-200'
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-sm font-bold block ${
                    formData.type === value ? 'text-gray-800' : 'text-gray-600'
                  }`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-gray-800 mb-2">
              Notification Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium"
              placeholder="Enter notification title..."
              maxLength={100}
            />
            <p className="mt-2 text-xs text-gray-600 font-medium">{formData.title.length}/100 characters</p>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-bold text-gray-800 mb-2">
              Notification Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium resize-none"
              placeholder="Enter notification message..."
              maxLength={500}
            />
            <p className="mt-2 text-xs text-gray-600 font-medium">{formData.message.length}/500 characters</p>
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Select Recipients
            </label>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-xl p-3 mb-4 shadow-sm">
              <p className="text-xs text-blue-800 font-medium">
                ℹ️ Email notification filters will appear when "Send as Email" is enabled
              </p>
            </div>

            {/* Send to All Users Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 transition-all duration-200 hover:border-indigo-300 hover:shadow-md">
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id="sendToAll"
                    name="sendMode"
                    checked={sendToAllUsers}
                    onChange={() => setSendToAllUsers(true)}
                    className="mt-1 h-5 w-5 text-purple-600 border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="sendToAll" className="text-sm font-bold text-gray-800 cursor-pointer">
                      Send to all registered users
                    </label>
                    <p className="text-xs text-gray-600 mt-1 font-medium">
                      Targets all {stats.totalUsers} users
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 transition-all duration-200 hover:border-indigo-300 hover:shadow-md">
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id="sendToSelected"
                    name="sendMode"
                    checked={!sendToAllUsers}
                    onChange={() => setSendToAllUsers(false)}
                    className="mt-1 h-5 w-5 text-purple-600 border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="sendToSelected" className="text-sm font-bold text-gray-800 cursor-pointer">
                      Send to selected users
                    </label>
                    <p className="text-xs text-gray-600 mt-1 font-medium">
                      Manually choose recipients
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Selection Interface */}
            {!sendToAllUsers && (
              <div className="border-2 border-indigo-200 rounded-xl p-5 bg-gradient-to-br from-indigo-50 to-blue-50/50 shadow-md">
                {/* Search */}
                <div className="mb-4">
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
                </div>

                {/* Filter Toggle - Only show when "Send as Email" is enabled */}
                {sendAsEmail && (
                  <div className="mb-4 bg-white border-2 border-indigo-200 rounded-xl p-3 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="showOnlyEmailEnabled"
                        checked={showOnlyEmailEnabled}
                        onChange={(e) => setShowOnlyEmailEnabled(e.target.checked)}
                        className="mt-0.5 h-5 w-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <label htmlFor="showOnlyEmailEnabled" className="text-sm font-bold text-gray-800 cursor-pointer">
                          Show only users with email notifications enabled
                        </label>
                        <p className="text-xs text-indigo-700 mt-1 font-medium">
                          {showOnlyEmailEnabled
                            ? `Showing ${filteredUsers.length} users with email notifications enabled`
                            : `Showing all ${filteredUsers.length} users (some may have notifications disabled)`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info message when email sending is disabled */}
                {!sendAsEmail && (
                  <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-xl shadow-sm">
                    <p className="text-sm text-blue-800 font-medium">
                      ℹ️ All users are shown since only in-app notifications will be sent (no email filtering needed)
                    </p>
                  </div>
                )}

                {/* Bulk Actions */}
                <div className="flex items-center justify-between mb-4 p-3 bg-white border-2 border-indigo-200 rounded-xl">
                  <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg text-sm font-bold shadow-md">
                    {selectedUsers.length} of {filteredUsers.length} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllUsers}
                      className="px-4 py-2 bg-white border-2 border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all duration-200 font-bold text-sm"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllUsers}
                      className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-bold text-sm"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* User List */}
                <div className="max-h-80 overflow-y-auto border-2 border-indigo-200 rounded-xl bg-white shadow-inner">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-6 h-6 animate-spin text-indigo-600 mr-3" />
                      <span className="text-indigo-700 font-bold">Loading users...</span>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">No users found</p>
                    </div>
                  ) : (
                    <div className="divide-y-2 divide-gray-100">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.uid}
                          className="flex items-center space-x-3 p-4 hover:bg-indigo-50 transition-colors duration-150"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.uid)}
                            onChange={() => handleUserToggle(user.uid)}
                            className="h-5 w-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate">
                              {user.displayName || 'No display name'}
                            </div>
                            <div className="text-xs text-gray-600 truncate font-medium">{user.email}</div>
                            {user.emailPreferences?.notifications === false && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200 mt-1">
                                Email notifications disabled
                              </span>
                            )}
                          </div>
                          {sendAsEmail && (
                            user.emailNotifications === true ? (
                              <div title="Will receive email notification" className="flex-shrink-0">
                                <Mail className="w-5 h-5 text-green-600" />
                              </div>
                            ) : (
                              <div title="Email notifications disabled - will only receive in-app notification" className="flex-shrink-0">
                                <Mail className="w-5 h-5 text-gray-400" />
                              </div>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Email Notification Option */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-xl p-4 shadow-md">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="sendAsEmail"
                checked={sendAsEmail}
                onChange={(e) => setSendAsEmail(e.target.checked)}
                className="mt-1 h-5 w-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="sendAsEmail" className="block text-sm font-bold text-gray-800 cursor-pointer">
                  📧 Also send as email notification
                </label>
                <p className="text-xs text-blue-800 mt-1 font-medium">
                  Send this notification via email to users who have email notifications enabled in their settings
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {formData.title && formData.message && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className={`p-4 rounded-lg border ${getTypeColor(formData.type)}`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getTypeIcon(formData.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{formData.title}</h4>
                    <p className="text-gray-700 text-sm">{formData.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
            <div className="text-sm text-gray-700 font-medium">
              {sendToAllUsers ? (
                <>
                  This will send an in-app notification to all <span className="font-bold text-indigo-700">{stats.totalUsers}</span> registered users
                  {sendAsEmail && (
                    <div className="mt-1 text-xs text-blue-700 font-bold">
                      📧 + Email notifications to users with email notifications enabled
                    </div>
                  )}
                </>
              ) : (
                <>
                  This will send an in-app notification to <span className="font-bold text-indigo-700">{selectedUsers.length}</span> selected user{selectedUsers.length !== 1 ? 's' : ''}
                  {sendAsEmail && (
                    <div className="mt-1 text-xs text-blue-700 font-bold">
                      📧 + Email notifications to selected users with email notifications enabled
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.message.trim() || (!sendToAllUsers && selectedUsers.length === 0)}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {sendToAllUsers ? 'Send to All Users' : `Send to ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};