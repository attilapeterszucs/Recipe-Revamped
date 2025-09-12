import React from 'react';
import { Link } from 'react-router-dom';
// Remove ChefHat import as we're using logo image now

export const AppFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-gray-300 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <div className="flex items-center mb-3 sm:mb-4">
              <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
              <span className="text-base sm:text-lg font-semibold text-white">Recipe Revamped</span>
            </div>
            <p className="text-sm text-gray-400">
              The AI-powered recipe converter with transparent data practices.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={scrollToTop} className="hover:text-white transition-colors text-left">Recipe Converter</button></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Use</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm">
          <p>&copy; 2025 Recipe Revamped. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};