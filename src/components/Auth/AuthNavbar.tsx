import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, ArrowLeft } from 'lucide-react';

export const AuthNavbar: React.FC = () => {
  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <ChefHat className="h-8 w-8 text-green-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">Recipe Revamped</span>
          </Link>
          
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};