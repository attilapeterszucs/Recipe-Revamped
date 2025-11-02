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
  Copy,
  Mail,
  User
} from 'lucide-react';
import { getAllUsers } from '../lib/adminNotifications';
import { getAllAdmins, addAdminUser, removeAdminUser, isUserAdmin, type AdminUser } from '../lib/adminManagement';
import { getAllUserProfiles } from '../lib/userService';
import { SubscriptionService } from '../lib/subscriptionService';
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

        return {
          uid,
          email: userProfile?.email || adminData?.email || '',
          displayName: userProfile?.displayName || adminData?.displayName || 'Unknown User',
          isAdmin: !!adminData,
          adminData,
          subscriptionPlan
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

  // Skeleton loader component for user items
  const UserSkeleton = () => (
    <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-gray-300"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
        <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header with Stats */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-50/50 to-white rounded-3xl border-2 border-red-200 p-8 shadow-2xl">
        {/* Animated background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl shadow-xl shadow-red-500/30 ring-4 ring-red-100">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent leading-tight">
                  User Management
                </h3>
                <p className="text-sm text-red-700 font-semibold mt-1">Manage admin privileges and subscription plans</p>
              </div>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="group flex items-center gap-2 px-6 py-3.5 text-sm bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 font-bold shadow-xl shadow-red-500/40 hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <RefreshCw className={`w-5 h-5 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/20 rounded-3xl border-2 border-blue-200 p-6 sm:p-8 shadow-xl">
        {/* Animated background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">All Users</h4>
                <p className="text-sm text-blue-700 font-medium">Search and manage user accounts</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl shadow-xl shadow-blue-500/30">
              <Users className="w-5 h-5" />
              <span className="font-black text-lg">
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  `${users.length} Total`
                )}
              </span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-blue-500 w-6 h-6 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 border-2 border-blue-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 font-semibold text-gray-900 placeholder:text-gray-400 shadow-lg hover:shadow-xl hover:border-blue-400"
            />
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
        {loading ? (
          // Show skeleton loaders while loading
          <>
            <UserSkeleton />
            <UserSkeleton />
            <UserSkeleton />
            <UserSkeleton />
          </>
        ) : filteredUsers.length === 0 ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-gray-200 p-16 text-center shadow-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-3xl flex items-center justify-center shadow-lg">
                <Search className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-700 mb-2">
                  {searchTerm ? 'No users found' : 'No users available'}
                </h3>
                <p className="text-gray-500 font-medium">
                  {searchTerm ? 'Try adjusting your search terms' : 'User data will appear here'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.uid}
              className={`group relative overflow-hidden rounded-3xl border-2 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${
                user.isAdmin
                  ? 'border-red-300 bg-gradient-to-br from-red-50 via-orange-50/50 to-white hover:border-red-400'
                  : 'border-gray-200 bg-gradient-to-br from-white to-gray-50/50 hover:border-blue-300'
              }`}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 -z-10">
                {user.isAdmin ? (
                  <>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
                  </>
                ) : (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
                )}
              </div>

              <div className="relative p-6 flex items-center justify-between gap-6">
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  {/* User Avatar */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl ring-4 transition-all duration-300 ${
                    user.isAdmin
                      ? 'bg-gradient-to-br from-red-500 to-orange-500 ring-red-100 group-hover:scale-110 group-hover:rotate-3'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500 ring-blue-100 group-hover:scale-110'
                  }`}>
                    {user.isAdmin ? (
                      <ShieldCheck className="w-8 h-8 text-white" />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name and Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className="font-black text-lg text-gray-900 truncate">
                        {user.displayName || 'Unknown User'}
                      </h4>
                      {user.isAdmin && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/30">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      )}
                      {user.uid === currentAdminUid && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 rounded-xl text-xs font-bold shadow-lg shadow-yellow-400/30">
                          <Crown className="w-3.5 h-3.5" />
                          You
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold mb-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{user.email}</span>
                    </div>

                    {/* Plan and ID */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Plan Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold shadow-md ${
                        user.subscriptionPlan === 'free'
                          ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700'
                          : user.subscriptionPlan === 'chef'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/30'
                          : user.subscriptionPlan === 'master-chef'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/30'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/30'
                      }`}>
                        <Crown className="w-3.5 h-3.5" />
                        {SUBSCRIPTION_PLANS[user.subscriptionPlan || 'free'].name}
                      </span>

                      {/* User ID with Copy */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(user.uid);
                          showSuccess('Copied!', 'User ID copied to clipboard');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105"
                        title="Copy full user ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        ID: {user.uid.slice(0, 8)}...
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowUserModal(true);
                  }}
                  className="flex-shrink-0 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:scale-110 hover:rotate-6"
                >
                  <Settings className="w-7 h-7" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Enhanced User Management Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95 border-2 border-gray-200 flex flex-col">
            {/* Header - Landing Page Style */}
            <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-8 flex-shrink-0 overflow-hidden">
              {/* Animated blob background */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 -left-4 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob" />
                <div className="absolute top-0 -right-4 w-40 h-40 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
                <div className="absolute -bottom-4 left-1/2 w-40 h-40 bg-cyan-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000" />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-white/30">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white leading-tight">
                      {selectedUser.displayName}
                    </h3>
                    <p className="text-sm text-white/90 font-semibold mt-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedExpiryDate('');
                    setIsForever(false);
                    setSelectedPlanForChange(null);
                  }}
                  className="text-white/90 hover:text-white transition-all duration-200 p-3 rounded-2xl hover:bg-white/20 backdrop-blur-sm group"
                >
                  <X className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="p-8 space-y-8 bg-gradient-to-b from-gray-50 to-white overflow-y-auto flex-1">
              {/* Admin Privileges Section */}
              <div className="relative overflow-hidden bg-white rounded-3xl border-2 border-gray-200 hover:border-red-300 transition-all duration-500 hover:shadow-2xl p-8 group">
                {/* Background decoration */}
                <div className="absolute inset-0 -z-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 ring-4 ring-red-100">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-gray-900">
                      Admin Privileges
                    </h4>
                    <p className="text-sm text-gray-500 font-semibold">Manage administrative access</p>
                  </div>
                </div>

                {selectedUser.uid === currentAdminUid ? (
                  <div className="px-6 py-4 bg-gradient-to-br from-gray-50 to-white text-gray-700 rounded-2xl text-sm font-bold border-2 border-gray-200 flex items-center gap-3 shadow-lg">
                    <Shield className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <span>Cannot modify your own admin status</span>
                  </div>
                ) : !canGrantAdmin() ? (
                  <div className="px-6 py-4 bg-gradient-to-br from-orange-50 to-yellow-50 text-orange-700 rounded-2xl text-sm font-bold border-2 border-orange-200 flex items-center gap-3 shadow-lg">
                    <Shield className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <span>Only super admins can manage admin privileges</span>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="mb-3">
                        <span className="text-sm font-bold text-gray-700">Current Status: </span>
                        {selectedUser.isAdmin ? (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/30">
                            <ShieldCheck className="w-4 h-4" />
                            Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold">
                            <Users className="w-4 h-4" />
                            Regular User
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 font-semibold">
                        {selectedUser.isAdmin
                          ? 'This user has administrative access to the system'
                          : 'This user has standard user permissions'}
                      </p>
                    </div>
                    {selectedUser.isAdmin ? (
                      <button
                        onClick={() => handleRevokeAdmin(selectedUser)}
                        disabled={actionLoading === `revoke-${selectedUser.uid}`}
                        className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl hover:from-red-600 hover:to-rose-600 transition-all duration-300 font-bold shadow-2xl shadow-red-500/40 hover:shadow-red-500/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 whitespace-nowrap"
                      >
                        {actionLoading === `revoke-${selectedUser.uid}` ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Revoking...
                          </>
                        ) : (
                          <>
                            <UserMinus className="w-5 h-5" />
                            Revoke Admin
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGrantAdmin(selectedUser)}
                        disabled={actionLoading === `grant-${selectedUser.uid}`}
                        className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold shadow-2xl shadow-green-500/40 hover:shadow-green-500/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 whitespace-nowrap"
                      >
                        {actionLoading === `grant-${selectedUser.uid}` ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Granting...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5" />
                            Grant Admin
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Subscription Plan Section */}
              <div className="relative overflow-hidden bg-white rounded-3xl border-2 border-gray-200 hover:border-green-300 transition-all duration-500 hover:shadow-2xl p-8 group">
                {/* Background decoration */}
                <div className="absolute inset-0 -z-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 ring-4 ring-green-100">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-gray-900">
                      Subscription Plan
                    </h4>
                    <p className="text-sm text-gray-500 font-semibold">Manage subscription and expiry</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Current Plan Display */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50/50 to-white border-2 border-green-300 rounded-2xl p-6 shadow-lg">
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-green-400 rounded-full filter blur-2xl" />
                    </div>
                    <label className="block text-xs font-black text-green-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Current Plan
                    </label>
                    <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {SUBSCRIPTION_PLANS[selectedUser.subscriptionPlan || 'free'].name}
                    </div>
                  </div>

                  {/* Plan Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      Select New Plan
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
                        <button
                          key={planId}
                          onClick={() => setSelectedPlanForChange(planId as SubscriptionPlan)}
                          type="button"
                          className={`p-6 rounded-2xl border-2 transition-all duration-300 group ${
                            selectedPlanForChange === planId
                              ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-2xl shadow-green-500/20 ring-4 ring-green-200 scale-105'
                              : 'border-gray-200 hover:border-green-300 hover:bg-gradient-to-br hover:from-green-50/50 hover:to-emerald-50/50 hover:shadow-xl hover:scale-105'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className={`w-5 h-5 ${selectedPlanForChange === planId ? 'text-green-600' : 'text-gray-400 group-hover:text-green-500'}`} />
                            <div className="font-black text-lg text-gray-900">{plan.name}</div>
                          </div>
                          <div className="text-sm text-gray-600 font-bold">${plan.basePrice}<span className="text-xs">/month</span></div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Forever Checkbox */}
                  <div className={`flex items-center gap-4 bg-gradient-to-br border-2 rounded-2xl p-5 transition-all duration-300 ${
                    isForever
                      ? 'from-green-50 to-emerald-50 border-green-400 shadow-xl shadow-green-500/20'
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
                      className="w-6 h-6 text-green-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-0 cursor-pointer transition-all"
                    />
                    <label htmlFor="forever-checkbox" className="flex items-center gap-3 text-sm font-bold text-gray-800 cursor-pointer flex-1">
                      <Infinity className={`w-6 h-6 transition-colors ${isForever ? 'text-green-600' : 'text-gray-400'}`} />
                      Forever (No Expiry Date)
                    </label>
                  </div>

                  {/* Expiry Date Picker */}
                  {!isForever && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        Plan Expiry Date <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-3 font-medium">
                        The plan will automatically revert to Free after this date.
                      </p>
                      <div className="relative">
                        <input
                          type="date"
                          value={selectedExpiryDate}
                          onChange={(e) => setSelectedExpiryDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className="w-full px-5 py-4 pl-14 border-2 border-green-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 font-semibold bg-white hover:border-green-400 shadow-lg"
                        />
                        <Calendar className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-green-500 pointer-events-none" />
                      </div>
                      {selectedExpiryDate && (
                        <div className="mt-3 px-4 py-3 bg-green-100 border border-green-300 rounded-xl text-sm text-green-700 font-semibold flex items-start gap-3">
                          <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
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
                    <div className="px-4 py-3 bg-green-100 border border-green-300 rounded-xl text-sm text-green-700 font-semibold flex items-start gap-3">
                      <Infinity className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span>This plan will remain active forever and will never expire automatically</span>
                    </div>
                  )}

                  {/* Apply Button */}
                  <button
                    onClick={handleApplyPlanChange}
                    disabled={!selectedPlanForChange || (!selectedExpiryDate && !isForever) || actionLoading !== null}
                    className="w-full py-5 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-lg rounded-2xl shadow-2xl shadow-green-500/40 hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                  >
                    {actionLoading ? (
                      <>
                        <Loader className="w-6 h-6 animate-spin" />
                        Applying Changes...
                      </>
                    ) : (
                      <>
                        <Check className="w-6 h-6" />
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
