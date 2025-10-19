import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Activity, TrendingUp, DollarSign, BookOpen, Zap, RefreshCw, Crown } from 'lucide-react';
import {
  getUserActivityStats,
  getConversionStats,
  getDailyData,
  getSubscriptionStats,
  getSystemStats,
  type UserActivityStats,
  type ConversionStats,
  type DailyDataPoint,
  type SubscriptionStats,
  type SystemStats
} from '../lib/adminAnalytics';

export const AdminDashboard: React.FC = () => {
  const [userStats, setUserStats] = useState<UserActivityStats | null>(null);
  const [conversionStats, setConversionStats] = useState<ConversionStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyDataPoint[]>([]);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    loadAllData();
  }, [timeRange]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [users, conversions, daily, subscriptions, system] = await Promise.all([
        getUserActivityStats(),
        getConversionStats(),
        getDailyData(timeRange),
        getSubscriptionStats(),
        getSystemStats()
      ]);

      setUserStats(users);
      setConversionStats(conversions);
      setDailyData(daily);
      setSubscriptionStats(subscriptions);
      setSystemStats(system);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Prepare subscription chart data
  const subscriptionChartData = subscriptionStats ? [
    { name: 'Free', value: subscriptionStats.free, color: '#9CA3AF' },
    { name: 'Chef', value: subscriptionStats.chef, color: '#10B981' },
    { name: 'Master Chef', value: subscriptionStats.masterChef, color: '#F59E0B' }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Real-time insights and statistics</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="bg-white rounded-lg border border-gray-200 p-1 flex gap-1">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days as 7 | 30 | 90)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  timeRange === days
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all text-sm font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-1">Total Users</p>
              <p className="text-3xl font-black text-blue-900">{userStats?.totalUsers.toLocaleString() || 0}</p>
              <p className="text-xs text-blue-600 mt-2">
                +{userStats?.newUsersThisMonth || 0} this month
              </p>
            </div>
            <div className="bg-blue-500 bg-opacity-20 p-3 rounded-xl">
              <Users className="w-8 h-8 text-blue-700" />
            </div>
          </div>
        </div>

        {/* Online Users */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 mb-1">Online Now</p>
              <p className="text-3xl font-black text-green-900">{userStats?.currentOnlineUsers || 0}</p>
              <p className="text-xs text-green-600 mt-2">
                Active in last 5 min
              </p>
            </div>
            <div className="bg-green-500 bg-opacity-20 p-3 rounded-xl">
              <Activity className="w-8 h-8 text-green-700" />
            </div>
          </div>
        </div>

        {/* Total Conversions */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 mb-1">Total Conversions</p>
              <p className="text-3xl font-black text-purple-900">{conversionStats?.totalConversions.toLocaleString() || 0}</p>
              <p className="text-xs text-purple-600 mt-2">
                {conversionStats?.conversionsToday || 0} today
              </p>
            </div>
            <div className="bg-purple-500 bg-opacity-20 p-3 rounded-xl">
              <Zap className="w-8 h-8 text-purple-700" />
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-700 mb-1">Monthly Revenue</p>
              <p className="text-3xl font-black text-yellow-900">
                ${subscriptionStats?.totalRevenue.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-yellow-600 mt-2">
                MRR estimate
              </p>
            </div>
            <div className="bg-yellow-500 bg-opacity-20 p-3 rounded-xl">
              <DollarSign className="w-8 h-8 text-yellow-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Today */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Daily Active</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-4xl font-black text-gray-900 mb-2">{userStats?.activeToday || 0}</p>
          <div className="space-y-1 text-xs">
            <p className="text-gray-600">Week: <span className="font-bold text-gray-900">{userStats?.activeThisWeek || 0}</span></p>
            <p className="text-gray-600">Month: <span className="font-bold text-gray-900">{userStats?.activeThisMonth || 0}</span></p>
          </div>
        </div>

        {/* Conversions Breakdown */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Conversions</h3>
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-4xl font-black text-gray-900 mb-2">{conversionStats?.conversionsToday || 0}</p>
          <div className="space-y-1 text-xs">
            <p className="text-gray-600">Week: <span className="font-bold text-gray-900">{conversionStats?.conversionsThisWeek || 0}</span></p>
            <p className="text-gray-600">Month: <span className="font-bold text-gray-900">{conversionStats?.conversionsThisMonth || 0}</span></p>
          </div>
        </div>

        {/* Total Recipes */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Saved Recipes</h3>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-4xl font-black text-gray-900 mb-2">{systemStats?.totalRecipes.toLocaleString() || 0}</p>
          <div className="space-y-1 text-xs">
            <p className="text-gray-600">Avg/User: <span className="font-bold text-gray-900">{systemStats?.averageRecipesPerUser.toFixed(1) || 0}</span></p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User & Conversion Trends */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Trends (Last {timeRange} Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFF', border: '2px solid #E5E7EB', borderRadius: '8px' }}
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} name="Active Users" dot={{ fill: '#10B981' }} />
              <Line type="monotone" dataKey="conversions" stroke="#8B5CF6" strokeWidth={2} name="Conversions" dot={{ fill: '#8B5CF6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Subscription Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-700">{subscriptionStats?.free || 0}</p>
              <p className="text-xs text-gray-600 font-semibold">Free</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-700">{subscriptionStats?.chef || 0}</p>
              <p className="text-xs text-green-600 font-semibold">Chef</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-yellow-700">{subscriptionStats?.masterChef || 0}</p>
              <p className="text-xs text-yellow-600 font-semibold">Master Chef</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Dietary Filters */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top Dietary Filters</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={systemStats?.topDietaryFilters || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="filter" tick={{ fontSize: 11 }} stroke="#6B7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
            <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '2px solid #E5E7EB', borderRadius: '8px' }} />
            <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* New Users Trend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border-2 border-emerald-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-500 bg-opacity-20 p-2 rounded-lg">
              <Users className="w-5 h-5 text-emerald-700" />
            </div>
            <h4 className="font-bold text-emerald-900">New Users Today</h4>
          </div>
          <p className="text-3xl font-black text-emerald-900">{userStats?.newUsersToday || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border-2 border-teal-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-teal-500 bg-opacity-20 p-2 rounded-lg">
              <Users className="w-5 h-5 text-teal-700" />
            </div>
            <h4 className="font-bold text-teal-900">New Users This Week</h4>
          </div>
          <p className="text-3xl font-black text-teal-900">{userStats?.newUsersThisWeek || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 border-2 border-cyan-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-cyan-500 bg-opacity-20 p-2 rounded-lg">
              <Users className="w-5 h-5 text-cyan-700" />
            </div>
            <h4 className="font-bold text-cyan-900">New Users This Month</h4>
          </div>
          <p className="text-3xl font-black text-cyan-900">{userStats?.newUsersThisMonth || 0}</p>
        </div>
      </div>
    </div>
  );
};
