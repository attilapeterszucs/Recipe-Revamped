import React from 'react';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle, Calendar } from 'lucide-react';
import type { Notification } from '../types/notifications';

interface NotificationPopupProps {
  notification: Notification;
  onClose: () => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ notification, onClose }) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
      case 'update':
        return <AlertCircle className="w-8 h-8 text-blue-600" />;
      case 'info':
      default:
        return <Info className="w-8 h-8 text-blue-600" />;
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          header: 'bg-green-600',
          text: 'text-green-800'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          header: 'bg-yellow-600',
          text: 'text-yellow-800'
        };
      case 'update':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          header: 'bg-blue-600',
          text: 'text-blue-800'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          header: 'bg-blue-600',
          text: 'text-blue-800'
        };
    }
  };

  const colors = getNotificationColors(notification.type);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in">
        {/* Header */}
        <div className={`${colors.header} px-6 py-5 flex items-center justify-between bg-gradient-to-r`}>
          <div className="flex items-center space-x-3">
            <div className="text-white bg-white bg-opacity-20 p-2 rounded-full">
              {getNotificationIcon(notification.type)}
            </div>
            <h2 className="text-xl font-bold text-blue-600">Notification</h2>
          </div>
          <button
            onClick={onClose}
            className="text-red-600 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`${colors.bg} ${colors.border} border rounded-xl p-5 mb-4 shadow-sm`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold ${colors.text} mb-3 leading-tight`}>
                  {notification.title}
                </h3>
                <div className={`text-base ${colors.text} space-y-2 leading-relaxed`}>
                  {notification.message.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(notification.createdAt)}</span>
              </div>
              {!notification.isRead && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm">
                  ✨ New
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};