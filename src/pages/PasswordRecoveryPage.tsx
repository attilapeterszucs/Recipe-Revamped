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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 w-full max-w-lg overflow-hidden transform transition-all duration-300 relative">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(34, 197, 94, 0.3) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}></div>
        </div>

        <div className="text-center relative">
          {status === 'loading' && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 mb-6 shadow-lg ring-4 ring-blue-200 ring-opacity-50">
                <Loader className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
                Verifying Reset Link
              </h1>
              <p className="text-base sm:text-lg text-gray-600 font-semibold">
                Please wait while we verify your password reset link...
              </p>
            </>
          )}

          {status === 'form' && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 mb-6 shadow-lg ring-4 ring-green-200 ring-opacity-50">
                <Lock className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
                Reset Your Password
              </h1>
              <p className="text-base sm:text-lg text-gray-700 mb-8 font-semibold">
                Create a new password for <strong className="text-green-600">{email}</strong>
              </p>

              <form onSubmit={handlePasswordReset} className="space-y-5 text-left">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium transition-all duration-200 shadow-sm"
                      placeholder="Enter new password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium transition-all duration-200 shadow-sm"
                      placeholder="Confirm new password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-2xl border-2 border-green-200 shadow-sm">
                  <h4 className="text-sm font-black text-gray-900 mb-4">Password Requirements</h4>
                  <div className="space-y-3">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircle
                          className={`w-5 h-5 mr-3 transition-all duration-200 ${
                            req.test(newPassword) ? 'text-green-600 scale-110' : 'text-gray-300'
                          }`}
                        />
                        <span className={`transition-all duration-200 ${
                          req.test(newPassword) ? 'text-green-700 font-bold' : 'text-gray-600 font-semibold'
                        }`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {message && (
                  <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50/50 border-2 border-red-200 rounded-xl shadow-sm">
                    <p className="text-sm text-red-800 font-semibold">{message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3.5 px-6 rounded-xl font-bold text-base transition-all duration-200 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 disabled:shadow-none transform hover:scale-105 disabled:transform-none flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}

          {status === 'success' && (
            <div className={`transition-all duration-300 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 mb-6 shadow-lg ring-4 ring-green-200 ring-opacity-50 animate-pulse">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
                Password Reset Successfully! 🔒
              </h1>
              <p className="text-base sm:text-lg text-gray-700 mb-6 font-semibold leading-relaxed">
                {message}
              </p>

              {/* Countdown Circle */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40" cy="40" r="36"
                      fill="transparent"
                      stroke="#e5e7eb"
                      strokeWidth="6"
                    />
                    <circle
                      cx="40" cy="40" r="36"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="6"
                      strokeDasharray="226.195"
                      strokeDashoffset={226.195 * (1 - countdown / 5)}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-green-600">{countdown}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-8 font-semibold">
                This window will close automatically in {countdown} seconds
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleClose}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3.5 px-6 rounded-xl font-bold text-base transition-all duration-200 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105"
                >
                  Close Window Now
                </button>
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full border-2 border-gray-300 text-gray-700 py-3.5 px-6 rounded-xl font-bold text-base transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md"
                >
                  Go to Sign In Page
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 mb-6 shadow-lg ring-4 ring-red-200 ring-opacity-50">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
                Password Reset Failed
              </h1>
              <p className="text-base sm:text-lg text-gray-700 mb-8 font-semibold leading-relaxed">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3.5 px-6 rounded-xl font-bold text-base transition-all duration-200 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105"
                >
                  Back to Sign In
                </button>
                <button
                  onClick={handleClose}
                  className="w-full border-2 border-gray-300 text-gray-700 py-3.5 px-6 rounded-xl font-bold text-base transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md"
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