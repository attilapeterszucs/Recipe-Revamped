import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignUp } from '../components/Auth/SignUp';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSignUp = () => {
    navigate('/app');
  };

  const handleSwitchToSignIn = () => {
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignUp onSignUp={handleSignUp} onSwitchToSignIn={handleSwitchToSignIn} />
      </div>
    </div>
  );
};