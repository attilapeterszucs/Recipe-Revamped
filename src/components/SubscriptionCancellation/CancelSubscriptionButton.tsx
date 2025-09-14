import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';

interface CancelSubscriptionButtonProps {
  className?: string;
  variant?: 'button' | 'link';
  onCancellationComplete?: () => void;
}

export const CancelSubscriptionButton: React.FC<CancelSubscriptionButtonProps> = ({
  className = '',
  variant = 'button',
  onCancellationComplete
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleCancellationComplete = () => {
    setShowModal(false);
    onCancellationComplete?.();
  };

  if (variant === 'link') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`text-red-600 hover:text-red-700 underline text-sm ${className}`}
        >
          Cancel Subscription
        </button>
        <CancelSubscriptionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onCancellationComplete={handleCancellationComplete}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors ${className}`}
      >
        <AlertTriangle className="w-4 h-4 mr-2" />
        Cancel Subscription
      </button>
      <CancelSubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCancellationComplete={handleCancellationComplete}
      />
    </>
  );
};

export default CancelSubscriptionButton;