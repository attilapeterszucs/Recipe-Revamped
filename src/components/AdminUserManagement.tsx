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
  RefreshCw
} from 'lucide-react';
import { getAllUsers } from '../lib/adminNotifications';
import { getAllAdmins, addAdminUser, removeAdminUser, isUserAdmin, type AdminUser } from '../lib/adminManagement';
import { getAllUserProfiles } from '../lib/userService';
import { SubscriptionService } from '../lib/subscriptionService';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionPlan } from '../types/subscription';
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
  const [currentUserPlan, setCurrentUserPlan] = useState<SubscriptionPlan>('free');
  const [currentAdminData, setCurrentAdminData] = useState<AdminUser | null>(null);
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
      
      // Get current admin's data and subscription plan
      const currentAdmin = adminUsers.find(admin => admin.uid === currentAdminUid);
      setCurrentAdminData(currentAdmin || null);
      
      try {
        const currentSub = await SubscriptionService.getUserSubscription(currentAdminUid);
        setCurrentUserPlan(currentSub?.plan || 'free');
      } catch (error) {
        logger.error('Error loading current admin subscription:', { error });
      }
      
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

  const handleChangePlan = async (plan: SubscriptionPlan, isForSelf: boolean = false) => {
    try {
      setActionLoading(`plan-${plan}`);
      
      const targetUid = isForSelf ? currentAdminUid : selectedUser?.uid;
      const targetEmail = isForSelf ? currentAdminEmail : selectedUser?.email;
      
      if (!targetUid || !targetEmail) {
        showError('Error', 'User information not available');
        return;
      }
      
      const result = await SubscriptionService.adminSetUserPlan(
        currentAdminUid,
        targetUid,
        plan,
        currentAdminEmail
      );
      
      if (result.success) {
        const targetName = isForSelf ? 'your' : (selectedUser?.displayName || targetEmail);
        showSuccess(
          'Plan Updated', 
          `Successfully changed ${targetName} plan to ${SUBSCRIPTION_PLANS[plan].name}`
        );
        
        if (isForSelf) {
          setCurrentUserPlan(plan);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading user data...</span>
      </div>
    );
  }

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

      {/* Current Admin Plan Management */}
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50/50 border-2 border-yellow-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl flex items-center justify-center shadow-md">
              <Crown className="w-6 h-6 text-yellow-600" />
            </div>
            <h4 className="text-xl font-black bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">Your Admin Plan</h4>
          </div>
          <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${
            currentUserPlan === 'free' ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-2 border-gray-300' :
            currentUserPlan === 'chef' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-2 border-blue-300 shadow-blue-500/30' :
            currentUserPlan === 'master-chef' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-2 border-green-300 shadow-green-500/30' :
            'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300 shadow-purple-500/30'
          }`}>
            {SUBSCRIPTION_PLANS[currentUserPlan].name}
          </span>
        </div>

        <p className="text-yellow-800 mb-4 font-medium">
          Change your own subscription plan for testing functionality
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
            <button
              key={planId}
              onClick={() => handleChangePlan(planId as SubscriptionPlan, true)}
              disabled={currentUserPlan === planId || actionLoading === `plan-${planId}`}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                currentUserPlan === planId
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-500/20 transform scale-105'
                  : 'border-gray-300 hover:border-yellow-400 hover:bg-yellow-50/50 hover:shadow-md'
              } ${actionLoading === `plan-${planId}` ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {actionLoading === `plan-${planId}` ? (
                <Loader className="w-5 h-5 animate-spin mx-auto text-yellow-600" />
              ) : (
                <>
                  <div className="font-black text-sm text-gray-800">{plan.name}</div>
                  <div className="text-xs text-gray-600 font-medium mt-1">${plan.basePrice}/mo</div>
                  {currentUserPlan === planId && (
                    <Check className="w-5 h-5 text-green-600 mx-auto mt-2" />
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* User Search */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center shadow-md">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">User Management</h4>
          <span className="ml-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30">
            {users.length} users
          </span>
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
          {filteredUsers.map((user) => (
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
                    <span className="font-black text-gray-900">
                      {user.displayName || 'Unknown User'}
                    </span>
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
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Plan: <span className="font-bold">{SUBSCRIPTION_PLANS[user.subscriptionPlan || 'free'].name}</span> • ID: {user.uid.slice(0, 8)}...
                  </p>
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

                {user.uid !== currentAdminUid && (
                  user.isAdmin ? (
                    canGrantAdmin() ? (
                      <button
                        onClick={() => handleRevokeAdmin(user)}
                        disabled={actionLoading === `revoke-${user.uid}`}
                        className="px-3 py-2 text-sm bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-md shadow-red-500/30 hover:shadow-lg hover:scale-105 disabled:opacity-50 font-bold"
                      >
                        {actionLoading === `revoke-${user.uid}` ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <div className="px-3 py-2 text-xs bg-gray-100 text-gray-500 rounded-xl font-bold border-2 border-gray-200">
                        Admin
                      </div>
                    )
                  ) : (
                    canGrantAdmin() ? (
                      <button
                        onClick={() => handleGrantAdmin(user)}
                        disabled={actionLoading === `grant-${user.uid}`}
                        className="px-3 py-2 text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md shadow-green-500/30 hover:shadow-lg hover:scale-105 disabled:opacity-50 font-bold"
                      >
                        {actionLoading === `grant-${user.uid}` ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                      </button>
                    ) : null
                  )
                )}
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-600 font-medium">
              {searchTerm ? 'No users found matching your search' : 'No users found'}
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 relative overflow-hidden">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    Manage User: {selectedUser.displayName}
                  </h3>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-white/90 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/20 backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Change Subscription Plan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
                    <button
                      key={planId}
                      onClick={() => handleChangePlan(planId as SubscriptionPlan, false)}
                      disabled={selectedUser.subscriptionPlan === planId || actionLoading === `plan-${planId}`}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedUser.subscriptionPlan === planId
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg shadow-purple-500/20 transform scale-105'
                          : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50 hover:shadow-md'
                      } ${actionLoading === `plan-${planId}` ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {actionLoading === `plan-${planId}` ? (
                        <Loader className="w-5 h-5 animate-spin mx-auto text-purple-600" />
                      ) : (
                        <>
                          <div className="font-black text-sm text-gray-800">{plan.name}</div>
                          <div className="text-xs text-gray-600 font-medium mt-1">${plan.basePrice}/mo</div>
                          {selectedUser.subscriptionPlan === planId && (
                            <Check className="w-5 h-5 text-purple-600 mx-auto mt-2" />
                          )}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                <span className="text-sm font-bold text-gray-800">Admin Status</span>
                {selectedUser.uid !== currentAdminUid && canGrantAdmin() && (
                  selectedUser.isAdmin ? (
                    <button
                      onClick={() => handleRevokeAdmin(selectedUser)}
                      disabled={actionLoading === `revoke-${selectedUser.uid}`}
                      className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 disabled:opacity-50"
                    >
                      {actionLoading === `revoke-${selectedUser.uid}` ? (
                        <Loader className="w-4 h-4 animate-spin mr-2 inline" />
                      ) : (
                        <UserMinus className="w-4 h-4 mr-2 inline" />
                      )}
                      Remove Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGrantAdmin(selectedUser)}
                      disabled={actionLoading === `grant-${selectedUser.uid}`}
                      className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 disabled:opacity-50"
                    >
                      {actionLoading === `grant-${selectedUser.uid}` ? (
                        <Loader className="w-4 h-4 animate-spin mr-2 inline" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2 inline" />
                      )}
                      Grant Admin
                    </button>
                  )
                )}
                {selectedUser.uid === currentAdminUid && (
                  <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold border-2 border-gray-200">
                    Cannot modify yourself
                  </span>
                )}
                {selectedUser.uid !== currentAdminUid && !canGrantAdmin() && (
                  <span className="px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-xl text-sm font-bold border-2 border-orange-200">
                    Only super admins can manage admin privileges
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};