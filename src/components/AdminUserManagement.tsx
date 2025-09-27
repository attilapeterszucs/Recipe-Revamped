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
import { getAllAdmins, addAdminUser, removeAdminUser, type AdminUser } from '../lib/adminManagement';
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
      const { isUserAdmin } = await import('../lib/adminManagement');
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">User & Admin Management</h3>
              <p className="text-sm text-red-700">Manage admin privileges and subscription plans</p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Current Admin Plan Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Crown className="w-5 h-5 text-yellow-500 mr-2" />
            <h4 className="text-lg font-semibold text-gray-900">Your Admin Plan</h4>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentUserPlan === 'free' ? 'bg-gray-100 text-gray-700' :
            currentUserPlan === 'chef' ? 'bg-blue-100 text-blue-700' :
            currentUserPlan === 'master-chef' ? 'bg-green-100 text-green-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {SUBSCRIPTION_PLANS[currentUserPlan].name}
          </span>
        </div>
        
        <p className="text-gray-600 mb-4">
          Change your own subscription plan for testing functionality
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
            <button
              key={planId}
              onClick={() => handleChangePlan(planId as SubscriptionPlan, true)}
              disabled={currentUserPlan === planId || actionLoading === `plan-${planId}`}
              className={`p-3 rounded-lg border-2 transition-all ${
                currentUserPlan === planId
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${actionLoading === `plan-${planId}` ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {actionLoading === `plan-${planId}` ? (
                <Loader className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                <>
                  <div className="font-semibold text-sm">{plan.name}</div>
                  <div className="text-xs text-gray-500">${plan.basePrice}/mo</div>
                  {currentUserPlan === planId && (
                    <Check className="w-4 h-4 text-green-600 mx-auto mt-1" />
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* User Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-gray-500 mr-2" />
          <h4 className="text-lg font-semibold text-gray-900">User Management</h4>
          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
            {users.length} users
          </span>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by email, name, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.uid}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                user.isAdmin ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  user.isAdmin ? 'bg-red-500' : 'bg-gray-500'
                }`}>
                  {user.isAdmin ? (
                    <ShieldCheck className="w-5 h-5 text-white" />
                  ) : (
                    <Users className="w-5 h-5 text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {user.displayName || 'Unknown User'}
                    </span>
                    {user.isAdmin && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        Admin
                      </span>
                    )}
                    {user.uid === currentAdminUid && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">
                    Plan: {SUBSCRIPTION_PLANS[user.subscriptionPlan || 'free'].name} • ID: {user.uid.slice(0, 8)}...
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowUserModal(true);
                  }}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                
                {user.uid !== currentAdminUid && (
                  user.isAdmin ? (
                    canGrantAdmin() ? (
                      <button
                        onClick={() => handleRevokeAdmin(user)}
                        disabled={actionLoading === `revoke-${user.uid}`}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `revoke-${user.uid}` ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <div className="px-3 py-1 text-xs bg-gray-100 text-gray-500 rounded-md">
                        Admin
                      </div>
                    )
                  ) : (
                    canGrantAdmin() ? (
                      <button
                        onClick={() => handleGrantAdmin(user)}
                        disabled={actionLoading === `grant-${user.uid}`}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
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
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No users found matching your search' : 'No users found'}
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              onClick={() => setShowUserModal(false)}
            />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manage User: {selectedUser.displayName}
                  </h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Change Subscription Plan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
                        <button
                          key={planId}
                          onClick={() => handleChangePlan(planId as SubscriptionPlan, false)}
                          disabled={selectedUser.subscriptionPlan === planId || actionLoading === `plan-${planId}`}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedUser.subscriptionPlan === planId
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {actionLoading === `plan-${planId}` ? (
                            <Loader className="w-4 h-4 animate-spin mx-auto" />
                          ) : (
                            <>
                              <div className="font-semibold text-sm">{plan.name}</div>
                              <div className="text-xs text-gray-500">${plan.basePrice}/mo</div>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-gray-600">Admin Status</span>
                    {selectedUser.uid !== currentAdminUid && canGrantAdmin() && (
                      selectedUser.isAdmin ? (
                        <button
                          onClick={() => handleRevokeAdmin(selectedUser)}
                          disabled={actionLoading === `revoke-${selectedUser.uid}`}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
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
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
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
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                        Cannot modify yourself
                      </span>
                    )}
                    {selectedUser.uid !== currentAdminUid && !canGrantAdmin() && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm">
                        Only super admins can manage admin privileges
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};