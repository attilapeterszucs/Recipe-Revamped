import { db } from './firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, getCountFromServer } from 'firebase/firestore';

export interface UserActivityStats {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  currentOnlineUsers: number;
}

export interface ConversionStats {
  totalConversions: number;
  conversionsToday: number;
  conversionsThisWeek: number;
  conversionsThisMonth: number;
}

export interface DailyDataPoint {
  date: string;
  users: number;
  conversions: number;
}

export interface SubscriptionStats {
  free: number;
  chef: number;
  masterChef: number;
  totalRevenue: number;
}

export interface SystemStats {
  totalRecipes: number;
  averageRecipesPerUser: number;
  topDietaryFilters: Array<{ filter: string; count: number }>;
  peakUsageHours: Array<{ hour: number; count: number }>;
}

/**
 * Get user activity statistics
 */
export async function getUserActivityStats(): Promise<UserActivityStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const usersRef = collection(db, 'users');

  try {
    // Total users
    const totalUsersSnapshot = await getCountFromServer(usersRef);
    const totalUsers = totalUsersSnapshot.data().count;

    // Active today (users who logged in today)
    const activeTodayQuery = query(
      usersRef,
      where('lastLoginAt', '>=', Timestamp.fromDate(todayStart))
    );
    const activeTodaySnapshot = await getCountFromServer(activeTodayQuery);
    const activeToday = activeTodaySnapshot.data().count;

    // Active this week
    const activeWeekQuery = query(
      usersRef,
      where('lastLoginAt', '>=', Timestamp.fromDate(weekStart))
    );
    const activeWeekSnapshot = await getCountFromServer(activeWeekQuery);
    const activeThisWeek = activeWeekSnapshot.data().count;

    // Active this month
    const activeMonthQuery = query(
      usersRef,
      where('lastLoginAt', '>=', Timestamp.fromDate(monthStart))
    );
    const activeMonthSnapshot = await getCountFromServer(activeMonthQuery);
    const activeThisMonth = activeMonthSnapshot.data().count;

    // Currently online (users active in last 5 minutes)
    const onlineQuery = query(
      usersRef,
      where('lastActiveAt', '>=', Timestamp.fromDate(fiveMinutesAgo))
    );
    const onlineSnapshot = await getCountFromServer(onlineQuery);
    const currentOnlineUsers = onlineSnapshot.data().count;

    // New users today
    const newTodayQuery = query(
      usersRef,
      where('createdAt', '>=', Timestamp.fromDate(todayStart))
    );
    const newTodaySnapshot = await getCountFromServer(newTodayQuery);
    const newUsersToday = newTodaySnapshot.data().count;

    // New users this week
    const newWeekQuery = query(
      usersRef,
      where('createdAt', '>=', Timestamp.fromDate(weekStart))
    );
    const newWeekSnapshot = await getCountFromServer(newWeekQuery);
    const newUsersThisWeek = newWeekSnapshot.data().count;

    // New users this month
    const newMonthQuery = query(
      usersRef,
      where('createdAt', '>=', Timestamp.fromDate(monthStart))
    );
    const newMonthSnapshot = await getCountFromServer(newMonthQuery);
    const newUsersThisMonth = newMonthSnapshot.data().count;

    return {
      totalUsers,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      currentOnlineUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth
    };
  } catch (error) {
    console.error('Error fetching user activity stats:', error);
    throw error;
  }
}

/**
 * Get conversion statistics
 */
export async function getConversionStats(): Promise<ConversionStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const conversionsRef = collection(db, 'conversions');

  try {
    // Total conversions
    const totalSnapshot = await getCountFromServer(conversionsRef);
    const totalConversions = totalSnapshot.data().count;

    // Conversions today
    const todayQuery = query(
      conversionsRef,
      where('timestamp', '>=', Timestamp.fromDate(todayStart))
    );
    const todaySnapshot = await getCountFromServer(todayQuery);
    const conversionsToday = todaySnapshot.data().count;

    // Conversions this week
    const weekQuery = query(
      conversionsRef,
      where('timestamp', '>=', Timestamp.fromDate(weekStart))
    );
    const weekSnapshot = await getCountFromServer(weekQuery);
    const conversionsThisWeek = weekSnapshot.data().count;

    // Conversions this month
    const monthQuery = query(
      conversionsRef,
      where('timestamp', '>=', Timestamp.fromDate(monthStart))
    );
    const monthSnapshot = await getCountFromServer(monthQuery);
    const conversionsThisMonth = monthSnapshot.data().count;

    return {
      totalConversions,
      conversionsToday,
      conversionsThisWeek,
      conversionsThisMonth
    };
  } catch (error) {
    console.error('Error fetching conversion stats:', error);
    throw error;
  }
}

