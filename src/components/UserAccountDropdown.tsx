import React, { useState, useRef, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User as UserIcon, Settings, LogOut, Crown, Shield, Gift, Palette, UserCog, Heart } from 'lucide-react';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { getUserInitials } from '../utils/profileUtils';

interface UserAccountDropdownProps {
  user: User;
  profilePictureUrl?: string | null;
  onShowSaved: () => void;
  onShowSettings: () => void;
  onSignOut: () => void;
  onShowUpgradeModal?: () => void;
}

const PLAN_COLORS = {
  free: { name: 'Free', color: 'text-gray-600' },
  chef: { name: 'Chef', color: 'text-blue-600' },
  'master-chef': { name: 'Master Chef', color: 'text-green-600' },
  enterprise: { name: 'Enterprise', color: 'text-gray-800' }
};

export const UserAccountDropdown: React.FC<UserAccountDropdownProps> = ({
  user,
  profilePictureUrl,
  onShowSaved,
  onShowSettings,
  onSignOut,
  onShowUpgradeModal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Use the cleaner subscription status hook
  const { subscription: userSubscription, isAdmin, loading, hasPermissions, refresh } = useSubscriptionStatus(
    user?.uid,
    user?.email || undefined
  );

  // Get the current profile picture URL (only use custom upload, show anagram otherwise)
  const currentProfilePicture = profilePictureUrl;


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset profile image error when user changes
  useEffect(() => {
    setProfileImageError(false);
  }, [user?.uid, user?.photoURL]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-full hover:bg-green-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 group"
      >
        {/* Profile Picture or Initials */}
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center ring-2 ring-white shadow-md group-hover:shadow-lg group-hover:ring-green-200 transition-all duration-200">
          {currentProfilePicture && !profileImageError ? (
            <img
              src={currentProfilePicture}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={() => setProfileImageError(true)}
            />
          ) : (
            <span className="text-sm font-black text-white">
              {getUserInitials(user)}
            </span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {/* Plan Badge - Hidden on mobile, shown on larger screens */}
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border transition-all duration-200 ${
            loading ? 'bg-gray-100 text-gray-400 border-gray-200' :
            !userSubscription || userSubscription.plan === 'free' ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300' :
            userSubscription.plan === 'chef' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300' :
            userSubscription.plan === 'master-chef' ? 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 border-green-300' :
            userSubscription.plan === 'enterprise' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border-purple-300' :
            'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300'
          }`}>
            {loading ? 'Loading...' :
             userSubscription ?
               (isAdmin ? `Admin • ${PLAN_COLORS[userSubscription.plan].name}` : PLAN_COLORS[userSubscription.plan].name) :
               'Free'
            }
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-600 transition-all duration-200 ${
              isOpen ? 'rotate-180 text-green-600' : ''
            }`}
          />
        </div>
        <ChevronDown
          className={`sm:hidden w-4 h-4 text-gray-600 transition-all duration-200 ${
            isOpen ? 'rotate-180 text-green-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-[340px] bg-white rounded-2xl shadow-2xl border-2 border-green-200 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200">
          {/* User Info Header */}
          <div className="relative px-6 py-5 bg-gradient-to-br from-green-500 to-emerald-600 overflow-hidden">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-white/20 ring-2 ring-white/30 flex items-center justify-center backdrop-blur-sm shadow-xl">
                {currentProfilePicture && !profileImageError ? (
                  <img
                    src={currentProfilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setProfileImageError(true)}
                  />
                ) : (
                  <span className="text-xl font-black text-white">
                    {getUserInitials(user)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-base font-black text-white truncate drop-shadow-sm">
                    {user.displayName || 'User'}
                  </p>
                  {isAdmin && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500 border border-red-400 shadow-lg flex-shrink-0">
                      <Shield className="w-3 h-3 text-white" />
                      <span className="text-xs font-bold text-white">Admin</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-green-50 truncate font-semibold">
                  {user.email}
                </p>
                {/* Show plan badge */}
                <div className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg border ${
                  loading ? 'bg-white/90 text-gray-600 border-white/50' :
                  !userSubscription || userSubscription.plan === 'free' ? 'bg-white/90 text-gray-700 border-white/50' :
                  userSubscription.plan === 'chef' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  userSubscription.plan === 'master-chef' ? 'bg-white text-green-700 border-white/80' :
                  userSubscription.plan === 'enterprise' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  'bg-white/90 text-gray-700 border-white/50'
                }`}>
                  {isAdmin && <Shield className="w-3 h-3 text-red-600" />}
                  {loading ? 'Loading...' :
                   userSubscription ?
                     PLAN_COLORS[userSubscription.plan].name :
                     'Free Plan'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {!isAdmin && (
              <button
                data-upgrade-plan
                onClick={() => {
                  if (onShowUpgradeModal) {
                    onShowUpgradeModal();
                  }
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-5 py-3.5 text-sm font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 group border-b border-green-100"
              >
                <div className="bg-green-600 p-1.5 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <span className="flex-1 text-left">
                  {userSubscription?.plan === 'chef' ? 'Upgrade to Master Chef' : 'Upgrade Plan'}
                </span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            )}

            {/* Quick Links */}
            <div className="px-2 py-1">
              {isAdmin && (
                <button
                  onClick={() => {
                    navigate('/app/settings/admin-panel');
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-red-50 transition-all duration-200 rounded-lg group"
                >
                  <div className="bg-red-100 p-1.5 rounded-lg mr-3 group-hover:bg-red-200 transition-colors">
                    <UserCog className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="flex-1 text-left">Admin Panel</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              <button
                onClick={() => {
                  navigate('/app/settings/affiliate');
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-purple-50 transition-all duration-200 rounded-lg group"
              >
                <div className="bg-purple-100 p-1.5 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                  <Gift className="w-4 h-4 text-purple-600" />
                </div>
                <span className="flex-1 text-left">Affiliate Program</span>
                <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => {
                  navigate('/app/settings/personal');
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-green-50 transition-all duration-200 rounded-lg group"
              >
                <div className="bg-green-100 p-1.5 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                  <UserIcon className="w-4 h-4 text-green-600" />
                </div>
                <span className="flex-1 text-left">Personal Profile & Goals</span>
                <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => {
                  navigate('/app/settings/dietary-filters');
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-pink-50 transition-all duration-200 rounded-lg group"
              >
                <div className="bg-pink-100 p-1.5 rounded-lg mr-3 group-hover:bg-pink-200 transition-colors">
                  <Palette className="w-4 h-4 text-pink-600" />
                </div>
                <span className="flex-1 text-left">Dietary Filters</span>
                <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => {
                  navigate('/app/settings/health');
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-rose-50 transition-all duration-200 rounded-lg group"
              >
                <div className="bg-rose-100 p-1.5 rounded-lg mr-3 group-hover:bg-rose-200 transition-colors">
                  <Heart className="w-4 h-4 text-rose-600" />
                </div>
                <span className="flex-1 text-left">Health Conditions</span>
                <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Horizontal Divider */}
            <div className="border-t-2 border-gray-100 my-2"></div>

            <button
              onClick={() => {
                onShowSettings();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="bg-gray-100 p-1.5 rounded-lg mr-3 group-hover:bg-gray-200 transition-colors">
                <Settings className="w-4 h-4 text-gray-600 group-hover:rotate-90 transition-all duration-200" />
              </div>
              <span className="flex-1 text-left">All Settings</span>
              <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="border-t-2 border-gray-100 mt-2 pt-2 px-3">
              <button
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl group"
              >
                <div className="bg-red-100 p-1.5 rounded-lg mr-3 group-hover:bg-red-200 transition-colors">
                  <LogOut className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <span className="flex-1 text-left">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};