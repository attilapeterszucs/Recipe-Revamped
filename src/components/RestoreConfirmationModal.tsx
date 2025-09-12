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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          
          {/* Header */}
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <Download className="h-6 w-6 text-blue-600" />
            </div>

            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Restore Recovery Point
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  This will restore recipes from your backup to your current collection.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Backup Details */}
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              {/* Date and Time */}
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {backup.createdAt ? formatDate(backup.createdAt) : 'Unknown date'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created at {backup.createdAt ? formatTime(backup.createdAt) : 'unknown time'}
                  </p>
                </div>
              </div>

              {/* Recipe Count */}
              <div className="flex items-center space-x-3">
                <ChefHat className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {backup.recipes?.length || 0} recipes
                  </p>
                  <p className="text-xs text-gray-500">
                    Will be added to your current collection
                  </p>
                </div>
              </div>

              {/* Expiration */}
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Expires on {backup.expiresAt?.toLocaleDateString() || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Recovery point will be automatically deleted after expiration
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <Download className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  What happens when you restore?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Recipes will be added to your current collection</li>
                    <li>Existing recipes won't be affected or duplicated</li>
                    <li>Recipe titles will have "(Restored)" added to them</li>
                    <li>Your current settings won't be changed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleConfirm}
            >
              Restore Recipes
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};