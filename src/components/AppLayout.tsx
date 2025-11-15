import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { Zap, BookOpen, Calendar, Menu, X } from 'lucide-react';
import { auth, logOut } from '../lib/firebase';
import { NotificationBell } from './NotificationBell';
import { UserAccountDropdown } from './UserAccountDropdown';
import { NotificationPopup } from './NotificationPopup';
import type { Notification } from '../types/notifications';
import { AppFooter } from './AppFooter';
import { ReactivationModal } from './ReactivationModal';
import { PaymentSuccessPopup } from './PaymentSuccessPopup';
import { usePaymentSuccess } from '../hooks/usePaymentSuccess';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { getUserSettings } from '../lib/userSettings';
import type { UserSettings } from '../types/userSettings';
import { useToast } from './ToastContainer';
import { SEOHead } from './SEOHead';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [currentRecipeCount, setCurrentRecipeCount] = useState(0);
  const { showError } = useToast();

  // Payment success handling
  const { showSuccessPopup, closeSuccessPopup } = usePaymentSuccess();

  // Feature access
  const featureAccess = useFeatureAccess(
    user?.uid,
    user?.email || undefined,
    currentRecipeCount
  );

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser && currentUser.emailVerified) {
        // Load user settings
        const settings = await getUserSettings(currentUser.uid);
        if (settings) {
          setUserSettings(settings);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
  };

  // Check if current path matches
  const isActivePath = (path: string) => {
    if (path === '/app/settings') {
      return location.pathname.startsWith('/app/settings');
    }
    return location.pathname === path;
  };

  // Show loading screen while determining auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50/30 via-emerald-50/20 to-white flex items-center justify-center relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        </div>

        <div className="text-center">
          {/* Logo with pulse animation */}
          <div className="mb-6 animate-pulse">
            <img
              src="/logo/logo.png"
              alt="Recipe Revamped Logo"
              className="h-24 w-24 mx-auto drop-shadow-lg"
            />
          </div>

          {/* Spinner with gradient */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inline-block h-16 w-16 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 opacity-20 animate-ping" />
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-padding">
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent border-b-green-600 border-l-green-600" />
            </div>
          </div>

          {/* Text with gradient */}
          <h2 className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Loading Recipe Revamped
          </h2>
          <p className="text-sm text-gray-600 font-medium animate-pulse">
            Preparing your culinary workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to home if not authenticated
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/30 via-emerald-50/20 to-white">
      <SEOHead pageKey="app" />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link
              to="/app/convert"
              className="flex items-center gap-3 group"
            >
              <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Recipe Revamped</span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                <Link
                  to="/app/convert"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    isActivePath('/app/convert')
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>Convert</span>
                </Link>

                <Link
                  to="/app/recipe-book"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    isActivePath('/app/recipe-book')
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Recipe Book</span>
                </Link>

                <button
                  onClick={() => {
                    if (!featureAccess.canUseMealPlanning) {
                      showError(
                        'Upgrade Required',
                        'Meal planning calendar is available for Chef plan and higher. Upgrade to access this feature!'
                      );
                      navigate('/app/pricing');
                      return;
                    }
                    navigate('/app/meal-planning');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    !featureAccess.canUseMealPlanning
                      ? 'text-gray-400 cursor-not-allowed opacity-60'
                      : isActivePath('/app/meal-planning')
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                        : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  }`}
                  disabled={!featureAccess.canUseMealPlanning}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Meal Planning</span>
                  {!featureAccess.canUseMealPlanning && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                      Chef+
                    </span>
                  )}
                </button>
              </nav>

              <div className="flex items-center gap-3 ml-4">
                <NotificationBell
                  userId={user.uid}
                  onNotificationClick={handleNotificationClick}
                />
                <UserAccountDropdown
                  user={user}
                  profilePictureUrl={userSettings?.profilePictureUrl}
                  onShowSaved={() => navigate('/app/recipe-book')}
                  onShowSettings={() => navigate('/app/settings')}
                  onSignOut={handleSignOut}
                />

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                  aria-label="Toggle mobile menu"
                >
                  {showMobileMenu ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 pt-2 pb-4 space-y-2">
              <Link
                to="/app/convert"
                onClick={() => setShowMobileMenu(false)}
                className={`w-full justify-start flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  isActivePath('/app/convert')
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Convert</span>
              </Link>

              <Link
                to="/app/recipe-book"
                onClick={() => setShowMobileMenu(false)}
                className={`w-full justify-start flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  isActivePath('/app/recipe-book')
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Recipe Book</span>
              </Link>

              <button
                onClick={() => {
                  if (!featureAccess.canUseMealPlanning) {
                    showError(
                      'Upgrade Required',
                      'Meal planning calendar is available for Chef plan and higher. Upgrade to access this feature!'
                    );
                    navigate('/app/pricing');
                    setShowMobileMenu(false);
                    return;
                  }
                  navigate('/app/meal-planning');
                  setShowMobileMenu(false);
                }}
                className={`w-full justify-start flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  !featureAccess.canUseMealPlanning
                    ? 'text-gray-400 cursor-not-allowed opacity-60'
                    : isActivePath('/app/meal-planning')
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
                disabled={!featureAccess.canUseMealPlanning}
              >
                <Calendar className="w-4 h-4" />
                <span>Meal Planning</span>
                {!featureAccess.canUseMealPlanning && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold ml-auto">
                    Chef+
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={`relative py-4 sm:py-6 lg:py-8 z-0 ${
        location.pathname === '/app/convert'
          ? 'max-w-full px-2 sm:px-3 md:px-4 lg:px-6'
          : 'max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8'
      } mx-auto`}>
        <Outlet context={{ user, userSettings, featureAccess, updateRecipeCount: setCurrentRecipeCount }} />
      </main>

      {/* Footer */}
      {user && <AppFooter />}

      {/* Notification Popup */}
      {selectedNotification && (
        <NotificationPopup
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}

      {/* Payment Success Popup */}
      <PaymentSuccessPopup
        isOpen={showSuccessPopup}
        onClose={closeSuccessPopup}
      />

      {/* Reactivation Modal */}
      <ReactivationModal
        isOpen={false}
        user={auth.currentUser}
        onReactivate={() => {}}
        onDecline={() => {}}
      />
    </div>
  );
}
