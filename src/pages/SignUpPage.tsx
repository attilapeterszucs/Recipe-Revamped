import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SignUp } from '../components/Auth/SignUp';
import { Button } from '../components/ui/button';

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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center hover:opacity-75 transition-opacity">
              <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-8 w-8 mr-2" />
              <span className="text-xl font-bold text-foreground">Recipe Revamped</span>
            </Link>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary">
              <Link to="/" className="flex items-center group">
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <SignUp onSignUp={handleSignUp} onSwitchToSignIn={handleSwitchToSignIn} />
        </div>
      </div>
    </div>
  );
};