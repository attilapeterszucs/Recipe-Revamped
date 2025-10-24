import React from 'react';
import { Link } from 'react-router-dom';

export const AppFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200 py-16 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <button onClick={scrollToTop} className="flex items-center gap-2 mb-4 group" aria-label="Return to top of page - Recipe Revamped home">
              <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-8 w-8 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Recipe Revamped</span>
            </button>
            <p className="text-sm text-gray-600 leading-relaxed">
              AI-powered recipe conversion for 24+ dietary needs. Transform any recipe instantly.
            </p>
          </div>

          <div>
            <h4 className="text-gray-900 font-bold mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={scrollToTop} className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                  Recipe Converter
                </button>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-gray-900 font-bold mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" onClick={scrollToTop} className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                  Contact & FAQ
                </Link>
              </li>
              <li>
                <Link to="/partnerships" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                  Partnerships
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-gray-900 font-bold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy-policy" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">&copy; 2025 Recipe Revamped. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <button onClick={scrollToTop} className="text-sm text-gray-600 hover:text-green-600 transition-colors font-medium">
                Back to Top ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};