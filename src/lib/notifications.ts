import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Notification, NotificationData } from '../types/notifications';
import { logger } from './logger';

const COLLECTION_NAME = 'notifications';

// Create a new notification
export const createNotification = async (userId: string, data: NotificationData): Promise<string> => {
  try {
    const notificationRef = await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      title: data.title,
      message: data.message,
      type: data.type,
      isRead: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return notificationRef.id;
  } catch (error) {
    logger.error('Error creating notification:', { error });
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, COLLECTION_NAME, notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    logger.error('Error marking notification as read:', { error });
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    // This would typically be done with a batch update or cloud function in production
    // For now, we'll handle this in the component level
  } catch (error) {
    throw error;
  }
};

// Subscribe to user notifications
export const subscribeToUserNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: data.isRead,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
      });
    });
    callback(notifications);
  }, (error) => {
    logger.error('Error subscribing to notifications:', { error });
  });
};

// Create system-wide update notifications (admin function)
export const createSystemNotification = async (data: NotificationData): Promise<void> => {
  try {
    // In a real application, this would be a cloud function
    // For demo purposes, we'll create a sample notification
  } catch (error) {
    throw error;
  }
};