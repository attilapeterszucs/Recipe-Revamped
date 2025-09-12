export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'update' | 'info' | 'warning' | 'success';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationData {
  title: string;
  message: string;
  type: 'update' | 'info' | 'warning' | 'success';
}

export const DEFAULT_NOTIFICATION: Partial<Notification> = {
  isRead: false,
  type: 'info'
};