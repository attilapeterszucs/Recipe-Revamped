import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, AlertTriangle, CheckCircle, Sparkles, RefreshCw, Database, Shield } from 'lucide-react';
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 relative overflow-hidden">
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>

          <div className="relative z-10 text-center">
            <div className="mx-auto flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-black text-white mb-2">
              Welcome Back!
            </h3>
            <p className="text-green-100 text-sm">
              We're excited to see you again
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          <p className="text-gray-700 text-center leading-relaxed mb-6 text-base">
            Your account was previously deactivated. Would you like to reactivate it and restore full access to your Recipe Revamped account?
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start space-x-3 animate-in fade-in duration-200">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Benefits Grid */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 font-black">Reactivation Benefits:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Database className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">All Recipes</p>
                  <p className="text-xs text-gray-600">Instant access</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Settings Restored</p>
                  <p className="text-xs text-gray-600">Your preferences</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Data Preserved</p>
                  <p className="text-xs text-gray-600">100% secure</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Full Features</p>
                  <p className="text-xs text-gray-600">Everything unlocked</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onDecline}
              disabled={isReactivating}
              className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-green-500 hover:bg-green-50 disabled:opacity-50 transition-all duration-300 text-sm font-bold hover:scale-105 disabled:hover:scale-100"
            >
              Not Now
            </button>
            <button
              onClick={handleReactivate}
              disabled={isReactivating}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-300 text-sm font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
            >
              {isReactivating ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Reactivating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Yes, Reactivate
                </span>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
            You can always deactivate your account again in Settings if needed.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};