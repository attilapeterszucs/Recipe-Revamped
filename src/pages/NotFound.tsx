import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Button } from '../components/ui/button';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <SEOHead
        pageKey="home"
        customTitle="404 - Page Not Found | Recipe Revamped"
        customDescription="The page you're looking for doesn't exist. Return to Recipe Revamped to transform your recipes with AI."
      />

      {/* Navigation */}
      <AuthAwareNavigation title="Recipe Revamped" />

      {/* 404 Content */}
      <main className="relative pt-24 pb-12 sm:pt-28 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen flex items-center">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50/30 to-white -z-10" />
        <div className="absolute inset-0 opacity-30 -z-10">
          <div className="absolute top-0 -left-4 w-72 h-72 sm:w-96 sm:h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 sm:w-96 sm:h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 sm:w-96 sm:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-4xl mx-auto relative w-full">
          <div className="text-center px-2">
            {/* 404 Icon */}
            <div className="mb-6 sm:mb-8 md:mb-12 flex justify-center">
              <div className="relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <Search className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 text-green-600" />
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl sm:text-2xl md:text-3xl font-black">!</span>
                </div>
              </div>
            </div>

            {/* 404 Text */}
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 shadow-sm">
              <span className="text-base sm:text-lg">404</span>
              <span className="text-xs sm:text-sm">Error</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
              Page Not Found
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
              Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
              <span className="block mt-2 font-semibold text-gray-900">Let's get you back on track!</span>
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full sm:w-auto max-w-md sm:max-w-none mx-auto">
              <Button asChild size="lg" className="w-full sm:w-auto text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105 min-h-[44px]">
                <Link to="/">
                  <Home className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-2" />
                  Go to Home
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.history.back()}
                className="w-full sm:w-auto text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all duration-300 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-2" />
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
                className="h-10 w-10 transition-transform duration-300 group-hover:scale-110"
                width="40"
                height="40"
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
