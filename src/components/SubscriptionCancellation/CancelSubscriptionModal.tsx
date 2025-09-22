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

        // Call completion callback after a short delay
        setTimeout(() => {
          onCancellationComplete?.();
          handleClose();
        }, 3000);
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          disabled={processing}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {step === 'preview' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Cancel Your Subscription?
                </h2>
                <p className="text-gray-600">
                  Are you sure you want to cancel your subscription?
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Your subscription will be cancelled at the end of your current billing period. You'll continue to have access to all features until then.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleProceedToReasons}
                  className="flex-1 bg-red-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Continue Cancellation
                </button>
              </div>
            </>
          )}

          {step === 'reasons' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Help Us Improve
                </h2>
                <p className="text-gray-600">
                  We're sorry to see you go. Could you tell us why you're cancelling?
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                {CANCELLATION_REASONS.map((reason) => (
                  <label key={reason.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-gray-700">{reason.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep('preview')}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleReasonSelected}
                  disabled={!selectedReason}
                  className="flex-1 bg-red-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedReason === 'other' ? 'Continue' : 'Cancel Subscription'}
                </button>
              </div>
            </>
          )}

          {step === 'feedback' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Additional Feedback
                </h2>
                <p className="text-gray-600">
                  Please share more details about your reason for cancelling
                </p>
              </div>

              <div className="mb-6">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  className="w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep('reasons')}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={processCancellation}
                  className="flex-1 bg-red-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancel Subscription
                </button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Processing Cancellation...
              </h2>
              <p className="text-gray-600">
                Please wait while we cancel your subscription
              </p>
            </div>
          )}

          {step === 'completed' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Subscription Cancelled
              </h2>
              <p className="text-gray-600 mb-4">
                Your subscription has been cancelled successfully. You now have access to our free plan.
              </p>
              <p className="text-sm text-gray-500">
                Thank you for using Recipe Revamp. We hope to see you back soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelSubscriptionModal;