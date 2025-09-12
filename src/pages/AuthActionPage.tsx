import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createOrUpdateUserProfile } from '../lib/userService';
import { getUserSettings } from '../lib/userSettings';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { logger } from '../lib/logger';

const AuthActionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'processing' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthAction = async () => {
      logger.debug('AuthActionPage processing started');
      
      // Check for different URL parameter formats that Firebase might use
      let mode = searchParams.get('mode');
      let oobCode = searchParams.get('oobCode');
      const apiKey = searchParams.get('apiKey');
      const continueUrl = searchParams.get('continueUrl');
      
      logger.debug('Processing auth action parameters');
      
      // Alternative parameter names Firebase might use
      if (!mode) {
        mode = searchParams.get('action') || searchParams.get('type') || searchParams.get('m');
      }
      
      if (!oobCode) {
        oobCode = searchParams.get('code') || searchParams.get('actionCode') || searchParams.get('token') || searchParams.get('oob') || searchParams.get('c');
      }

      // Parameter validation completed

      // Check if this might be a Firebase hosted URL redirect
      if (!oobCode && !mode) {
        const urlHash = window.location.hash;
        if (urlHash) {
          logger.debug('Checking URL hash for parameters');
          const hashParams = new URLSearchParams(urlHash.substring(1));
          mode = hashParams.get('mode') || hashParams.get('action');
          oobCode = hashParams.get('oobCode') || hashParams.get('code');
        }
      }
      
      // Check if the URL might have the parameters in a different format
      const url = new URL(window.location.href);
      // Checking alternative parameter locations
      
      // Sometimes Firebase uses the fragment identifier
      if (!oobCode && !mode && url.hash) {
        const fragment = url.hash.substring(1);
        const fragmentParams = new URLSearchParams(fragment);
        logger.debug('Processing fragment parameters');
        mode = mode || fragmentParams.get('mode');
        oobCode = oobCode || fragmentParams.get('oobCode');
      }
      
      logger.debug('Auth action parameters validated');

      // If we still don't have the required parameters, show detailed error and redirect to simple verification
      if (!oobCode) {
        logger.warn('No verification code found in URL');
        setStatus('error');
        setMessage('No verification code found in this URL. You may have clicked an old or invalid link. Redirecting you to manually check your verification status...');
        
        // Redirect to simple verification after 3 seconds
        setTimeout(() => {
          navigate('/verify-email');
        }, 3000);
        return;
      }

      if (!mode) {
        // Assume email verification if mode is missing but oobCode exists
        mode = 'verifyEmail';
        logger.debug('No mode specified, assuming email verification');
      }

      try {
        setStatus('processing');

        if (mode === 'verifyEmail') {
          logger.auth('Processing email verification');
          
          // Verify the action code is valid and get info
          const actionInfo = await checkActionCode(auth, oobCode);
          logger.debug('Email verification action validated');
          
          // Apply the email verification
          await applyActionCode(auth, oobCode);
          logger.auth('Email verification completed successfully');
          
          // After successful verification, create the user profile in our database
          // The user should now be signed in and email verified
          const currentUser = auth.currentUser;
          if (currentUser && actionInfo.data?.email) {
            try {
              logger.user('Creating user profile after email verification');
              
              // Create user profile in Firestore
              await createOrUpdateUserProfile(
                currentUser.uid,
                actionInfo.data.email,
                currentUser.displayName || undefined,
                currentUser.photoURL || undefined
              );
              
              // Trigger default user settings creation
              await getUserSettings(currentUser.uid);
              
              logger.user('User profile created successfully');
              
              setStatus('success');
              setMessage('Your email has been successfully verified and your account is now fully activated!');
            } catch (profileError) {
              console.error('AuthActionPage - Error creating user profile:', profileError);
              // Even if profile creation fails, the email is verified
              setStatus('success');
              setMessage('Your email has been successfully verified! You can now sign in to your account.');
            }
          } else {
            setStatus('success');
            setMessage('Your email has been successfully verified! You can now sign in to your account.');
          }

          // Redirect to sign in page after 3 seconds
          setTimeout(() => {
            navigate('/signin');
          }, 3000);

        } else if (mode === 'resetPassword') {
          // Redirect to our custom password recovery page
          navigate(`/password-recovery?${searchParams.toString()}`);
          return;

        } else {
          setStatus('error');
          setMessage(`Unknown action type: ${mode}`);
        }

      } catch (error: any) {
        console.error('AuthActionPage - Error processing action:', error);
        setStatus('error');
        
        if (error.code === 'auth/expired-action-code') {
          setMessage('This verification link has expired. Please sign up again to receive a new verification email.');
        } else if (error.code === 'auth/invalid-action-code') {
          setMessage('This verification link is invalid. Please sign up again to receive a new verification email.');
        } else if (error.code === 'auth/user-disabled') {
          setMessage('This account has been disabled. Please contact support for assistance.');
        } else if (error.code === 'auth/user-not-found') {
          setMessage('User account not found. Please sign up again.');
        } else {
          setMessage(`There was an error processing your request: ${error.message || 'Unknown error'}. Please try again or contact support.`);
        }
      }
    };

    handleAuthAction();
  }, [searchParams, navigate]);

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
                Loading...
              </h1>
              <p className="text-gray-600">
                Please wait while we process your request...
              </p>
            </>
          )}

          {status === 'processing' && (
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
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 animate-pulse">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Email Verified Successfully! 🎉
              </h1>
              <p className="text-gray-600 mb-6 text-lg">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to sign in page in a few seconds...
              </p>
              <button
                onClick={() => navigate('/signin')}
                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium text-sm transition-colors shadow-lg hover:shadow-xl"
              >
                Go to Sign In Page
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-4">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/signin')}
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

export default AuthActionPage;