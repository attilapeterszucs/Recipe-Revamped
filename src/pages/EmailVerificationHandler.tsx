import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createOrUpdateUserProfile } from '../lib/userService';
import { getUserSettings } from '../lib/userSettings';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { logger } from '../lib/logger';

const EmailVerificationHandler: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  const [countdown, setCountdown] = useState(5);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const checkVerificationStatus = () => {
      logger.debug('Starting email verification check');
      
      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        logger.debug('Auth state changed for verification check');

        if (user && user.emailVerified) {
          logger.auth('Email verification confirmed, creating profile');
          
          try {
            // Create user profile in Firestore
            await createOrUpdateUserProfile(
              user.uid,
              user.email || '',
              user.displayName || undefined,
              user.photoURL || undefined
            );
            
            // Trigger default user settings creation
            await getUserSettings(user.uid);
            
            logger.user('User profile created after email verification');
            setStatus('success');
            setCountdown(5);
            
          } catch (error) {
            console.error('EmailVerificationHandler - Error creating user profile:', error);
            // Even if profile creation fails, the email is verified
            setStatus('success');
            setCountdown(5);
          }
        } else if (user && !user.emailVerified) {
          logger.debug('User found but email not yet verified');
          // Wait a moment and check again in case verification is still processing
          setTimeout(() => {
            user.reload().then(() => {
              if (user.emailVerified) {
                logger.auth('Email verification status updated');
                window.location.reload();
              } else {
                logger.warn('Email verification still pending');
                setStatus('failed');
              }
            });
          }, 2000);
        } else {
          logger.debug('No authenticated user found');
          setStatus('failed');
        }
      });

      return unsubscribe;
    };

    const unsubscribe = checkVerificationStatus();
    return () => unsubscribe();
  }, []);

  // Countdown timer effect for success state
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      handleClose();
    }
  }, [status, countdown]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      window.close();
      // Fallback: if window.close() doesn't work, redirect to signin
      navigate('/signin');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center">
          {status === 'checking' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                <Loader className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-4">
                Checking Verification Status
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your email status...
              </p>
            </>
          )}

          {status === 'success' && (
            <div className={`transition-all duration-300 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 animate-pulse">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Email Verified Successfully! 🎉
              </h1>
              <p className="text-gray-600 mb-6 text-lg">
                Your email has been successfully verified and your account is now fully activated!
              </p>
              
              {/* Countdown Circle */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32" cy="32" r="28"
                      fill="transparent"
                      stroke="#e5e7eb"
                      strokeWidth="4"
                    />
                    <circle
                      cx="32" cy="32" r="28"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="4"
                      strokeDasharray="175.929"
                      strokeDashoffset={175.929 * (1 - countdown / 5)}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-green-600">{countdown}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                This window will close automatically in {countdown} seconds
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleClose}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium text-sm transition-colors shadow-lg hover:shadow-xl"
                >
                  Close Window Now
                </button>
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full border border-gray-300 text-gray-700 py-2.5 px-4 rounded-md font-medium text-sm transition-colors hover:bg-gray-50"
                >
                  Go to Sign In Page
                </button>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-4">
                Verification Check Failed
              </h1>
              <p className="text-gray-600 mb-6">
                We couldn't verify your email status automatically. This might mean:
                <br />• The verification link has expired
                <br />• The verification has already been completed
                <br />• There was a network issue
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-md font-medium text-sm transition-colors"
                >
                  Try Signing In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full border border-gray-300 text-gray-700 py-2.5 px-4 rounded-md font-medium text-sm transition-colors hover:bg-gray-50"
                >
                  Sign Up Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationHandler;