import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { CheckCircle, AlertCircle, Loader, Eye, EyeOff, Lock } from 'lucide-react';

const PasswordRecoveryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [isClosing, setIsClosing] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionCode, setActionCode] = useState('');

  const passwordRequirements = [
    { test: (p: string) => p.length >= 8, text: 'At least 8 characters' },
    { test: (p: string) => /[A-Z]/.test(p), text: 'One uppercase letter' },
    { test: (p: string) => /[a-z]/.test(p), text: 'One lowercase letter' },
    { test: (p: string) => /[0-9]/.test(p), text: 'One number' },
    { test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), text: 'One special character' }
  ];

  useEffect(() => {
    const verifyResetCode = async () => {
      const code = searchParams.get('oobCode');
      
      if (!code) {
        setStatus('error');
        setMessage('Invalid password reset link. Please request a new password reset.');
        return;
      }

      setActionCode(code);

      try {
        // Verify the reset code and get the email
        const emailFromCode = await verifyPasswordResetCode(auth, code);
        setEmail(emailFromCode);
        setStatus('form');
        
      } catch (error: any) {
        setStatus('error');
        if (error.code === 'auth/expired-action-code') {
          setMessage('This password reset link has expired. Please request a new password reset.');
        } else if (error.code === 'auth/invalid-action-code') {
          setMessage('This password reset link is invalid. Please request a new password reset.');
        } else if (error.code === 'auth/user-disabled') {
          setMessage('This account has been disabled. Please contact support for assistance.');
        } else {
          setMessage('There was an error verifying your password reset link. Please try again or contact support.');
        }
      }
    };

    verifyResetCode();
  }, [searchParams]);

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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    const isValidPassword = passwordRequirements.every(req => req.test(newPassword));
    if (!isValidPassword) {
      setMessage('Please ensure your password meets all requirements.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      // Confirm the password reset
      await confirmPasswordReset(auth, actionCode, newPassword);
      
      setStatus('success');
      setMessage('Your password has been successfully reset! You can now sign in with your new password.');
      setCountdown(5);
      
    } catch (error: any) {
      if (error.code === 'auth/weak-password') {
        setMessage('The password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/expired-action-code') {
        setMessage('This password reset link has expired. Please request a new password reset.');
      } else if (error.code === 'auth/invalid-action-code') {
        setMessage('This password reset link is invalid. Please request a new password reset.');
      } else {
        setMessage('Failed to reset password. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                <Loader className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-4">
                Verifying Reset Link
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your password reset link...
              </p>
            </>
          )}

          {status === 'form' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-4">
                Reset Your Password
              </h1>
              <p className="text-gray-600 mb-6">
                Create a new password for <strong>{email}</strong>
              </p>

              <form onSubmit={handlePasswordReset} className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Password Requirements</h4>
                  <div className="space-y-2">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircle
                          className={`w-4 h-4 mr-2 transition-colors ${
                            req.test(newPassword) ? 'text-green-500' : 'text-gray-300'
                          }`}
                        />
                        <span className={`transition-colors ${
                          req.test(newPassword) ? 'text-green-700 font-medium' : 'text-gray-500'
                        }`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {message && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}

          {status === 'success' && (
            <div className={`transition-all duration-300 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 animate-pulse">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Password Reset Successfully! 🔒
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
                      stroke="#3b82f6"
                      strokeWidth="4"
                      strokeDasharray="175.929"
                      strokeDashoffset={175.929 * (1 - countdown / 5)}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600">{countdown}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                This window will close automatically in {countdown} seconds
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleClose}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium text-sm transition-colors shadow-lg hover:shadow-xl"
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

          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-4">
                Password Reset Failed
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md font-medium text-sm transition-colors"
                >
                  Back to Sign In
                </button>
                <button
                  onClick={handleClose}
                  className="w-full border border-gray-300 text-gray-700 py-2.5 px-4 rounded-md font-medium text-sm transition-colors hover:bg-gray-50"
                >
                  Close Window
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordRecoveryPage;