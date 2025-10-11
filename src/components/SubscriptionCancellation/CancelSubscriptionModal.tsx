import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Heart, MessageCircle } from 'lucide-react';
import { SubscriptionCancellationService } from '../../lib/subscriptionCancellationService';
import { useToast } from '../ToastContainer';
import { auth } from '../../lib/firebase';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancellationComplete?: () => void;
}

const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'not_using', label: 'Not using the features enough' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'found_alternative', label: 'Found a better alternative' },
  { value: 'technical_issues', label: 'Technical issues' },
  { value: 'temporary_pause', label: 'Taking a break (temporary)' },
  { value: 'other', label: 'Other reason' }
];

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onCancellationComplete
}) => {
  const [step, setStep] = useState<'preview' | 'reasons' | 'feedback' | 'processing' | 'completed'>('preview');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setStep('preview');
      setSelectedReason('');
      setFeedback('');
      setError('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleProceedToReasons = () => {
    setStep('reasons');
  };

  const handleReasonSelected = () => {
    if (!selectedReason) return;

    if (selectedReason === 'other') {
      setStep('feedback');
    } else {
      processCancellation();
    }
  };

  const processCancellation = async () => {
    setStep('processing');
    setProcessing(true);
    setError('');

    try {
      const reasonText = CANCELLATION_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
      const result = await SubscriptionCancellationService.confirmCancellation(reasonText, feedback);

      if (result.success) {
        setStep('completed');

        // Immediately hide the cancellation section and reactivation banner
        onCancellationComplete?.();

        // Trigger events to refresh subscription status and hide banners
        window.dispatchEvent(new CustomEvent('subscription-cancelled', {
          detail: { immediate: true }
        }));
        window.dispatchEvent(new CustomEvent('refresh-subscription'));

        // Close modal after a short delay to show success message
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        throw new Error(result.error || 'Cancellation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('reasons');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-300 overflow-hidden ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 text-white/90 hover:text-white transition-all duration-200 rounded-xl hover:bg-white/20 backdrop-blur-sm z-10"
          disabled={processing}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {step === 'preview' && (
            <>
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-8 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-8 relative overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg ring-2 ring-white/30">
                    <AlertTriangle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 drop-shadow-sm">
                    Cancel Your Subscription?
                  </h2>
                  <p className="text-red-50 text-base sm:text-lg font-semibold">
                    Are you sure you want to cancel your subscription?
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-xl p-5 mb-8 shadow-sm">
                <p className="text-sm sm:text-base text-blue-800 font-semibold leading-relaxed">
                  <strong className="font-black">Note:</strong> Your subscription will be cancelled at the end of your current billing period. You'll continue to have access to all features until then.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleProceedToReasons}
                  className="flex-1 bg-white text-red-600 font-bold py-3.5 px-6 rounded-xl border-2 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Continue Cancellation
                </button>
              </div>
            </>
          )}

          {step === 'reasons' && (
            <>
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-8 relative overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg ring-2 ring-white/30">
                    <MessageCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 drop-shadow-sm">
                    Help Us Improve
                  </h2>
                  <p className="text-green-50 text-base sm:text-lg font-semibold">
                    We're sorry to see you go. Could you tell us why you're cancelling?
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 shadow-sm">
                  <p className="text-red-800 text-sm font-semibold">{error}</p>
                </div>
              )}

              <div className="space-y-3 mb-8">
                {CANCELLATION_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedReason === reason.value
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50/50 shadow-lg transform scale-[1.02]'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50 hover:shadow-md'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="w-5 h-5 text-green-600 border-2 border-gray-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mr-4"
                    />
                    <span className={`text-base font-semibold ${
                      selectedReason === reason.value ? 'text-green-900' : 'text-gray-700'
                    }`}>
                      {reason.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep('preview')}
                  className="flex-1 bg-white text-gray-700 font-bold py-3.5 px-6 rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Back
                </button>
                <button
                  onClick={handleReasonSelected}
                  disabled={!selectedReason}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold py-3.5 px-6 rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 disabled:transform-none"
                >
                  {selectedReason === 'other' ? 'Continue' : 'Cancel Subscription'}
                </button>
              </div>
            </>
          )}

          {step === 'feedback' && (
            <>
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-8 relative overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg ring-2 ring-white/30">
                    <MessageCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 drop-shadow-sm">
                    Additional Feedback
                  </h2>
                  <p className="text-green-50 text-base sm:text-lg font-semibold">
                    Please share more details about your reason for cancelling
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  className="w-full p-4 border-2 border-gray-300 rounded-xl resize-none h-32 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium text-base shadow-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep('reasons')}
                  className="flex-1 bg-white text-gray-700 font-bold py-3.5 px-6 rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Back
                </button>
                <button
                  onClick={processCancellation}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold py-3.5 px-6 rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transform hover:scale-105"
                >
                  Cancel Subscription
                </button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <>
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-8 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-8 relative overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg ring-2 ring-white/30">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 drop-shadow-sm">
                    Processing Cancellation...
                  </h2>
                  <p className="text-blue-50 text-base sm:text-lg font-semibold">
                    Please wait while we cancel your subscription
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 'completed' && (
            <>
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-8 relative overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg ring-2 ring-white/30">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 drop-shadow-sm">
                    Subscription Cancelled
                  </h2>
                  <p className="text-green-50 text-base sm:text-lg font-semibold mb-4">
                    Your subscription has been cancelled successfully. You're now on the free plan.
                  </p>
                  <p className="text-sm text-green-100 font-medium">
                    Thank you for using Recipe Revamp. We hope to see you back soon!
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelSubscriptionModal;