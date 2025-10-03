import React from 'react';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import type { Notification } from '../types/notifications';

interface NotificationPopupProps {
  notification: Notification;
  onClose: () => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ notification, onClose }) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />;
      case 'update':
        return <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 sm:w-8 sm:h-8" />;
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50/50',
          border: 'border-green-200',
          header: 'bg-gradient-to-r from-green-600 to-emerald-600',
          iconBg: 'bg-green-500/20',
          text: 'text-gray-800',
          titleText: 'text-green-700'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-yellow-50 to-orange-50/50',
          border: 'border-yellow-200',
          header: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          iconBg: 'bg-yellow-500/20',
          text: 'text-gray-800',
          titleText: 'text-yellow-700'
        };
      case 'update':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-cyan-50/50',
          border: 'border-blue-200',
          header: 'bg-gradient-to-r from-blue-600 to-cyan-600',
          iconBg: 'bg-blue-500/20',
          text: 'text-gray-800',
          titleText: 'text-blue-700'
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50/50',
          border: 'border-green-200',
          header: 'bg-gradient-to-r from-green-600 to-emerald-600',
          iconBg: 'bg-green-500/20',
          text: 'text-gray-800',
          titleText: 'text-green-700'
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
    <div
      className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${colors.header} px-6 py-5 flex items-center justify-between relative overflow-hidden`}>
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>

          <div className="flex items-center space-x-3 relative z-10">
            <div className="text-white bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              {getNotificationIcon(notification.type)}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Notification</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/90 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/20 backdrop-blur-sm relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-5 sm:p-6 mb-4 shadow-lg`}>
            <div className="flex items-start space-x-4">
              <div className={`flex-shrink-0 ${colors.iconBg} p-3 rounded-xl`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg sm:text-xl font-black ${colors.titleText} mb-3 leading-tight`}>
                  {notification.title}
                </h3>
                <div className={`text-sm sm:text-base ${colors.text} space-y-2 leading-relaxed`}>
                  {notification.message.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t-2 border-gray-100 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{formatDate(notification.createdAt)}</span>
              </div>
              {!notification.isRead && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30">
                  <Sparkles className="w-3 h-3" />
                  New
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-gray-100 bg-gradient-to-br from-gray-50 to-green-50/30">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};