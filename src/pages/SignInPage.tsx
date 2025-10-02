import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn } from '../components/Auth/SignIn';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSignIn = () => {
    navigate('/app');
  };

  const handleSwitchToSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated gradient background with blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50/30 to-white -z-10" />
      <div className="absolute inset-0 opacity-30 -z-10">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-md">
        <SignIn onSignIn={handleSignIn} onSwitchToSignUp={handleSwitchToSignUp} />
      </div>
    </div>
  );
};