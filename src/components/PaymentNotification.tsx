import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, X, Sparkles } from 'lucide-react';

interface PaymentNotificationProps {
  type: 'success' | 'pending' | 'error';
  title: string;
  message: string;
  onClose: () => void;
}

export const PaymentNotification: React.FC<PaymentNotificationProps> = ({
  type,
  title,
  message,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-close after 8 seconds for success, 6 seconds for others
    const timeoutMs = type === 'success' ? 8000 : 6000;
    const timer = setTimeout(() => {
      handleClose();
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [type]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          iconColor: 'text-green-600',
          bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700',
          closeColor: 'text-green-500 hover:text-green-700'
        };
      case 'pending':
        return {
          icon: <Clock className="w-6 h-6" />,
          iconColor: 'text-blue-600',
          bgColor: 'bg-gradient-to-br from-blue-50 to-sky-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700',
          closeColor: 'text-blue-500 hover:text-blue-700'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-6 h-6" />,
          iconColor: 'text-red-600',
          bgColor: 'bg-gradient-to-br from-red-50 to-pink-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700',
          closeColor: 'text-red-500 hover:text-red-700'
        };
    }
  };

  const config = getConfig();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm transition-opacity duration-300 z-50 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Notification */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`relative max-w-md w-full transform transition-all duration-300 pointer-events-auto ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className={`
            ${config.bgColor} ${config.borderColor}
            rounded-2xl border-2 shadow-2xl p-6
            backdrop-blur-sm
          `}>
            {/* Success sparkles effect */}
            {type === 'success' && (
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
              </div>
            )}

            {/* Close button */}
            <button
              onClick={handleClose}
              className={`absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 transition-colors ${config.closeColor}`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="flex items-start space-x-4">
              {/* Icon */}
              <div className={`flex-shrink-0 ${config.iconColor}`}>
                {config.icon}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-bold ${config.titleColor} mb-2`}>
                  {title}
                </h3>
                <p className={`text-sm leading-relaxed ${config.messageColor}`}>
                  {message}
                </p>
                
                {/* Action suggestion for pending */}
                {type === 'pending' && (
                  <div className="mt-4 p-3 bg-white/50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium">
                      💡 Tip: Refresh the page in a few minutes if your subscription doesn't appear automatically.
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentNotification;