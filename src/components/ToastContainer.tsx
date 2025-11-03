import React, { useState, useCallback, useContext, createContext } from 'react';
import { createPortal } from 'react-dom';
import { Toast, type ToastType, type ToastAction } from './Toast';

interface ToastData {
  id: string;
  type: ToastType;
  action?: ToastAction;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  showSuccess: (title: string, message?: string, action?: ToastAction) => void;
  showError: (title: string, message?: string, action?: ToastAction) => void;
  showWarning: (title: string, message?: string, action?: ToastAction) => void;
  showInfo: (title: string, message?: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const showSuccess = useCallback((title: string, message?: string, action?: ToastAction) => {
    showToast({ type: 'success', title, message, action });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, action?: ToastAction) => {
    showToast({ type: 'error', title, message, action });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string, action?: ToastAction) => {
    showToast({ type: 'warning', title, message, action });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string, action?: ToastAction) => {
    showToast({ type: 'info', title, message, action });
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast Container - Rendered via Portal to document.body for proper viewport positioning */}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm pointer-events-none">
          <div className="pointer-events-auto space-y-2">
            {toasts.map(toast => (
              <Toast
                key={toast.id}
                id={toast.id}
                type={toast.type}
                action={toast.action}
                title={toast.title}
                message={toast.message}
                duration={toast.duration}
                onDismiss={dismissToast}
              />
            ))}
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;