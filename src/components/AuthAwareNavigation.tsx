import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthAwareNavigationProps {
  title?: string;
}

export const AuthAwareNavigation: React.FC<AuthAwareNavigationProps> = ({ 
  title = "Recipe Revamped" 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const backLink = user ? '/app' : '/';
  const backText = user ? 'Back to App' : 'Back to Home';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link to={backLink} className="flex items-center hover:opacity-75 transition-opacity">
            <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-8 w-8 mr-2" />
            <span className="text-xl font-bold text-gray-900">{title}</span>
          </Link>
          
          {!loading && (
            <Link to={backLink} className="flex items-center text-gray-600 hover:text-green-600 transition-colors group">
              {user ? (
                <Home className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              )}
              {backText}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};