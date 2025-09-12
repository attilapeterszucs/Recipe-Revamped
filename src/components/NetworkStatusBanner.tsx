import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wifi, WifiOff, X, RefreshCw } from 'lucide-react';

interface NetworkStatusBannerProps {
  onRetry?: () => void;
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({ onRetry }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [networkIssueDetected, setNetworkIssueDetected] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message;
      if (typeof error === 'string' && error.includes('ERR_BLOCKED_BY_CLIENT')) {
        setNetworkIssueDetected(true);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason && typeof reason === 'object' && 'message' in reason) {
        const message = String(reason.message).toLowerCase();
        if (message.includes('blocked') || 
            message.includes('network') || 
            message.includes('fetch') ||
            message.includes('err_blocked_by_client')) {
          setNetworkIssueDetected(true);
        }
      }
    };

    // Listen for console errors that might indicate network issues
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorString = args.join(' ').toLowerCase();
      if (errorString.includes('err_blocked_by_client') || 
          errorString.includes('net::err_blocked_by_client') ||
          (errorString.includes('blocked') && errorString.includes('firebase'))) {
        setNetworkIssueDetected(true);
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, []);

  useEffect(() => {
    if (networkIssueDetected) {
      const now = Date.now();
      // Show banner if not dismissed or if dismissed more than 10 minutes ago
      if (!dismissedAt || (now - dismissedAt) > 10 * 60 * 1000) {
        setShowBanner(true);
      }
    }
  }, [networkIssueDetected, dismissedAt]);

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissedAt(Date.now());
    setNetworkIssueDetected(false);
  };

  const handleRetry = () => {
    setNetworkIssueDetected(false);
    setShowBanner(false);
    if (onRetry) {
      onRetry();
    } else {
      // Default retry action - reload the page
      window.location.reload();
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b-2 border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <WifiOff className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">
                  Connection Issues Detected
                </p>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Some requests are being blocked. This is usually caused by ad blockers or browser extensions. 
                <span className="font-medium"> Try disabling ad blockers</span> or 
                <span className="font-medium"> check your network connection</span>.
              </p>
              <div className="mt-2 text-xs text-yellow-600">
                <strong>Common solutions:</strong>
                <br />
                • Disable ad blockers (uBlock Origin, AdBlock Plus, etc.)
                <br />
                • Whitelist this site in your ad blocker
                <br />
                • Try a different browser or incognito mode
                <br />
                • Check your firewall or antivirus settings
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </button>
            <button
              onClick={handleDismiss}
              className="inline-flex items-center p-1.5 border border-transparent text-yellow-400 hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded-md"
            >
              <span className="sr-only">Dismiss</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};