import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDestructive = true
}) => {
  // Lock body scroll when delete confirmation modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>

        {/* Header with Gradient */}
        <div className={`${
          isDestructive
            ? 'bg-gradient-to-r from-red-600 to-rose-600'
            : 'bg-gradient-to-r from-yellow-500 to-orange-500'
        } px-6 py-5 relative overflow-hidden`}>
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
                <AlertTriangle className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black text-white">
                {title}
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
        <div className="p-6">
          <div className={`${
            isDestructive
              ? 'bg-gradient-to-br from-red-50 to-rose-50/50 border-2 border-red-200'
              : 'bg-gradient-to-br from-yellow-50 to-orange-50/50 border-2 border-yellow-200'
          } rounded-2xl p-5 shadow-lg`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 ${
                isDestructive
                  ? 'bg-gradient-to-br from-red-100 to-rose-100'
                  : 'bg-gradient-to-br from-yellow-100 to-orange-100'
              } rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                <AlertTriangle className={`w-5 h-5 ${
                  isDestructive ? 'text-red-600' : 'text-yellow-600'
                }`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm leading-relaxed font-medium ${
                  isDestructive ? 'text-red-900' : 'text-yellow-900'
                }`}>
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className={`px-6 py-4 border-t-2 border-gray-100 ${
          isDestructive
            ? 'bg-gradient-to-br from-gray-50 to-red-50/30'
            : 'bg-gradient-to-br from-gray-50 to-yellow-50/30'
        }`}>
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-bold shadow-sm hover:shadow-md hover:scale-105"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`px-6 py-3 ${
                isDestructive
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/30 hover:shadow-red-500/40'
                  : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 shadow-yellow-500/30 hover:shadow-yellow-500/40'
              } text-white rounded-xl transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2`}
              onClick={handleConfirm}
            >
              <AlertTriangle className="w-4 h-4" />
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};