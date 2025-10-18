import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, AlertTriangle, CheckCircle } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { updateProfile, User as FirebaseUser } from 'firebase/auth';
import { db } from '../lib/firebase';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface ReactivationModalProps {
  isOpen: boolean;
  user: FirebaseUser;
  onReactivate: () => void;
  onDecline: () => void;
}

export const ReactivationModal: React.FC<ReactivationModalProps> = ({
  isOpen,
  user,
  onReactivate,
  onDecline
}) => {
  const [isReactivating, setIsReactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll when reactivation modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleReactivate = async () => {
    try {
      setIsReactivating(true);
      setError(null);

      // Update account status in Firestore
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, {
        accountStatus: 'active',
        reactivatedAt: new Date(),
        updatedAt: new Date()
      });

      // Clean up display name if it has "(Deactivated)" suffix
      if (user.displayName && user.displayName.includes('(Deactivated)')) {
        const cleanDisplayName = user.displayName.replace(' (Deactivated)', '');
        await updateProfile(user, {
          displayName: cleanDisplayName
        });
      }

      onReactivate();
    } catch (error) {
      console.error('Failed to reactivate account:', error);
      setError('Failed to reactivate account. Please try again.');
    } finally {
      setIsReactivating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-4">
            <User className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Welcome Back!
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Your account was previously deactivated. Would you like to reactivate it and restore full access to your RecipeRevamp account?
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-800 font-medium mb-1">Reactivation includes:</p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• Access to all your saved recipes</li>
                <li>• Restoration of your previous settings</li>
                <li>• Full account functionality</li>
                <li>• All your data preserved</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onDecline}
            disabled={isReactivating}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
          >
            Not Now
          </button>
          <button
            onClick={handleReactivate}
            disabled={isReactivating}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {isReactivating ? 'Reactivating...' : 'Yes, Reactivate'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          You can always deactivate your account again in Settings if needed.
        </p>
      </div>
    </div>,
    document.body
  );
};