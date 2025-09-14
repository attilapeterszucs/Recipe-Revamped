import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updatePageSEO, SEO_CONFIGS, type SEOConfig } from '../utils/seo';

interface SEOHeadProps {
  pageKey?: string;
  customSEO?: Partial<SEOConfig>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ pageKey, customSEO }) => {
  const location = useLocation();

  useEffect(() => {
    // Determine the page key from the current path if not provided
    let currentPageKey = pageKey;

    if (!currentPageKey) {
      const path = location.pathname;

      if (path === '/' || path === '') {
        currentPageKey = 'home';
      } else if (path === '/app') {
        currentPageKey = 'app';
      } else if (path === '/about') {
        currentPageKey = 'about';
      } else if (path === '/contact') {
        currentPageKey = 'contact';
      } else if (path === '/blog') {
        currentPageKey = 'blog';
      } else if (path === '/signin') {
        currentPageKey = 'signin';
      } else if (path === '/signup') {
        currentPageKey = 'signup';
      } else if (path === '/privacy') {
        currentPageKey = 'privacy';
      } else if (path === '/terms') {
        currentPageKey = 'terms';
      } else if (path === '/cookies') {
        currentPageKey = 'cookies';
      } else {
        currentPageKey = 'home'; // fallback
      }
    }

    // Apply custom SEO if provided
    if (customSEO && currentPageKey) {
      const baseConfig = SEO_CONFIGS[currentPageKey] || SEO_CONFIGS.home;
      const mergedConfig = { ...baseConfig, ...customSEO };

      // Create a temporary config entry
      const tempKey = `${currentPageKey}_custom`;
      (SEO_CONFIGS as any)[tempKey] = mergedConfig;
      updatePageSEO(tempKey);

      // Clean up
      delete (SEO_CONFIGS as any)[tempKey];
    } else if (currentPageKey) {
      updatePageSEO(currentPageKey);
    }

    // Add page view tracking for analytics
    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('config', 'G-CR787RJ2VK', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname
      });
    }
  }, [location.pathname, pageKey, customSEO]);

  return null; // This component doesn't render anything
};

export default SEOHead;