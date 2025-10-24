import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAppCheckService } from './lib/appCheck';
import { logger } from './lib/logger';
import { LandingPage } from './pages/LandingPage';
// Import critical pages statically to prevent module federation issues
import { RecipeApp } from './pages/RecipeApp';
import { Settings } from './pages/Settings';

// Lazy load non-critical components for better code splitting
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(module => ({ default: module.TermsOfService })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy').then(module => ({ default: module.CookiePolicy })));
const AboutUs = lazy(() => import('./pages/AboutUs').then(module => ({ default: module.AboutUs })));
const Blog = lazy(() => import('./pages/Blog').then(module => ({ default: module.Blog })));
const Contact = lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })));
const Careers = lazy(() => import('./pages/Careers').then(module => ({ default: module.Careers })));
const Partnerships = lazy(() => import('./pages/Partnerships').then(module => ({ default: module.Partnerships })));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe').then(module => ({ default: module.Unsubscribe })));
const SignInPage = lazy(() => import('./pages/SignInPage').then(module => ({ default: module.SignInPage })));
const SignUpPage = lazy(() => import('./pages/SignUpPage').then(module => ({ default: module.SignUpPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const PasswordRecoveryPage = lazy(() => import('./pages/PasswordRecoveryPage'));
const AuthActionPage = lazy(() => import('./pages/AuthActionPage'));
const SimpleEmailVerification = lazy(() => import('./pages/SimpleEmailVerification'));
const NotFound = lazy(() => import('./pages/NotFound').then(module => ({ default: module.NotFound })));
import { CookieProvider } from './contexts/CookieContext';
import { CookieConsent } from './components/CookieConsent';
import { useCookieContext } from './contexts/CookieContext';
import { ToastProvider } from './components/ToastContainer';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { trackPageView } from './lib/analytics';
import './lib/consentStorage'; // Initialize consent storage

// Inner App component that uses cookie context
const AppContent: React.FC = () => {
  const { needsConsent, acceptAll, rejectAll, saveCurrentPreferences } = useCookieContext();
  
  // Track page views with consent-based analytics
  useEffect(() => {
    trackPageView(window.location.pathname);
  }, []);

  const handleAcceptAll = () => {
    acceptAll();
  };

  const handleSavePreferences = () => {
    saveCurrentPreferences();
  };

  const handleReject = () => {
    rejectAll();
  };

  return (
    <Router>
      {/* Network Status Banner - appears at top when network issues detected */}
      <NetworkStatusBanner />

      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<RecipeApp />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/verify-email" element={<SimpleEmailVerification />} />
          <Route path="/verify-email-debug" element={<VerifyEmailPage />} />
          <Route path="/password-recovery" element={<PasswordRecoveryPage />} />
          <Route path="/auth/action" element={<AuthActionPage />} />
          <Route path="/__/auth/action" element={<AuthActionPage />} />
          <Route path="/finishSignUp" element={<AuthActionPage />} />
          <Route path="/emulator/auth/handler" element={<AuthActionPage />} />
          <Route path="/action" element={<AuthActionPage />} />
          <Route path="/handler" element={<AuthActionPage />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/terms" element={<Navigate to="/terms-of-service" replace />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/cookies" element={<Navigate to="/cookie-policy" replace />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:blogId" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/partnerships" element={<Partnerships />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      
      {/* Cookie Consent Popup */}
      {needsConsent && (
        <CookieConsent
          onAcceptAll={handleAcceptAll}
          onSavePreferences={handleSavePreferences}
          onReject={handleReject}
        />
      )}
    </Router>
  );
};

// Main App component with providers
function App() {
  // Initialize App Check on app startup
  useEffect(() => {
    const initAppSecurity = async () => {
      try {
        await initializeAppCheckService();
        logger.info('App security services initialized');
      } catch (error) {
        logger.error('Failed to initialize app security services', { error });
      }
    };
    
    initAppSecurity();
  }, []);

  return (
    <CookieProvider>
      <SubscriptionProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </SubscriptionProvider>
    </CookieProvider>
  );
}

export default App;
