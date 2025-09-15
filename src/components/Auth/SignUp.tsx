import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, CheckCircle, Mail } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle } from '../../lib/firebase';
import { SignUpSchema, type SignUpInput } from '../../lib/validation';
import { z } from 'zod';

// Function to convert Firebase error codes to user-friendly messages for signup
const getSignUpErrorMessage = (error: any): string => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in or use a different email address.';
    
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    
    case 'auth/operation-not-allowed':
      return 'Email sign-up is not enabled. Please contact support.';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password with at least 8 characters.';
    
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection and try again.';
    
    case 'auth/popup-closed-by-user':
      return 'Sign-up was cancelled. Please try again.';
    
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
    
    case 'auth/cancelled-popup-request':
      return 'Sign-up was interrupted. Please try again.';
    
    case 'auth/invalid-api-key':
      return 'Configuration error. Please contact support.';
    
    case 'auth/app-deleted':
      return 'Service temporarily unavailable. Please try again later.';
    
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support for assistance.';
    
    case 'auth/requires-recent-login':
      return 'Please sign in again to continue.';
    
    default:
      // Check for password-related errors
      if (errorMessage.toLowerCase().includes('password')) {
        return 'Password does not meet requirements. Please ensure it has at least 8 characters with uppercase, lowercase, number, and special character.';
      }
      
      // Check for email-related errors
      if (errorMessage.toLowerCase().includes('email')) {
        return 'There was an issue with the email address. Please check and try again.';
      }
      
      // Generic fallback
      return 'An error occurred during sign-up. Please try again or contact support if the problem continues.';
  }
};

interface SignUpProps {
  onSignUp: () => void;
  onSwitchToSignIn: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSignUp, onSwitchToSignIn }) => {
  const [formData, setFormData] = useState<SignUpInput>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Partial<SignUpInput>>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const passwordRequirements = [
    { test: (p: string) => p.length >= 8, text: 'At least 8 characters' },
    { test: (p: string) => /[A-Z]/.test(p), text: 'One uppercase letter' },
    { test: (p: string) => /[a-z]/.test(p), text: 'One lowercase letter' },
    { test: (p: string) => /[0-9]/.test(p), text: 'One number' },
    { test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), text: 'One special character' }
  ];

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
      const validatedData = SignUpSchema.parse(formData);
      setLoading(true);

      await signUpWithEmail(validatedData.email, validatedData.password);
      setEmailSent(true);
      // Note: We do NOT call onSignUp() for email signups
      // The user must verify their email first
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<SignUpInput> = {};
        error.issues.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof SignUpInput] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        const friendlyMessage = getSignUpErrorMessage(error);
        setAuthError(friendlyMessage);
      }
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setAuthError('');
      await signInWithGoogle();
      onSignUp();
    } catch (error) {
      const friendlyMessage = getSignUpErrorMessage(error);
      setAuthError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show email verification sent screen
  if (emailSent) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 w-full max-w-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            Check Your Email
          </h2>
          
          <p className="text-sm text-gray-600 mb-6">
            We've sent a verification email to <strong>{formData.email}</strong>. 
            Please check your inbox and click the verification link to activate your account.
          </p>
          
          <button
            onClick={onSwitchToSignIn}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-md font-medium text-sm transition-colors"
          >
            Back to Sign In
          </button>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-600">
              <strong>Can't find the email?</strong> Check your spam folder. 
              The email may take a few minutes to arrive.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 w-full max-w-lg">
      <div className="text-center mb-6">
        <h2 className="text-xl font-medium text-gray-900">Create Account</h2>
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

        <div>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Confirm password"
              disabled={loading}
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
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Password Requirements Visual */}
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Password Requirements</h4>
          <div className="space-y-2">
            {passwordRequirements.map((req, index) => (
              <div key={index} className="flex items-center text-sm">
                <CheckCircle
                  className={`w-4 h-4 mr-2 transition-colors ${
                    req.test(formData.password) ? 'text-green-500' : 'text-gray-300'
                  }`}
                />
                <span className={`transition-colors ${
                  req.test(formData.password) ? 'text-green-700 font-medium' : 'text-gray-500'
                }`}>
                  {req.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {authError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{authError}</p>
          </div>
        )}


        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2.5 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onSwitchToSignIn}
            className="font-medium text-green-600 hover:text-green-500"
          >
            Sign in
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
          onClick={handleGoogleSignUp}
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
        By signing up, you automatically consent to:
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
