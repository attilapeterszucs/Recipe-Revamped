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
    <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to={backLink} className="flex items-center gap-3 group">
            <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{title}</span>
          </Link>

          {!loading && (
            <Link
              to={backLink}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105"
            >
              {user ? (
                <Home className="h-4 w-4" />
              ) : (
                <ArrowLeft className="h-4 w-4" />
              )}
              {backText}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};