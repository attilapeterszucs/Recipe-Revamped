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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignIn onSignIn={handleSignIn} onSwitchToSignUp={handleSwitchToSignUp} />
      </div>
    </div>
  );
};