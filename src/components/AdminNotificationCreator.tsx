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
  Eye,
  Filter,
  UserCheck,
  Zap,
  Bell,
  CheckCheck,
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


  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          gradient: 'from-green-600 to-emerald-600',
          lightBg: 'from-green-50 to-emerald-50',
          border: 'border-green-300',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          textColor: 'text-green-700'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          gradient: 'from-yellow-600 to-orange-600',
          lightBg: 'from-yellow-50 to-orange-50',
          border: 'border-yellow-300',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-700'
        };
      case 'update':
        return {
          icon: Bell,
          gradient: 'from-purple-600 to-pink-600',
          lightBg: 'from-purple-50 to-pink-50',
          border: 'border-purple-300',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          textColor: 'text-purple-700'
        };
      case 'info':
      default:
        return {
          icon: Info,
          gradient: 'from-blue-600 to-cyan-600',
          lightBg: 'from-blue-50 to-cyan-50',
          border: 'border-blue-300',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-700'
        };
    }
  };

  const typeConfig = getTypeConfig(formData.type);
  const TypeIcon = typeConfig.icon;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header - Landing Page Style */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 rounded-3xl shadow-2xl">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="relative px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white mb-1">Admin Notification Center</h1>
                <p className="text-white/90 text-sm font-medium">Send notifications to users across the platform</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
              <Zap className="w-4 h-4" />
              Instant Delivery
            </div>
          </div>

          {/* Stats Grid - Landing Page Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Total Users</p>
                  <p className="text-3xl font-black text-white">
                    {loadingStats ? '...' : stats.totalUsers.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Send className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Sent Notifications</p>
                  <p className="text-3xl font-black text-white">
                    {loadingStats ? '...' : stats.totalNotifications.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Potential Reach</p>
                  <p className="text-3xl font-black text-white">
                    {loadingStats ? '...' : `${stats.totalUsers.toLocaleString()}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form - Modern Card Design */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Section 1: Notification Type */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Notification Type</h3>
                <p className="text-sm text-gray-600">Choose how this notification will appear</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: 'info', label: 'Information', icon: Info, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', border: 'border-blue-300' },
                { value: 'success', label: 'Success', icon: CheckCircle, gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-50', border: 'border-green-300' },
                { value: 'warning', label: 'Warning', icon: AlertTriangle, gradient: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50', border: 'border-yellow-300' },
                { value: 'update', label: 'Update', icon: Bell, gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', border: 'border-purple-300' }
              ].map(({ value, label, icon: Icon, gradient, bg, border }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: value as NotificationData['type'] }))}
                  className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 ${
                    formData.type === value
                      ? `${border} ${bg} shadow-lg transform scale-105 ring-2 ring-offset-2 ring-${value === 'info' ? 'blue' : value === 'success' ? 'green' : value === 'warning' ? 'yellow' : 'purple'}-300`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-102'
                  }`}
                >
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    formData.type === value
                      ? `bg-gradient-to-br ${gradient} shadow-lg`
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon className={`w-6 h-6 ${formData.type === value ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <span className={`text-sm font-bold block ${
                    formData.type === value ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {label}
                  </span>
                  {formData.type === value && (
                    <div className="absolute top-2 right-2">
                      <CheckCheck className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-100" />

          {/* Section 2: Notification Content */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeConfig.iconBg}`}>
                <TypeIcon className={`w-5 h-5 ${typeConfig.iconColor}`} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Notification Content</h3>
                <p className="text-sm text-gray-600">Write your message for users</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-bold text-gray-800 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium text-gray-900 placeholder:text-gray-400"
                  placeholder="Enter a clear, concise title..."
                  maxLength={100}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 font-medium">Keep it short and impactful</p>
                  <p className={`text-xs font-bold ${formData.title.length > 90 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {formData.title.length}/100
                  </p>
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-bold text-gray-800 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium text-gray-900 placeholder:text-gray-400 resize-none"
                  placeholder="Write a clear message explaining what users need to know..."
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 font-medium">Be clear and actionable</p>
                  <p className={`text-xs font-bold ${formData.message.length > 450 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {formData.message.length}/500
                  </p>
                </div>
              </div>

              {/* Live Preview */}
              {formData.title && formData.message && (
                <div className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <label className="block text-sm font-bold text-gray-800">Live Preview</label>
                  </div>
                  <div className={`p-5 rounded-2xl border-2 ${typeConfig.border} bg-gradient-to-br ${typeConfig.lightBg} shadow-md`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${typeConfig.iconBg} shadow-md`}>
                        <TypeIcon className={`w-6 h-6 ${typeConfig.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 mb-2 text-lg">{formData.title}</h4>
                        <p className="text-gray-700 leading-relaxed">{formData.message}</p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Just now</span>
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

          {/* Section 3: Recipients */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Select Recipients</h3>
                <p className="text-sm text-gray-600">Choose who will receive this notification</p>
              </div>
            </div>

            {/* Recipient Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setSendToAllUsers(true)}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                  sendToAllUsers
                    ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-2 ring-green-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    sendToAllUsers
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg'
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Users className={`w-6 h-6 ${sendToAllUsers ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900">All Users</h4>
                      {sendToAllUsers && <CheckCheck className="w-5 h-5 text-green-600" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Send to all registered users</p>
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                      <UserCheck className="w-3 h-3" />
                      {stats.totalUsers.toLocaleString()} users
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSendToAllUsers(false)}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                  !sendToAllUsers
                    ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg ring-2 ring-purple-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    !sendToAllUsers
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg'
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Filter className={`w-6 h-6 ${!sendToAllUsers ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900">Selected Users</h4>
                      {!sendToAllUsers && <CheckCheck className="w-5 h-5 text-purple-600" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Manually choose recipients</p>
                    {!sendToAllUsers && selectedUsers.length > 0 && (
                      <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                        <UserCheck className="w-3 h-3" />
                        {selectedUsers.length} selected
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* User Selection Interface */}
            {!sendToAllUsers && (
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

                {/* Email Filter - Only show when email is enabled */}
                {sendAsEmail && (
                  <div className="mb-5 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="showOnlyEmailEnabled"
                        checked={showOnlyEmailEnabled}
                        onChange={(e) => setShowOnlyEmailEnabled(e.target.checked)}
                        className="mt-0.5 h-5 w-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <label htmlFor="showOnlyEmailEnabled" className="text-sm font-bold text-gray-900 cursor-pointer flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          Show only users with email notifications enabled
                        </label>
                        <p className="text-xs text-blue-700 mt-1 font-medium">
                          {showOnlyEmailEnabled
                            ? `Showing ${filteredUsers.length} users with email enabled`
                            : `Showing all ${filteredUsers.length} users`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bulk Actions */}
                <div className="flex items-center justify-between mb-4 p-4 bg-white border-2 border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold shadow-md">
                      {selectedUsers.length} of {filteredUsers.length}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">selected</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllUsers}
                      className="px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-all duration-200 font-bold text-sm hover:scale-105"
                    >
                      {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedUsers.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeselectAllUsers}
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
                      <Loader className="w-8 h-8 animate-spin text-purple-600 mb-3" />
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
                            checked={selectedUsers.includes(user.uid)}
                            onChange={() => handleUserToggle(user.uid)}
                            className="h-5 w-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                              {user.displayName || 'No display name'}
                            </div>
                            <div className="text-xs text-gray-600 truncate font-medium">{user.email}</div>
                          </div>
                          {sendAsEmail && (
                            <div className="flex-shrink-0">
                              {user.emailNotifications === true ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                  <Mail className="w-3 h-3" />
                                  Email OK
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">
                                  <Mail className="w-3 h-3" />
                                  No Email
                                </div>
                              )}
                            </div>
                          )}
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

          {/* Section 4: Delivery Options */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Delivery Options</h3>
                <p className="text-sm text-gray-600">Choose how to deliver notifications</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSendAsEmail(!sendAsEmail)}
              className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                sendAsEmail
                  ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  sendAsEmail
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg'
                    : 'bg-gray-100'
                }`}>
                  <Mail className={`w-6 h-6 ${sendAsEmail ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900">Also send as email</h4>
                    {sendAsEmail && <CheckCheck className="w-5 h-5 text-blue-600" />}
                  </div>
                  <p className="text-sm text-gray-600">
                    Send email notifications to users who have email notifications enabled in their settings
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-100" />

          {/* Submit Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4">
            <div className="flex-1">
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200">
                <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Ready to send</p>
                  {sendToAllUsers ? (
                    <p className="text-sm text-gray-700">
                      This will send to <span className="font-bold text-green-600">{stats.totalUsers.toLocaleString()}</span> users
                      {sendAsEmail && <span className="block mt-1 text-xs text-blue-600 font-bold">+ Email notifications where enabled</span>}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-700">
                      This will send to <span className="font-bold text-purple-600">{selectedUsers.length}</span> selected user{selectedUsers.length !== 1 ? 's' : ''}
                      {sendAsEmail && <span className="block mt-1 text-xs text-blue-600 font-bold">+ Email notifications where enabled</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.message.trim() || (!sendToAllUsers && selectedUsers.length === 0)}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-lg min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Notification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Clock icon import at the top
const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