/**
 * Get daily data for the last 30 days
 */
export async function getDailyData(days: number = 30): Promise<DailyDataPoint[]> {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const usersRef = collection(db, 'users');
  const conversionsRef = collection(db, 'conversions');

  try {
    // Get user logins for the period
    const userLoginsQuery = query(
      usersRef,
      where('lastLoginAt', '>=', Timestamp.fromDate(startDate))
    );
    const userLoginsSnapshot = await getDocs(userLoginsQuery);

    // Get conversions for the period
    const conversionsQuery = query(
      conversionsRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    );
    const conversionsSnapshot = await getDocs(conversionsQuery);

    // Group by date
    const dataByDate = new Map<string, { users: Set<string>; conversions: number }>();

    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dataByDate.set(dateKey, { users: new Set(), conversions: 0 });
    }

    // Process user logins
    userLoginsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.lastLoginAt) {
        const date = data.lastLoginAt.toDate();
        const dateKey = date.toISOString().split('T')[0];
        const dayData = dataByDate.get(dateKey);
        if (dayData) {
          dayData.users.add(doc.id);
        }
      }
    });

    // Process conversions
    conversionsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.timestamp) {
        const date = data.timestamp.toDate();
        const dateKey = date.toISOString().split('T')[0];
        const dayData = dataByDate.get(dateKey);
        if (dayData) {
          dayData.conversions++;
        }
      }
    });

    // Convert to array and sort by date
    const result: DailyDataPoint[] = Array.from(dataByDate.entries())
      .map(([date, data]) => ({
        date,
        users: data.users.size,
        conversions: data.conversions
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  } catch (error) {
    console.error('Error fetching daily data:', error);
    throw error;
  }
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const usersRef = collection(db, 'users');

  try {
    // Get all users with subscription info
    const snapshot = await getDocs(usersRef);

    let free = 0;
    let chef = 0;
    let masterChef = 0;
    let totalRevenue = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const plan = data.subscription?.plan || 'free';

      switch (plan) {
        case 'free':
          free++;
          break;
        case 'chef':
          chef++;
          // Calculate revenue based on billing cycle
          const chefPrice = data.subscription?.billingCycle === 'yearly' ? 47.88 : 4.99;
          totalRevenue += chefPrice;
          break;
        case 'master-chef':
          masterChef++;
          // Calculate revenue based on billing cycle
          const masterChefPrice = data.subscription?.billingCycle === 'yearly' ? 95.88 : 9.99;
          totalRevenue += masterChefPrice;
          break;
      }
    });

    return {
      free,
      chef,
      masterChef,
      totalRevenue
    };
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    throw error;
  }
}

/**
 * Get system statistics
 */
export async function getSystemStats(): Promise<SystemStats> {
  const recipesRef = collection(db, 'recipes');

  try {
    // Total recipes
    const totalRecipesSnapshot = await getCountFromServer(recipesRef);
    const totalRecipes = totalRecipesSnapshot.data().count;

    // Get all recipes for detailed analysis
    const recipesSnapshot = await getDocs(recipesRef);

    // Count recipes per user
    const recipesPerUser = new Map<string, number>();
    const dietaryFiltersCount = new Map<string, number>();

    recipesSnapshot.forEach(doc => {
      const data = doc.data();

      // Count per user
      const userId = data.userId;
      recipesPerUser.set(userId, (recipesPerUser.get(userId) || 0) + 1);

      // Count dietary filters
      if (data.filters && Array.isArray(data.filters)) {
        data.filters.forEach((filter: string) => {
          dietaryFiltersCount.set(filter, (dietaryFiltersCount.get(filter) || 0) + 1);
        });
      }
    });

    // Calculate average recipes per user
    const averageRecipesPerUser = recipesPerUser.size > 0
      ? totalRecipes / recipesPerUser.size
      : 0;

    // Get top dietary filters
    const topDietaryFilters = Array.from(dietaryFiltersCount.entries())
      .map(([filter, count]) => ({ filter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Peak usage hours (placeholder - would need timestamp data)
    const peakUsageHours: Array<{ hour: number; count: number }> = [];

    return {
      totalRecipes,
      averageRecipesPerUser,
      topDietaryFilters,
      peakUsageHours
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw error;
  }
}

/**
 * Track user activity (call this on user actions)
 */
export async function trackUserActivity(userId: string): Promise<void> {
  try {
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastActiveAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error tracking user activity:', error);
  }
}
