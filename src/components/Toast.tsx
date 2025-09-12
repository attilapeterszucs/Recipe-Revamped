import React, { useEffect } from 'react';
import { Check, X, AlertCircle, Info, Trash2, Save, Upload, Download } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastAction = 'save' | 'delete' | 'backup' | 'restore' | 'auto-save' | 'settings' | 'general';

interface ToastProps {
  id: string;
  type: ToastType;
  action?: ToastAction;
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'error':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

const getToastIcon = (type: ToastType, action?: ToastAction) => {
  // First check for action-specific icons
  if (action) {
    switch (action) {
      case 'save':
      case 'auto-save':
        return <Save className="w-5 h-5 text-green-600" />;
      case 'delete':
        return <Trash2 className="w-5 h-5 text-red-600" />;
      case 'backup':
        return <Upload className="w-5 h-5 text-blue-600" />;
      case 'restore':
        return <Download className="w-5 h-5 text-blue-600" />;
      case 'settings':
        return <Check className="w-5 h-5 text-green-600" />;
    }
  }
  
  // Fall back to type-based icons
  switch (type) {
    case 'success':
      return <Check className="w-5 h-5 text-green-600" />;
    case 'error':
      return <X className="w-5 h-5 text-red-600" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-600" />;
    default:
      return <Info className="w-5 h-5 text-gray-600" />;
  }
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  action,
  title,
  message,
  duration = 4000,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const handleDismiss = () => {
    onDismiss(id);
  };

  return (
    <div
      className={`flex items-start p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 ${getToastStyles(type)}`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">
        {getToastIcon(type, action)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">
          {title}
        </p>
        {message && (
          <p className="mt-1 text-sm opacity-90">
            {message}
          </p>
        )}
      </div>
      
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md p-1"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;