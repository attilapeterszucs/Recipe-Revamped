import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, resendEmailVerification } from '../lib/firebase';
import { createOrUpdateUserProfile } from '../lib/userService';
import { getUserSettings } from '../lib/userSettings';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';

const SimpleEmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lastResendTime, setLastResendTime] = useState(0);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [message, setMessage] = useState('');

  // Check auth state and email verification status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || '');
        
        if (user.emailVerified) {
          setIsVerified(true);
          
          try {
            // Create user profile after verification
            await createOrUpdateUserProfile(
              user.uid,
              user.email || '',
              user.displayName || undefined,
              user.photoURL || undefined
            );
            
            await getUserSettings(user.uid);
            
            // Redirect to app after profile creation
            setTimeout(() => {
              navigate('/signin');
            }, 2000);
            
          } catch (error) {
            console.error('Error creating user profile:', error);
            // Still redirect even if profile creation fails
            setTimeout(() => {
              navigate('/signin');
            }, 2000);
          }
        }
      } else {
        // No user signed in, redirect to signup
        navigate('/signup');
      }
    });

    return unsubscribe;
  }, [navigate]);

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  const handleCheckVerification = async () => {
    setIsChecking(true);
    const user = auth.currentUser;
    
    if (user) {
      try {
        await user.reload();
        if (user.emailVerified) {
          setIsVerified(true);
        } else {
          setMessage('Email not verified yet. Please check your inbox and click the verification link.');
        }
      } catch (error) {
        console.error('Error checking verification:', error);
        setMessage('Error checking verification status. Please try again.');
      }
    }
    
    setIsChecking(false);
  };

  const handleResendVerification = async () => {
    // Check cooldown
    const now = Date.now();
    const timeSinceLastResend = now - lastResendTime;
    const cooldownPeriod = 60000;
    
    if (timeSinceLastResend < cooldownPeriod && lastResendTime > 0) {
      const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastResend) / 1000);
      setResendCooldown(remainingTime);
      setMessage(`Please wait ${remainingTime} seconds before requesting another verification email.`);
      return;
    }

    try {
      setResendingVerification(true);
      await resendEmailVerification();
      setMessage('Verification email sent successfully! Please check your inbox.');
      setLastResendTime(now);
      setResendCooldown(60);
    } catch (error: unknown) {
      console.error('Error resending verification:', error);
      setMessage('Error sending verification email. Please try again or contact support.');
    } finally {
      setResendingVerification(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 animate-pulse">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Email Verified! 🎉
            </h1>
            <p className="text-gray-600 mb-6">
              Your email has been successfully verified. Setting up your account...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          
          <h1 className="text-xl font-semibold text-gray-900 mb-4">
            Verify Your Email
          </h1>
          
          <p className="text-sm text-gray-600 mb-6">
            We've sent a verification email to:
            <br />
            <strong className="text-gray-900">{userEmail}</strong>
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
            <ol className="text-sm text-blue-800 text-left space-y-1">
              <li>1. Check your email inbox</li>
              <li>2. Click the verification link in the email</li>
              <li>3. Complete the verification on the page that opens</li>
              <li>4. Return here and click "Check Verification Status"</li>
            </ol>
          </div>
          
          {message && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
              <p className="text-sm text-yellow-800">{message}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleCheckVerification}
              disabled={isChecking}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center"
            >
              {isChecking ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check Verification Status
                </>
              )}
            </button>

            <button
              onClick={handleResendVerification}
              disabled={resendingVerification || resendCooldown > 0}
              className={`w-full flex items-center justify-center px-4 py-2.5 rounded-md transition-colors text-sm font-medium ${
                resendCooldown > 0 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
              }`}
            >
              {resendingVerification ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : resendCooldown > 0 ? (
                <>
                  <div className="w-4 h-4 mr-2 rounded-full border-2 border-white relative">
                    <div 
                      className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-white border-t-transparent animate-spin"
                      style={{ animationDuration: '60s', animationTimingFunction: 'linear' }}
                    />
                  </div>
                  Wait {resendCooldown}s to resend
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/signin')}
              className="w-full border border-gray-300 text-gray-700 py-2.5 px-4 rounded-md font-medium text-sm transition-colors hover:bg-gray-50"
            >
              Back to Sign In
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-xs text-gray-600">
              <strong>Can't find the email?</strong> Check your spam folder. 
              The email comes from Recipe Revamped and may take a few minutes to arrive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleEmailVerification;