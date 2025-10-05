import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { subscribeToUserNotifications, markNotificationAsRead } from '../lib/notifications';
import type { Notification } from '../types/notifications';
import { NotificationPopup } from './NotificationPopup';

interface NotificationBellProps {
  userId: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const unsubscribe = subscribeToUserNotifications(userId, setNotifications);
    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    setSelectedNotification(notification);
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(notification => markNotificationAsRead(notification.id))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'update':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    const baseColor = isRead ? 'bg-gray-50' : 'bg-white';
    const borderColor = isRead ? 'border-gray-200' : 'border-l-4 border-l-blue-400';
    return `${baseColor} ${borderColor}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <>
      <div className="relative">
        <button
          ref={bellRef}
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-700 hover:text-green-600 transition-all duration-200 rounded-full hover:bg-green-50 group"
        >
          <Bell className={`w-6 h-6 transition-transform duration-200 ${unreadCount > 0 ? 'animate-pulse' : 'group-hover:scale-110'}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg shadow-red-500/50 animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute -right-32 sm:right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border-2 border-green-100 z-[9999] max-h-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-2 rounded-xl">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-gray-600 font-medium">{unreadCount} unread</p>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-green-600 hover:text-green-700 font-semibold transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-green-100"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">We'll notify you when something new arrives</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-0 ${
                      notification.isRead
                        ? 'hover:bg-gray-50'
                        : 'bg-gradient-to-r from-green-50/30 to-emerald-50/30 hover:from-green-50 hover:to-emerald-50 border-l-4 border-l-green-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`p-2 rounded-lg ${
                          notification.type === 'success' ? 'bg-green-100' :
                          notification.type === 'warning' ? 'bg-yellow-100' :
                          notification.type === 'update' ? 'bg-blue-100' :
                          'bg-blue-100'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-bold ${
                            notification.isRead ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 font-medium flex-shrink-0">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className={`text-sm mt-1.5 leading-relaxed ${
                          notification.isRead ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>
                        {!notification.isRead && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-semibold text-green-600">New</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-green-50/30 border-t-2 border-gray-100 text-center">
                <span className="text-xs font-semibold text-gray-600">
                  {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification Popup */}
      {selectedNotification && (
        <NotificationPopup
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
    </>
  );
};