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
        className={`group inline-flex items-center gap-2 px-4 py-2 text-yellow-600 font-semibold text-sm rounded-lg border-2 border-transparent hover:border-yellow-500 hover:bg-yellow-50 transition-all duration-300 hover:scale-105 ${className}`}
      >
        <AlertTriangle className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
        <span>Cancel Subscription</span>
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