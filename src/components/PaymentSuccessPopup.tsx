import React, { useState, useEffect } from 'react';
import { CheckCircle, X, CreditCard, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentSuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentSuccessPopup: React.FC<PaymentSuccessPopupProps> = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);

      // Start countdown for redirect
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/app');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, navigate]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for fade out animation
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 touch-friendly"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Success Icon with Animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              {/* Sparkle effects */}
              <div className="absolute -top-2 -right-2 text-yellow-400 animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-2 -left-2 text-yellow-400 animate-bounce delay-150">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Payment Successful! 🎉
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Thank you for choosing Recipe Revamp
            </p>
          </div>

          {/* Main Message */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">
                  Subscription Activation in Progress
                </h3>
                <p className="text-green-700 text-sm leading-relaxed">
                  We've received your payment successfully! Your subscription plan will be activated
                  for your account as soon as we process the payment. This usually takes up to 5 minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Processing Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-800 mb-1 text-sm">
                  What happens next?
                </h4>
                <ul className="text-blue-700 text-xs sm:text-sm space-y-1">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                    Payment processing (up to 5 minutes)
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                    Account upgrade activation
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                    Welcome email with details
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                    Redirect to recipe converter
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Redirect Countdown */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <ArrowRight className="w-5 h-5 text-green-600" />
              <div className="text-center">
                <h4 className="font-semibold text-green-800 mb-1">
                  Redirecting to Recipe Converter
                </h4>
                <p className="text-green-700 text-sm">
                  Automatically redirecting in <span className="font-bold">{countdown}</span> seconds...
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/app')}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-[1.02] touch-friendly min-h-[44px] flex items-center justify-center space-x-2"
            >
              <span>Start Converting Recipes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="flex-1 sm:flex-none bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors touch-friendly min-h-[44px]"
            >
              Got it!
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@reciperevamped.com" className="text-green-600 hover:underline">
                support@reciperevamped.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPopup;