import { UsageTracker } from './usageTracking';
import { SubscriptionService } from './subscriptionService';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import { logger } from './logger';

export interface DailyConversionData {
  conversionsUsed: number;
  conversionLimit: number;
  canConvert: boolean;
  planName: string;
}

export class DailyConversionService {
  /**
   * Get daily conversion data for a user
   */
  static async getDailyConversionData(userId: string): Promise<DailyConversionData> {
    try {
      // Get user's subscription plan
      const subscription = await SubscriptionService.getUserSubscription(userId);
      const planDetails = SUBSCRIPTION_PLANS[subscription?.plan || 'free'];
      
      // Get today's conversion count
      const conversionsUsed = await UsageTracker.getTodaysConversions(userId);
      
      return {
        conversionsUsed,
        conversionLimit: planDetails.conversionLimit,
        canConvert: conversionsUsed < planDetails.conversionLimit,
        planName: planDetails.name
      };
    } catch (error) {
      logger.error('Error getting daily conversion data:', { error });
      // Return safe defaults on error
      return {
        conversionsUsed: 0,
        conversionLimit: 3, // Free plan default
        canConvert: true,
        planName: 'Free'
      };
    }
  }

  /**
   * Check if user can perform a conversion (pre-conversion check)
   */
  static async canUserConvert(userId: string): Promise<{
    canConvert: boolean;
    reason?: string;
    conversionsUsed: number;
    conversionLimit: number;
  }> {
    try {
      const data = await this.getDailyConversionData(userId);
      
      if (!data.canConvert) {
        return {
          canConvert: false,
          reason: `Daily conversion limit reached. Your ${data.planName} plan allows ${data.conversionLimit} conversions per day. Upgrade your plan for more conversions.`,
          conversionsUsed: data.conversionsUsed,
          conversionLimit: data.conversionLimit
        };
      }
      
      return {
        canConvert: true,
        conversionsUsed: data.conversionsUsed,
        conversionLimit: data.conversionLimit
      };
    } catch (error) {
      logger.error('Error checking conversion permission:', { error });
      // Allow conversion on error to avoid blocking users
      return {
        canConvert: true,
        conversionsUsed: 0,
        conversionLimit: 3
      };
    }
  }

  /**
   * Record a conversion and return updated data
   */
  static async recordConversionAndGetUpdatedData(userId: string): Promise<DailyConversionData> {
    try {
      // Record the conversion
      await UsageTracker.recordConversion(userId);
      
      // Return updated data
      return await this.getDailyConversionData(userId);
    } catch (error) {
      logger.error('Error recording conversion:', { error });
      // Return current data even if recording failed
      return await this.getDailyConversionData(userId);
    }
  }

  /**
   * Get time until daily reset (in hours and minutes)
   */
  static getTimeUntilReset(): { hours: number; minutes: number } {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Start of next day
    
    const msUntilReset = tomorrow.getTime() - now.getTime();
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      hours: hoursUntilReset,
      minutes: minutesUntilReset
    };
  }
}