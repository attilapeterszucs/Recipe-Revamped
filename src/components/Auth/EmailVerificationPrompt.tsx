import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, RotateCcw, RefreshCw } from 'lucide-react';
import { resendEmailVerification, logOut, auth } from '../../lib/firebase';
import { type User } from 'firebase/auth';

interface EmailVerificationPromptProps {
  user: User;
  onBackToSignIn: () => void;
}

export const EmailVerificationPrompt: React.FC<EmailVerificationPromptProps> = ({ user, onBackToSignIn }) => {
  const [loading, setLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Check for email verification periodically
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (checkingVerification) return;

      try {
        setCheckingVerification(true);
        await user.reload();
        if (user.emailVerified) {
          // Email has been verified, the auth state change will handle the rest
          window.location.reload(); // Force a reload to ensure fresh auth state
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
      } finally {
        setCheckingVerification(false);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkEmailVerification, 30000);

    // Check once immediately when component mounts
    checkEmailVerification();

    return () => clearInterval(interval);
  }, [user, checkingVerification]);

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      setError('');
      await resendEmailVerification(user);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (error: any) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      onBackToSignIn();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setCheckingVerification(true);
      setError('');
      await user.reload();
      if (user.emailVerified) {
        window.location.reload();
      } else {
        setError('Email is not yet verified. Please check your inbox and click the verification link.');
      }
    } catch (error) {
      setError('Failed to check verification status. Please try again.');
    } finally {
      setCheckingVerification(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 w-full max-w-lg">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>

        <h2 className="text-xl font-medium text-gray-900 mb-4">
          Email Verification Required
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          We've sent a verification email to <strong>{user.email}</strong>.
          Please check your inbox and click the verification link to access your account.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleCheckVerification}
            disabled={checkingVerification}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2.5 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center"
          >
            {checkingVerification ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Verification Status
              </>
            )}
          </button>

          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2.5 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2.5 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </button>
        </div>

        {resendSuccess && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">
              Verification email sent successfully! Please check your inbox.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-600">
            <strong>Can't find the email?</strong> Check your spam folder.
            The email may take a few minutes to arrive.
          </p>
          <p className="text-sm text-blue-600 mt-2">
            You can also refresh this page after clicking the verification link.
          </p>
        </div>
      </div>
    </div>
  );
};