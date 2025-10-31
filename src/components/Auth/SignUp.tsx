import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, CheckCircle, Mail, User } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle } from '../../lib/firebase';
import { SignUpSchema, type SignUpInput } from '../../lib/validation';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';
import { recordAffiliateSignup } from '../../lib/affiliateService';
import { logger } from '../../lib/logger';

// Function to convert Firebase error codes to user-friendly messages for signup
const getSignUpErrorMessage = (error: unknown): string => {
  const firebaseError = error as { code?: string; message?: string };
  const errorCode = firebaseError?.code || '';
  const errorMessage = firebaseError?.message || '';

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
    username: '',
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
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  // Extract affiliate code from URL parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setAffiliateCode(ref);
      logger.info('Affiliate code detected in signup URL', { code: ref });
    }
  }, []);

  const passwordRequirements = [
    { test: (p: string) => p.length >= 8, text: 'At least 8 characters' },
    { test: (p: string) => /[A-Z]/.test(p), text: 'One uppercase letter' },
    { test: (p: string) => /[a-z]/.test(p), text: 'One lowercase letter' },
    { test: (p: string) => /[0-9]/.test(p), text: 'One number' },
    { test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':",.<>/?]/.test(p), text: 'One special character' }
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

      const userCredential = await signUpWithEmail(validatedData.email, validatedData.password, validatedData.username);

      // Record affiliate signup if affiliate code is present
      if (affiliateCode && userCredential.user) {
        try {
          const result = await recordAffiliateSignup(userCredential.user.uid, affiliateCode);
          if (result.success) {
            logger.info('Affiliate signup recorded successfully', { userId: userCredential.user.uid });
          } else {
            logger.warn('Failed to record affiliate signup', { reason: result.message });
          }
        } catch (affiliateError) {
          // Don't block signup if affiliate recording fails
          logger.error('Error recording affiliate signup', { error: affiliateError });
        }
      }

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
      const userCredential = await signInWithGoogle();

      // Record affiliate signup if affiliate code is present
      if (affiliateCode && userCredential.user) {
        try {
          const result = await recordAffiliateSignup(userCredential.user.uid, affiliateCode);
          if (result.success) {
            logger.info('Affiliate signup recorded successfully via Google', { userId: userCredential.user.uid });
          } else {
            logger.warn('Failed to record affiliate signup via Google', { reason: result.message });
          }
        } catch (affiliateError) {
          // Don't block signup if affiliate recording fails
          logger.error('Error recording affiliate signup via Google', { error: affiliateError });
        }
      }

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
      <Card className="w-full max-w-lg shadow-2xl border-2 border-green-200 rounded-3xl backdrop-blur-sm bg-white/95">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 mb-6 shadow-lg ring-4 ring-green-200 ring-opacity-50">
            <Mail className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-black text-gray-900">Check Your Email</CardTitle>
          <CardDescription className="mt-2 text-base sm:text-lg font-semibold">
            We've sent a verification email to <strong className="text-green-700">{formData.email}</strong>.
            Please check your inbox and click the verification link to activate your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl shadow-sm">
            <AlertDescription className="text-green-800 font-semibold">
              <strong className="font-black">Can't find the email?</strong> Check your spam folder.
              The email may take a few minutes to arrive.
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter>
          <Button
            onClick={onSwitchToSignIn}
            className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/40"
          >
            Back to Sign In
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-2xl border-2 border-green-200 rounded-3xl backdrop-blur-sm bg-white/95">
      <CardHeader className="text-center pb-4">
        <Link to="/" className="flex items-center justify-center mb-6 group">
          <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-10 w-10 mr-3 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Recipe Revamped</span>
        </Link>
        <CardTitle className="text-2xl sm:text-3xl font-black text-gray-900">Create Account</CardTitle>
        <CardDescription className="text-base sm:text-lg mt-2 font-semibold">
          Join Recipe Revamped to start converting recipes with AI.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="font-bold text-gray-900">Username</Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              disabled={loading}
              className={cn("h-12 px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500 font-medium shadow-sm", errors.username && "border-destructive")}
            />
            {errors.username && (
              <p className="text-sm text-destructive font-semibold">{errors.username}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold text-gray-900">Email address</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              disabled={loading}
              className={cn("h-12 px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500 font-medium shadow-sm", errors.email && "border-destructive")}
            />
            {errors.email && (
              <p className="text-sm text-destructive font-semibold">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold text-gray-900">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                disabled={loading}
                className={cn("h-12 px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500 font-medium shadow-sm", errors.password && "border-destructive")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                tabIndex={-1}
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive font-semibold">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-bold text-gray-900">Confirm password</Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                disabled={loading}
                className={cn("h-12 px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500 font-medium shadow-sm", errors.confirmPassword && "border-destructive")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                tabIndex={-1}
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive font-semibold">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Password Requirements Visual */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <h4 className="text-sm font-black text-gray-900 mb-4">Password Requirements</h4>
              <div className="space-y-3">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <CheckCircle
                      className={cn(
                        "w-5 h-5 mr-3 transition-all duration-200",
                        req.test(formData.password) ? 'text-green-600 scale-110' : 'text-gray-300'
                      )}
                    />
                    <span className={cn(
                      "transition-all duration-200",
                      req.test(formData.password) ? 'text-green-700 font-bold' : 'text-gray-600 font-semibold'
                    )}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {authError && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription className="font-semibold">{authError}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="space-y-4 flex-col">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/40"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <div className="text-center text-sm text-gray-600 font-medium">
            Already have an account?{' '}
            <Button
              variant="link"
              onClick={onSwitchToSignIn}
              className="h-auto p-0 text-sm font-bold text-green-600 hover:text-green-700"
            >
              Sign in
            </Button>
          </div>

          <div className="relative w-full">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-card px-2 text-xs text-muted-foreground font-medium">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full h-12 border-2 border-gray-300 hover:border-green-400 hover:bg-green-50 font-bold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Consent Statement */}
          <div className="text-xs text-gray-500 text-center space-y-1 pt-2">
            <p className="font-medium">By signing up, you automatically consent to:</p>
            <p>• Sharing your recipe data with OpenAI for AI-powered recipe generation</p>
            <p>• Processing of your dietary preferences and recipe requests</p>
            <p>• Data usage for improving our AI recipe services</p>
            <p>
              See our{' '}
              <Button variant="link" asChild className="h-auto p-0 text-xs underline text-green-600 hover:text-green-700 font-medium">
                <Link to="/terms-of-service">Terms of Service</Link>
              </Button>
              {' '}and{' '}
              <Button variant="link" asChild className="h-auto p-0 text-xs underline text-green-600 hover:text-green-700 font-medium">
                <Link to="/privacy-policy">Privacy Policy</Link>
              </Button>
              {' '}for details.
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};
