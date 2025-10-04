import React from 'react';
import { Download, X, Clock, ChefHat, Calendar } from 'lucide-react';
import type { BackupData } from '../types/backup';

interface RestoreConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  backup: BackupData | null;
}

export const RestoreConfirmationModal: React.FC<RestoreConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  backup
}) => {
  if (!isOpen || !backup) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Background overlay */}
      <div
        className="fixed inset-0"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95">

        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 relative overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Download className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black text-white">
                Restore Recovery Point
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/20 backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <p className="text-gray-700 leading-relaxed font-medium mb-6">
            This will restore recipes from your backup to your current collection.
          </p>

          {/* Backup Details */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-5 mb-6 shadow-lg">
            <h4 className="text-lg font-black text-gray-900 mb-4">Backup Details</h4>
            <div className="space-y-4">
              {/* Date and Time */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-900">
                    {backup.createdAt ? formatDate(backup.createdAt) : 'Unknown date'}
                  </p>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    Created at {backup.createdAt ? formatTime(backup.createdAt) : 'unknown time'}
                  </p>
                </div>
              </div>

              {/* Recipe Count */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <ChefHat className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-900">
                    {backup.recipes?.length || 0} recipes
                  </p>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    Will be added to your current collection
                  </p>
                </div>
              </div>

              {/* Expiration */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-900">
                    Expires on {backup.expiresAt?.toLocaleDateString() || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    Recovery point will be automatically deleted after expiration
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-black text-blue-900 mb-3">
                  What happens when you restore?
                </h4>
                <ul className="space-y-2 text-sm text-blue-800 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Recipes will be added to your current collection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Existing recipes won't be affected or duplicated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Recipe titles will have "(Restored)" added to them</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Your current settings won't be changed</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="px-6 py-4 border-t-2 border-gray-100 bg-gradient-to-br from-gray-50 to-green-50/30">
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-bold shadow-sm hover:shadow-md hover:scale-105"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105 flex items-center justify-center gap-2"
              onClick={handleConfirm}
            >
              <Download className="w-4 h-4" />
              Restore Recipes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};