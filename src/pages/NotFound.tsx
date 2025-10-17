import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Button } from '../components/ui/button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <SEOHead
        pageKey="home"
        customTitle="404 - Page Not Found | Recipe Revamped"
        customDescription="The page you're looking for doesn't exist. Return to Recipe Revamped to transform your recipes with AI."
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo/logo.png"
                alt="Recipe Revamped - AI Recipe Converter Logo"
                className="h-10 w-10 transition-transform duration-300 group-hover:scale-110"
                width="40"
                height="40"
              />
              <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Recipe Revamped</span>
            </Link>

            <Button asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* 404 Content */}
      <main className="relative pt-20 pb-12 sm:pt-24 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50/30 to-white -z-10" />
        <div className="absolute inset-0 opacity-30 -z-10">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-4xl mx-auto relative mt-12 sm:mt-20">
          <div className="text-center">
            {/* 404 Icon */}
            <div className="mb-8 sm:mb-12 flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <Search className="w-16 h-16 sm:w-20 sm:h-20 text-green-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl sm:text-3xl font-black">!</span>
                </div>
              </div>
            </div>

            {/* 404 Text */}
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm">
              <span className="text-lg">404</span>
              <span>Error</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
              Page Not Found
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
              <span className="block mt-2 font-semibold text-gray-900">Let's get you back on track!</span>
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full sm:w-auto px-4 sm:px-0">
              <Button asChild size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105 min-h-[44px]">
                <Link to="/">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Go to Home
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.history.back()}
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all duration-300 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
              <img
                src="/logo/logo.png"
                alt="Recipe Revamped - AI Recipe Converter Logo"
                className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
                width="32"
                height="32"
              />
              <span className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Recipe Revamped</span>
            </Link>
            <p className="text-sm text-gray-600 mb-6">
              AI-powered recipe conversion for 24+ dietary needs
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-6">
              <Link to="/privacy" className="text-sm text-gray-600 hover:text-green-600 transition-colors font-medium">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-gray-600 hover:text-green-600 transition-colors font-medium">
                Terms of Use
              </Link>
              <Link to="/cookies" className="text-sm text-gray-600 hover:text-green-600 transition-colors font-medium">
                Cookie Policy
              </Link>
            </div>
            <p className="text-sm text-gray-600">&copy; 2025 Recipe Revamped. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
