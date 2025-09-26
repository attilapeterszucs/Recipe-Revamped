import React, { useState, useEffect } from 'react';
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
  UserCheck,
  Search,
} from 'lucide-react';
import { createNotificationForAllUsers, createNotificationForSelectedUsers, getAdminStats, getAllUsersWithEmails } from '../lib/adminNotifications';
import type { NotificationData } from '../types/notifications';
import { useToast } from './ToastContainer';

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
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalNotifications: 0 });
  const [loadingStats, setLoadingStats] = useState(true);


  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadStats();
    loadUsers();
  }, []);

  const loadStats = async () => {
    try {
      const adminStats = await getAdminStats();
      setStats(adminStats);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await getAllUsersWithEmails();
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Error', 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      console.error('Error sending notifications:', error);
      showError('Send Failed', 'Failed to send notifications. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    setSelectedUsers(availableUsers.map(user => user.uid));
  };

  const handleDeselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const filteredUsers = availableUsers.filter(user =>
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );


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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <Shield className="w-6 h-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Admin Notification Center</h3>
            <p className="text-sm text-red-700">Send notifications to all registered users</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingStats ? '...' : stats.totalUsers}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <Send className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingStats ? '...' : stats.totalNotifications}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Reach</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingStats ? '...' : `${stats.totalUsers} users`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Creation Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Create New Notification</h4>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'info', label: 'Info', icon: Info, color: 'blue' },
                { value: 'success', label: 'Success', icon: CheckCircle, color: 'green' },
                { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'yellow' },
                { value: 'update', label: 'Update', icon: AlertCircle, color: 'blue' }
              ].map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: value as NotificationData['type'] }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.type === value
                      ? `border-${color}-500 bg-${color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${
                    formData.type === value ? `text-${color}-600` : 'text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    formData.type === value ? `text-${color}-700` : 'text-gray-600'
                  }`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Notification Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter notification title..."
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-500">{formData.title.length}/100 characters</p>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Notification Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter notification message..."
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">{formData.message.length}/500 characters</p>
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Recipients
            </label>

            {/* Send to All Users Toggle */}
            <div className="mb-4">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="sendToAll"
                  name="sendMode"
                  checked={sendToAllUsers}
                  onChange={() => setSendToAllUsers(true)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="sendToAll" className="text-sm font-medium text-gray-700">
                  Send to all {stats.totalUsers} registered users
                </label>
              </div>

              <div className="flex items-center space-x-3 mt-2">
                <input
                  type="radio"
                  id="sendToSelected"
                  name="sendMode"
                  checked={!sendToAllUsers}
                  onChange={() => setSendToAllUsers(false)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="sendToSelected" className="text-sm font-medium text-gray-700">
                  Send to selected users only
                </label>
              </div>
            </div>

            {/* User Selection Interface */}
            {!sendToAllUsers && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users by email or name..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    {selectedUsers.length} of {filteredUsers.length} users selected
                  </div>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllUsers}
                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllUsers}
                      className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* User List */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Loading users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.uid}
                        className="flex items-center space-x-3 p-2 bg-white rounded border"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.uid)}
                          onChange={() => handleUserToggle(user.uid)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'No display name'}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                          {user.emailPreferences?.notifications === false && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Email notifications disabled
                            </span>
                          )}
                        </div>
                        {sendAsEmail && user.emailPreferences?.notifications !== false && (
                          <Mail className="w-4 h-4 text-green-600" title="Will receive email notification" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Email Notification Option */}
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="sendAsEmail"
                checked={sendAsEmail}
                onChange={(e) => setSendAsEmail(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="sendAsEmail" className="block text-sm font-medium text-blue-800">
                  📧 Also send as email notification
                </label>
                <p className="text-xs text-blue-600 mt-1">
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
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {sendToAllUsers ? (
                <>
                  This will send an in-app notification to all {stats.totalUsers} registered users
                  {sendAsEmail && (
                    <div className="mt-1 text-xs text-blue-600 font-medium">
                      + Email notifications to users with email notifications enabled
                    </div>
                  )}
                </>
              ) : (
                <>
                  This will send an in-app notification to {selectedUsers.length} selected user{selectedUsers.length !== 1 ? 's' : ''}
                  {sendAsEmail && (
                    <div className="mt-1 text-xs text-blue-600 font-medium">
                      + Email notifications to selected users with email notifications enabled
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.message.trim() || (!sendToAllUsers && selectedUsers.length === 0)}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
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