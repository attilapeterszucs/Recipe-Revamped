import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error but don't spam console for network errors
    if (!error.message.includes('net::ERR_BLOCKED_BY_CLIENT') && 
        !error.message.includes('ERR_BLOCKED_BY_CLIENT') &&
        !error.message.includes('Failed to fetch')) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message && (
        this.state.error.message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
        this.state.error.message.includes('ERR_BLOCKED_BY_CLIENT') ||
        this.state.error.message.includes('Failed to fetch') ||
        this.state.error.message.includes('NetworkError')
      );

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-2" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {isNetworkError ? 'Connection Issue' : 'Something went wrong'}
              </h1>
              <p className="text-gray-600 text-sm">
                {isNetworkError 
                  ? 'It looks like an ad blocker or network extension is blocking some requests. This may affect app functionality.'
                  : 'An unexpected error occurred. Please try refreshing the page.'}
              </p>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Reload Page
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>

            {isNetworkError && (
              <div className="mt-4 text-xs text-gray-500">
                <p>💡 Tip: Try disabling ad blockers or extensions temporarily</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}