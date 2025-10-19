import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  UserMinus,
  Shield,
  ShieldCheck,
  Search,
  Crown,
  Loader,
  Check,
  X,
  Settings,
  RefreshCw,
  Calendar,
  Infinity,
  Copy
} from 'lucide-react';
import { getAllUsers } from '../lib/adminNotifications';
import { getAllAdmins, addAdminUser, removeAdminUser, isUserAdmin, type AdminUser } from '../lib/adminManagement';
import { getAllUserProfiles } from '../lib/userService';
import { SubscriptionService } from '../lib/subscriptionService';
import { getActiveSessions, type UserSession } from '../lib/sessionTracking';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionPlan, UserSubscription } from '../types/subscription';
import { useToast } from './ToastContainer';
import { useSubscriptionRefresh } from '../contexts/SubscriptionContext';
import { logger } from '../lib/logger';

interface AdminUserManagementProps {
  currentAdminUid: string;
  currentAdminEmail: string;
}

interface UserInfo {
  uid: string;
  email?: string;
  displayName?: string;
  isAdmin: boolean;
  adminData?: AdminUser;
  subscriptionPlan?: SubscriptionPlan;
  lastActiveAt?: any;
  isOnline?: boolean;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  currentAdminUid,
  currentAdminEmail
}) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentAdminData, setCurrentAdminData] = useState<AdminUser | null>(null);
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<string>('');
  const [isForever, setIsForever] = useState<boolean>(false);
  const [selectedPlanForChange, setSelectedPlanForChange] = useState<SubscriptionPlan | null>(null);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const { showSuccess, showError } = useToast();
  const { refreshSubscription } = useSubscriptionRefresh();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Clear any existing state to force fresh data
      setUsers([]);
      setAdmins([]);
      
      // First check if current user is actually an admin
      const isCurrentUserAdmin = await isUserAdmin(currentAdminEmail, currentAdminUid);
      
      if (!isCurrentUserAdmin) {
        logger.error('[AdminUserManagement] Current user is not an admin - cannot access admin functions');
        showError('Access Denied', 'You do not have admin privileges');
        setLoading(false);
        return;
      }
      
      const [allUserIds, adminUsers, userProfiles] = await Promise.all([
        getAllUsers(),
        getAllAdmins(),
        getAllUserProfiles()
      ]);
      
      
      setAdmins(adminUsers);
      
      // Get current admin's data
      const currentAdmin = adminUsers.find(admin => admin.uid === currentAdminUid);
      setCurrentAdminData(currentAdmin || null);
      
      // Combine user IDs from all sources
      const allUserUids = new Set([
        ...allUserIds,
        ...adminUsers.map(admin => admin.uid),
        ...userProfiles.map(profile => profile.uid)
      ]);
      
      // Build user info array
      const userInfoPromises = Array.from(allUserUids).map(async (uid) => {
        const adminData = adminUsers.find(admin => admin.uid === uid);
        const userProfile = userProfiles.find(profile => profile.uid === uid);
        
        let subscriptionPlan: SubscriptionPlan = 'free';
        
        try {
          const subscription = await SubscriptionService.getUserSubscription(uid);
          subscriptionPlan = subscription?.plan || 'free';
        } catch (error) {
          logger.error(`Error loading subscription for ${uid}:`, { error, uid });
        }
        
        // Only include users with valid email addresses (filter out fake users)
        const hasValidEmail = userProfile?.email || adminData?.email;
        if (!hasValidEmail) {
          return null; // Filter out users without real email addresses
        }

        // Online status will be set by real-time session listener
        // Initial value is false, will be updated when session data arrives
        const isOnline = false;

        return {
          uid,
          email: userProfile?.email || adminData?.email || '',
          displayName: userProfile?.displayName || adminData?.displayName || 'Unknown User',
          isAdmin: !!adminData,
          adminData,
          subscriptionPlan,
          lastActiveAt: userProfile?.lastActiveAt,
          isOnline
        };
      });
      
      const userInfos = await Promise.all(userInfoPromises);
      // Filter out null values (fake users) and sort
      const validUsers = userInfos.filter(user => user !== null) as UserInfo[];
      
      setUsers(validUsers.sort((a, b) => {
        // Sort admins first, then by email
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        return (a.email || '').localeCompare(b.email || '');
      }));
      
    } catch (error) {
      logger.error('Error loading admin data:', { error });
      showError('Load Failed', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [currentAdminUid, currentAdminEmail, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen to real-time active sessions
  useEffect(() => {
    console.log('[AdminUserManagement] Setting up real-time session listener');

    const unsubscribe = getActiveSessions((sessions) => {
      console.log('[AdminUserManagement] Received session update:', sessions.length, 'active sessions');
      setActiveSessions(sessions);

      // Update users' online status based on active sessions
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => {
          const isOnline = sessions.some(session => session.uid === user.uid);
          if (user.isOnline !== isOnline) {
            console.log(`[AdminUserManagement] User ${user.email} online status changed: ${user.isOnline} -> ${isOnline}`);
          }
          return {
            ...user,
            isOnline
          };
        });
        return updatedUsers;
      });
    });

    return () => {
      console.log('[AdminUserManagement] Cleaning up session listener');
      unsubscribe();
    };
  }, []);

  // Check if current admin can grant admin privileges (only super admin or designated admin can)
  const canGrantAdmin = (): boolean => {
    if (!currentAdminData) return false;
    
    // Super admin can grant admin
    if (currentAdminData.role === 'super_admin') return true;
    
    // Designated admin (attilaszucs2002@gmail.com) can grant admin
    if (currentAdminEmail.toLowerCase() === 'attilaszucs2002@gmail.com') return true;
    
    return false;
  };

  const handleGrantAdmin = async (user: UserInfo) => {
    if (!user.email) {
      showError('Error', 'User email not available');
      return;
    }
    
    if (!canGrantAdmin()) {
      showError('Permission Denied', 'Only super admins can grant admin privileges to other users');
      return;
    }
    
    try {
      setActionLoading(`grant-${user.uid}`);
      
      const success = await addAdminUser(
        user.email,
        user.uid,
        user.displayName || 'Admin User',
        'admin',
        currentAdminUid
      );
      
      if (success) {
        showSuccess('Admin Added', `Successfully granted admin privileges to ${user.email}`);
        
        // Trigger global subscription refresh to update permissions immediately
        refreshSubscription();
        
        // Add a small delay to ensure database consistency before refreshing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh local data
        await loadData();
      } else {
        showError('Failed', 'Could not grant admin privileges');
      }
    } catch (error) {
      logger.error('Error granting admin:', { error });
      showError('Error', 'An error occurred while granting admin privileges');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAdmin = async (user: UserInfo) => {
    if (!user.email || user.uid === currentAdminUid) {
      showError('Error', 'Cannot revoke your own admin privileges');
      return;
    }
    
    try {
      setActionLoading(`revoke-${user.uid}`);
      
      const success = await removeAdminUser(
        user.email,
        user.uid,
        currentAdminUid
      );
      
      if (success) {
        showSuccess('Admin Removed', `Successfully revoked admin privileges from ${user.email}`);
        
        // Trigger global subscription refresh to update permissions immediately
        refreshSubscription();
        
        // Add a small delay to ensure database consistency before refreshing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh local data
        await loadData();
      } else {
        showError('Failed', 'Could not revoke admin privileges');
      }
    } catch (error) {
      logger.error('Error revoking admin:', { error });
      showError('Error', 'An error occurred while revoking admin privileges');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApplyPlanChange = async () => {
    if (!selectedPlanForChange) {
      showError('Error', 'Please select a plan');
      return;
    }

    if (!selectedExpiryDate && !isForever) {
      showError('Error', 'Please select an expiry date or check "Forever"');
      return;
    }

    const expiryDate = isForever ? new Date('9999-01-01') : new Date(selectedExpiryDate);
    await handleChangePlan(selectedPlanForChange, expiryDate, false);
  };

  const handleChangePlan = async (plan: SubscriptionPlan, expiryDate: Date | null = null, isForSelf: boolean = false) => {
    try {
      setActionLoading(`plan-${plan}`);

      const targetUid = isForSelf ? currentAdminUid : selectedUser?.uid;
      const targetEmail = isForSelf ? currentAdminEmail : selectedUser?.email;

      if (!targetUid || !targetEmail) {
        showError('Error', 'User information not available');
        return;
      }

      // Always use admin verification method
      const result = await SubscriptionService.adminSetUserPlan(
        currentAdminUid,
        targetUid,
        plan,
        currentAdminEmail,
        expiryDate
      );

      if (result.success) {
        const targetName = isForSelf ? 'your' : (selectedUser?.displayName || targetEmail);
        const expiryMessage = expiryDate && !isForSelf
          ? ` (expires ${expiryDate.toLocaleDateString()})`
          : '';

        showSuccess(
          'Plan Updated',
          `Successfully changed ${targetName} plan to ${SUBSCRIPTION_PLANS[plan].name}${expiryMessage}`
        );

        if (isForSelf) {
          // Trigger global subscription refresh for real-time updates
          refreshSubscription();
        }

        await loadData(); // Refresh data
        if (showUserModal) {
          setShowUserModal(false);
        }
      } else {
        const errorMessage = result.error || 'Could not update subscription plan';
        showError('Update Failed', errorMessage);
      }
    } catch (error) {
      logger.error('Error changing plan:', { error });

      // Handle specific error types
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('network') ||
            errorMessage.includes('blocked') ||
            errorMessage.includes('fetch') ||
            error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
          showError(
            'Network Error',
            'Request was blocked. Please check your ad blocker or network connection and try again.'
          );
        } else if (errorMessage.includes('permission') ||
                   errorMessage.includes('unauthorized')) {
          showError('Permission Denied', 'You don\'t have admin privileges to perform this action.');
        } else {
          showError('Update Failed', `An error occurred: ${error.message}`);
        }
      } else {
        showError('Update Failed', 'An unexpected error occurred while updating the plan');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid.includes(searchTerm)
  );

  // Count online users
  const onlineUsersCount = users.filter(user => user.isOnline).length;

  return (
    <div className="space-y-6">
      {/* Admin Panel Header */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50/50 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                User & Admin Management
              </h3>
              <p className="text-sm text-red-700 font-medium">Manage admin privileges and subscription plans</p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-200 font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* User Search */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center shadow-md">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">User Management</h4>
          <div className="ml-auto flex items-center gap-3">
            {loading ? (
              <>
                <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/30 flex items-center gap-2">
                  <Loader className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
                <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2">
                  <Loader className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
              </>
            ) : (
              <>
                <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/30 flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  {onlineUsersCount} online
                </span>
                <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30">
                  {users.length} users
                </span>
              </>
            )}
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users by email, name, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium placeholder:text-gray-400"
          />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader className="w-10 h-10 animate-spin text-blue-600" />
              <span className="text-gray-600 font-medium">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-600 font-medium">
              {searchTerm ? 'No users found matching your search' : 'No users found'}
            </div>
          ) : (
            filteredUsers.map((user) => (
            <div
              key={user.uid}
              className={`flex items-center justify-between p-4 rounded-xl border-2 shadow-md transition-all duration-200 hover:shadow-lg ${
                user.isAdmin
                  ? 'border-red-300 bg-gradient-to-br from-red-50 to-orange-50/50'
                  : 'border-gray-300 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                  user.isAdmin
                    ? 'bg-gradient-to-br from-red-500 to-orange-500'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  {user.isAdmin ? (
                    <ShieldCheck className="w-6 h-6 text-white" />
                  ) : (
                    <Users className="w-6 h-6 text-white" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900">
                        {user.displayName || 'Unknown User'}
                      </span>
                      {/* Online Indicator */}
                      {user.isOnline && (
                        <div className="relative flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div className="absolute w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                        </div>
                      )}
                    </div>
                    {user.isAdmin && (
                      <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/30">
                        Admin
                      </span>
                    )}
                    {user.uid === currentAdminUid && (
                      <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 rounded-xl text-xs font-bold shadow-md shadow-yellow-400/30">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {/* Colored Plan Badge */}
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${
                      user.subscriptionPlan === 'free'
                        ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700'
                        : user.subscriptionPlan === 'chef'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/30'
                        : user.subscriptionPlan === 'master-chef'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/30'
                        : user.subscriptionPlan === 'enterprise'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/30'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700'
                    }`}>
                      {SUBSCRIPTION_PLANS[user.subscriptionPlan || 'free'].name}
                    </span>

                    {/* User ID with Copy Button */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                      <span>ID: {user.uid.slice(0, 8)}...</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(user.uid);
                          showSuccess('Copied!', `User ID copied to clipboard`);
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy full user ID"
                      >
                        <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowUserModal(true);
                  }}
                  className="px-3 py-2 text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md shadow-blue-500/30 hover:shadow-lg hover:scale-105 font-bold"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Enhanced User Management Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95 border-2 border-gray-200 flex flex-col">
            {/* Header - Landing Page Style */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-6 relative overflow-hidden flex-shrink-0">
              {/* Animated blob background */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 -left-4 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-2xl animate-blob" />
                <div className="absolute top-0 -right-4 w-32 h-32 bg-yellow-300 rounded-full mix-blend-overlay filter blur-2xl animate-blob animation-delay-2000" />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-white/30">
                    <Settings className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white leading-tight">
                      {selectedUser.displayName}
                    </h3>
                    <p className="text-sm text-white/90 font-semibold mt-0.5">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedExpiryDate('');
                    setIsForever(false);
                    setSelectedPlanForChange(null);
                  }}
                  className="text-white/90 hover:text-white transition-all duration-200 p-2.5 rounded-xl hover:bg-white/20 backdrop-blur-sm group"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 sm:p-8 space-y-6 bg-gradient-to-b from-gray-50 to-white overflow-y-auto flex-1">
              {/* Admin Privileges Section */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 hover:border-red-300 transition-all duration-500 hover:shadow-xl hover:shadow-red-100 p-6 group">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-gray-900">
                      Admin Privileges
                    </h4>
                    <p className="text-sm text-gray-500 font-medium">Manage user administrative access</p>
                  </div>
                </div>

                {selectedUser.uid === currentAdminUid ? (
                  <div className="px-4 py-3 bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold border-2 border-gray-200 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-500" />
                    Cannot modify your own admin status
                  </div>
                ) : !canGrantAdmin() ? (
                  <div className="px-4 py-3 bg-orange-50 text-orange-700 rounded-xl text-sm font-semibold border-2 border-orange-200 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-500" />
                    Only super admins can manage admin privileges
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-700 mb-1">
                        Current Status: {selectedUser.isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">
                            <Users className="w-3 h-3" />
                            Regular User
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">
                        {selectedUser.isAdmin
                          ? 'This user has administrative access to the system'
                          : 'This user has standard user permissions'}
                      </p>
                    </div>
                    {selectedUser.isAdmin ? (
                      <button
                        onClick={() => handleRevokeAdmin(selectedUser)}
                        disabled={actionLoading === `revoke-${selectedUser.uid}`}
                        className="px-5 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-300 font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {actionLoading === `revoke-${selectedUser.uid}` ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Revoking...
                          </>
                        ) : (
                          <>
                            <UserMinus className="w-4 h-4" />
                            Revoke Admin
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGrantAdmin(selectedUser)}
                        disabled={actionLoading === `grant-${selectedUser.uid}`}
                        className="px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {actionLoading === `grant-${selectedUser.uid}` ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Granting...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Grant Admin
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Subscription Plan Section */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 hover:border-green-300 transition-all duration-500 hover:shadow-xl hover:shadow-green-100 p-6 group">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-gray-900">
                      Subscription Plan
                    </h4>
                    <p className="text-sm text-gray-500 font-medium">Manage user subscription and expiry</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Current Plan Display */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-300 rounded-xl p-4">
                    <label className="block text-xs font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Current Plan
                    </label>
                    <div className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {SUBSCRIPTION_PLANS[selectedUser.subscriptionPlan || 'free'].name}
                    </div>
                  </div>

                  {/* Plan Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      Select New Plan
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
                        <button
                          key={planId}
                          onClick={() => setSelectedPlanForChange(planId as SubscriptionPlan)}
                          type="button"
                          className={`p-5 rounded-xl border-2 transition-all duration-300 group ${
                            selectedPlanForChange === planId
                              ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl shadow-green-500/20 ring-2 ring-green-300'
                              : 'border-gray-200 hover:border-green-300 hover:bg-gradient-to-br hover:from-green-50/50 hover:to-emerald-50/50 hover:shadow-lg'
                          }`}
                        >
                          <div className="font-black text-base text-gray-900 group-hover:text-green-700 transition-colors">{plan.name}</div>
                          <div className="text-sm text-gray-600 font-semibold mt-1">${plan.basePrice}<span className="text-xs">/mo</span></div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Forever Checkbox */}
                  <div className={`flex items-center gap-3 bg-gradient-to-br border-2 rounded-xl p-4 transition-all duration-300 ${
                    isForever
                      ? 'from-green-50 to-emerald-50 border-green-400 shadow-lg shadow-green-500/20'
                      : 'from-gray-50 to-white border-gray-200 hover:border-green-300'
                  }`}>
                    <input
                      type="checkbox"
                      id="forever-checkbox"
                      checked={isForever}
                      onChange={(e) => {
                        setIsForever(e.target.checked);
                        if (e.target.checked) {
                          setSelectedExpiryDate('');
                        }
                      }}
                      className="w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-0 cursor-pointer transition-all"
                    />
                    <label htmlFor="forever-checkbox" className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer flex-1">
                      <Infinity className={`w-5 h-5 transition-colors ${isForever ? 'text-green-600' : 'text-gray-400'}`} />
                      Forever (No Expiry)
                    </label>
                  </div>

                  {/* Expiry Date Picker */}
                  {!isForever && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-600" />
                        Plan Expiry Date <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        The plan will automatically revert to Free after this date.
                      </p>
                      <div className="relative">
                        <input
                          type="date"
                          value={selectedExpiryDate}
                          onChange={(e) => setSelectedExpiryDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className="w-full px-4 py-3 pl-12 border-2 border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium bg-white hover:border-green-400"
                        />
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
                      </div>
                      {selectedExpiryDate && (
                        <div className="mt-2 px-3 py-2 bg-green-100 border border-green-300 rounded-lg text-sm text-green-700 font-medium flex items-start gap-2">
                          <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>
                            Plan will expire on {new Date(selectedExpiryDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} and revert to Free plan
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {isForever && (
                    <div className="px-3 py-2 bg-green-100 border border-green-300 rounded-lg text-sm text-green-700 font-medium flex items-start gap-2">
                      <Infinity className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>This plan will remain active forever and will never expire automatically</span>
                    </div>
                  )}

                  {/* Apply Button */}
                  <button
                    onClick={handleApplyPlanChange}
                    disabled={!selectedPlanForChange || (!selectedExpiryDate && !isForever) || actionLoading !== null}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Applying Changes...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Apply Plan Change
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};