import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SignUp } from '../components/Auth/SignUp';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/app');
  };

  const handleSwitchToSignIn = () => {
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center hover:opacity-75 transition-opacity">
              <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-8 w-8 mr-2" />
              <span className="text-xl font-bold text-gray-900">Recipe Revamped</span>
            </Link>
            <Link to="/" className="flex items-center text-gray-600 hover:text-green-600 transition-colors group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
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