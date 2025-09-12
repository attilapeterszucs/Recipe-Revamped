import { createNotification } from '../lib/notifications';
import type { NotificationData } from '../types/notifications';

// Sample notifications for demo purposes
export const sampleNotifications: NotificationData[] = [
  {
    title: '🎉 Welcome to Recipe Revamped!',
    message: 'Thank you for joining Recipe Revamped! Start by uploading your first recipe and let our AI help you convert it to match your dietary needs and health conditions.',
    type: 'success'
  },
  {
    title: '🚀 New Feature: Health Conditions',
    message: 'We\'ve added a new Health Conditions section in Settings! You can now specify medical dietary requirements like diabetes, high blood pressure, and more for personalized recipe suggestions.',
    type: 'update'
  },
  {
    title: '⚡ System Update v2.1.0',
    message: 'New improvements:\n• Enhanced AI recipe conversion\n• Better health condition support\n• Improved notification system\n• Bug fixes and performance improvements',
    type: 'info'
  },
  {
    title: '📊 Recipe Limit Reminder',
    message: 'You\'ve used 8 out of 10 free recipe conversions this month. Upgrade to Chef plan for unlimited conversions and advanced features!',
    type: 'warning'
  }
];

// Function to create sample notifications for a user
export const createSampleNotifications = async (userId: string) => {
  try {
    for (const notification of sampleNotifications) {
      await createNotification(userId, notification);
    }
  } catch (error) {
    console.error('Error creating sample notifications:', error);
  }
};

// Function to create a welcome notification for new users
export const createWelcomeNotification = async (userId: string) => {
  try {
    await createNotification(userId, sampleNotifications[0]);
  } catch (error) {
    console.error('Error creating welcome notification:', error);
  }
};