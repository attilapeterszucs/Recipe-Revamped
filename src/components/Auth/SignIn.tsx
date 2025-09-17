import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Mail } from 'lucide-react';
import { signInWithEmail, signInWithGoogle, resendEmailVerification, resetPassword } from '../../lib/firebase';
import { SignInSchema, type SignInInput } from '../../lib/validation';
import { z } from 'zod';

// Function to convert Firebase error codes to user-friendly messages
const getAuthErrorMessage = (error: unknown): string => {
  const errorCode = (error as any)?.code || '';
  const errorMessage = (error as any)?.message || '';

  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please check your credentials and try again.';
    
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support for assistance.';
    
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes before trying again.';
    
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection and try again.';
    
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
    
    case 'auth/cancelled-popup-request':
      return 'Sign-in was interrupted. Please try again.';
    
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    
    case 'auth/invalid-api-key':
      return 'Configuration error. Please contact support.';
    
    case 'auth/app-deleted':
      return 'Service temporarily unavailable. Please try again later.';
    
    case 'auth/requires-recent-login':
      return 'Please sign in again to continue.';
    
    default:
      // Check for email verification errors in the message
      if (errorMessage.toLowerCase().includes('verify') || errorMessage.toLowerCase().includes('verification')) {
        return 'Please verify your email address before signing in. Check your inbox for a verification link.';
      }
      
      // Check for other common error patterns
      if (errorMessage.toLowerCase().includes('password')) {
        return 'Invalid password. Please check your password and try again.';
      }
      
      // Generic fallback
      return 'An error occurred during sign-in. Please try again or contact support if the problem continues.';
  }
};

interface SignInProps {
  onSignIn: () => void;
  onSwitchToSignUp: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onSignIn, onSwitchToSignUp }) => {
  const [formData, setFormData] = useState<SignInInput>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<SignInInput>>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationHelper, setShowVerificationHelper] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lastResendTime, setLastResendTime] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setAuthError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const validatedData = SignInSchema.parse(formData);
      setLoading(true);

      await signInWithEmail(validatedData.email, validatedData.password);
      onSignIn();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<SignInInput> = {};
        error.issues.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof SignInInput] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        const friendlyMessage = getAuthErrorMessage(error);
        setAuthError(friendlyMessage);
        // Show verification helper if error message mentions email verification
        if (friendlyMessage.toLowerCase().includes('verify') || friendlyMessage.toLowerCase().includes('verification')) {
          setShowVerificationHelper(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer effect
  React.useEffect(() => {
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

  const handleResendVerification = async () => {
    // Check if still in cooldown
    const now = Date.now();
    const timeSinceLastResend = now - lastResendTime;
    const cooldownPeriod = 60000; // 60 seconds in milliseconds
    
    if (timeSinceLastResend < cooldownPeriod && lastResendTime > 0) {
      const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastResend) / 1000);
      setResendCooldown(remainingTime);
      setAuthError(`Please wait ${remainingTime} seconds before requesting another verification email.`);
      return;
    }

    try {
      await resendEmailVerification();
      setAuthError('Verification email sent! Please check your inbox.');
      setShowVerificationHelper(false);
      setLastResendTime(now);
      setResendCooldown(60); // Start 60-second cooldown
    } catch {
      setAuthError('Unable to resend verification email. Please sign up again if needed.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAuthError('');
      await signInWithGoogle();
      onSignIn();
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error);
      setAuthError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    try {
      setResetLoading(true);
      await resetPassword(resetEmail);
      setResetSuccess(true);
      setAuthError('');
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error);
      setAuthError(friendlyMessage);
    } finally {
      setResetLoading(false);
    }
  };

  // Show password reset success screen
  if (resetSuccess) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 w-full max-w-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            Password Reset Email Sent
          </h2>
          
          <p className="text-sm text-gray-600 mb-6">
            We've sent a password reset link to <strong>{resetEmail}</strong>. 
            Please check your inbox and follow the instructions to reset your password.
          </p>
          
          <button
            onClick={() => {
              setResetSuccess(false);
              setShowPasswordReset(false);
              setResetEmail('');
            }}
            className="w-full px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Back to Sign In
          </button>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-600">
              <strong>Can't find the email?</strong> Check your spam folder. 
              The email comes from Recipe Revamped and may take a few minutes to arrive.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show password reset form
  if (showPasswordReset) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 w-full max-w-lg">
        <div className="text-center mb-6">
          <h2 className="text-xl font-medium text-gray-900">Reset Password</h2>
          <p className="text-sm text-gray-600 mt-2">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Email address"
              disabled={resetLoading}
              required
            />
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{authError}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={resetLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2.5 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center"
            >
              {resetLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Send Reset Email'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPasswordReset(false);
                setResetEmail('');
                setAuthError('');
              }}
              className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </div>
    );
  }


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 w-full max-w-lg">
      <div className="text-center mb-6">
        <h2 className="text-xl font-medium text-gray-900">Sign In</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Email address"
            disabled={loading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Password"
              disabled={loading}
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
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        {authError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{authError}</p>
            {showVerificationHelper && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <div className="flex items-center text-blue-600 mb-2">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Need help with verification?</span>
                </div>
                <button
                  onClick={handleResendVerification}
                  disabled={resendCooldown > 0}
                  className={`text-sm underline transition-colors ${
                    resendCooldown > 0 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  {resendCooldown > 0 
                    ? `Wait ${resendCooldown}s to resend`
                    : 'Resend verification email'
                  }
                </button>
              </div>
            )}
          </div>
        )}

        <div className="text-right">
          <button
            type="button"
            onClick={() => {
              setShowPasswordReset(true);
              setResetEmail(formData.email); // Pre-fill with current email if any
            }}
            className="text-sm text-green-600 hover:text-green-700 underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2.5 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignUp}
            className="font-medium text-green-600 hover:text-green-500"
          >
            Sign up
          </button>
        </p>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-4 w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2.5 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Consent Statement */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        By signing in, you automatically consent to:
        <br />
        • Sharing your recipe data with OpenAI for AI-powered recipe generation
        <br />
        • Processing of your dietary preferences and recipe requests
        <br />
        • Data usage for improving our AI recipe services
        <br />
        See our <Link to="/terms" className="underline hover:text-green-600">Terms of Use</Link> and{' '}
        <Link to="/privacy" className="underline hover:text-green-600">Privacy Policy</Link> for details.
      </p>
    </div>
  );
};
