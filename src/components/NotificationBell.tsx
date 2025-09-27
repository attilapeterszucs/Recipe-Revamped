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
          className="relative p-2 text-gray-600 hover:text-green-600 transition-colors rounded-full hover:bg-gray-100"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute -right-32 sm:right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 sm:max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-60 sm:max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500">
                  <Bell className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm sm:text-base">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-2 sm:p-3 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100 ${getNotificationBgColor(
                      notification.type,
                      notification.isRead
                    )}`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs sm:text-sm font-medium truncate ${
                            notification.isRead ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 ml-1 sm:ml-2 flex-shrink-0">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 line-clamp-2 ${
                          notification.isRead ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>
                        {!notification.isRead && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 border-t border-gray-200 text-center">
                <span className="text-xs text-gray-500">
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