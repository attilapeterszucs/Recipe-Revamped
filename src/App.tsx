import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAppCheckService } from './lib/appCheck';
import { logger } from './lib/logger';
import { LandingPage } from './pages/LandingPage';
import { TermsOfUse } from './pages/TermsOfUse';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { CookiePolicy } from './pages/CookiePolicy';
import { AboutUs } from './pages/AboutUs';
import { Blog } from './pages/Blog';
import { Contact } from './pages/Contact';
import { RecipeApp } from './pages/RecipeApp';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PasswordRecoveryPage from './pages/PasswordRecoveryPage';
import AuthActionPage from './pages/AuthActionPage';
import EmailVerificationHandler from './pages/EmailVerificationHandler';
import SimpleEmailVerification from './pages/SimpleEmailVerification';
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
  const { needsConsent, acceptAll, rejectAll, saveCurrentPreferences, showConsentPopup } = useCookieContext();
  
  // Track page views with consent-based analytics
  useEffect(() => {
    trackPageView(window.location.pathname);
  }, []);

  const handleAcceptAll = (preferences: any) => {
    acceptAll();
  };

  const handleSavePreferences = (preferences: any) => {
    saveCurrentPreferences();
  };

  const handleReject = () => {
    rejectAll();
  };

  const handleManage = () => {
    showConsentPopup();
  };

  return (
    <Router>
      {/* Network Status Banner - appears at top when network issues detected */}
      <NetworkStatusBanner />
      
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
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:blogId" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Cookie Consent Popup */}
      {needsConsent && (
        <CookieConsent
          onAcceptAll={handleAcceptAll}
          onSavePreferences={handleSavePreferences}
          onReject={handleReject}
          onManage={handleManage}
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
