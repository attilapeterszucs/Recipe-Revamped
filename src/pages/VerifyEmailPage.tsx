import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createOrUpdateUserProfile } from '../lib/userService';
import { getUserSettings } from '../lib/userSettings';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Check for various possible parameter names Firebase might use
      const actionCode = searchParams.get('oobCode') || searchParams.get('actionCode');
      const mode = searchParams.get('mode') || searchParams.get('action');
      
      
      if (!actionCode) {
        setStatus('error');
        setMessage('Invalid verification link. The verification code is missing. Please try signing up again.');
        return;
      }

      
      // Check if this looks like an email verification (if mode is present)
      if (mode && mode !== 'verifyEmail') {
        setStatus('error');
        setMessage(`This link is for ${mode}, not email verification. Please use the correct verification link.`);
        return;
      }

      try {
        // Verify the action code is valid and get info
        const actionInfo = await checkActionCode(auth, actionCode);
        
        // Apply the email verification
        await applyActionCode(auth, actionCode);
        
        // After successful verification, create the user profile in our database
        // The user should now be signed in and email verified
        const currentUser = auth.currentUser;
        if (currentUser && actionInfo.data?.email) {
          try {
            // Create user profile in Firestore
            await createOrUpdateUserProfile(
              currentUser.uid,
              actionInfo.data.email,
              currentUser.displayName || undefined,
              currentUser.photoURL || undefined
            );
            
            // Trigger default user settings creation (getUserSettings creates them if they don't exist)
            await getUserSettings(currentUser.uid);
            
            setStatus('success');
            setMessage('Your email has been successfully verified and your account is now fully activated! You can now sign in.');
          } catch {
            // Even if profile creation fails, the email is verified
            setStatus('success');
            setMessage('Your email has been successfully verified! You can now sign in to your account.');
          }
        } else {
          setStatus('success');
          setMessage('Your email has been successfully verified! You can now sign in to your account.');
        }
        
        // Start countdown timer
        setCountdown(5);
        
      } catch (error: unknown) {
        setStatus('error');
        console.error('Email verification error:', error);

        const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : '';

        if (errorCode === 'auth/expired-action-code') {
          setMessage('This verification link has expired. Please sign up again to receive a new verification email.');
        } else if (errorCode === 'auth/invalid-action-code') {
          setMessage('This verification link is invalid. Please sign up again to receive a new verification email.');
        } else if (errorCode === 'auth/user-disabled') {
          setMessage('This account has been disabled. Please contact support for assistance.');
        } else if (errorCode === 'auth/user-not-found') {
          setMessage('User account not found. Please sign up again.');
        } else {
          const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Unknown error';
          setMessage(`There was an error verifying your email: ${errorMessage}. Please try again or contact support.`);
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      window.close();
      // Fallback: if window.close() doesn't work, redirect to signin
      navigate('/signin');
    }, 300);
  }, [navigate]);

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
  }, [status, countdown, handleClose]);

  const handleReturnToSignIn = () => {
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                <Loader className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-4">
                Verifying Your Email
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your email address...
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
                {message}
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
                  onClick={handleReturnToSignIn}
                  className="w-full border border-gray-300 text-gray-700 py-2.5 px-4 rounded-md font-medium text-sm transition-colors hover:bg-gray-50"
                >
                  Go to Sign In Page
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-4">
                Email Verification Failed
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleReturnToSignIn}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-md font-medium text-sm transition-colors"
                >
                  Back to Sign In
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

export default VerifyEmailPage;