# Admin Dashboard Setup Guide

## Overview

The admin dashboard provides comprehensive analytics and insights for Recipe Revamped, including:

- **User Activity**: Real-time online users, daily/weekly/monthly active users, new user signups
- **Conversions**: Recipe conversion statistics with time-based breakdowns
- **Revenue**: Monthly recurring revenue estimates and subscription distribution
- **System Stats**: Total recipes, average recipes per user, top dietary filters
- **Interactive Charts**: Line charts for trends, pie charts for distribution, bar charts for filters

## Firestore Indexes Required

The dashboard requires Firestore indexes for optimal performance. Follow these steps to deploy them:

### Option 1: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Deploy Firestore Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. **Wait for Indexes to Build**:
   - This may take a few minutes depending on your data size
   - You can monitor progress in the Firebase Console under Firestore → Indexes

### Option 2: Manual Setup via Firebase Console

If you prefer to create indexes manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes**
4. Create the following composite indexes:

#### Users Collection
- Index 1: `lastLoginAt` (Descending)
- Index 2: `lastActiveAt` (Descending)
- Index 3: `createdAt` (Descending)

#### Conversions Collection
- Index 1: `timestamp` (Descending)
- Index 2: `userId` (Ascending), `timestamp` (Descending)

#### Recipes Collection
- Index 1: `userId` (Ascending), `createdAt` (Descending)

## Data Requirements

For the dashboard to work properly, ensure:

1. **Users Collection** has these fields:
   - `lastLoginAt` (Timestamp) - Updated when user logs in
   - `lastActiveAt` (Timestamp) - Updated on user activity
   - `createdAt` (Timestamp) - User registration date
   - `subscription.plan` (String) - User's subscription plan
   - `subscription.billingCycle` (String) - 'monthly' or 'yearly'

2. **Conversions Collection** has these fields:
   - `timestamp` (Timestamp) - When conversion occurred
   - `userId` (String) - User who made the conversion

3. **Recipes Collection** has these fields:
   - `userId` (String) - Recipe owner
   - `filters` (Array) - Dietary filters applied
   - `createdAt` (Timestamp) - Recipe creation date

## Accessing the Dashboard

1. Log in as an admin user
2. Navigate to **Settings** → **Admin Panel**
3. The **Dashboard** tab will be the default view
4. Use the time range selector (7D/30D/90D) to adjust the view period
5. Click **Refresh** to update statistics

## Features

### Key Metrics Cards
- **Total Users**: All registered users with monthly growth
- **Online Now**: Users active in the last 5 minutes
- **Total Conversions**: All recipe conversions with today's count
- **Monthly Revenue**: Estimated MRR based on active subscriptions

### Activity Trends Chart
- Line chart showing daily active users and conversions
- Adjustable time range (7, 30, or 90 days)
- Hover for detailed daily statistics

### Subscription Distribution
- Pie chart showing Free/Chef/Master Chef distribution
- Percentage breakdown
- Individual plan counts below the chart

### Top Dietary Filters
- Bar chart showing most popular dietary filters
- Helps understand user preferences
- Can inform content and feature decisions

### New User Growth
- Daily, weekly, and monthly new user counts
- Track user acquisition trends
- Monitor growth patterns

## Performance Considerations

- The dashboard uses `getCountFromServer()` for efficient counting
- Indexes ensure fast queries even with large datasets
- Results are cached for 5 minutes to reduce load
- Use the Refresh button sparingly to avoid hitting quota limits

## Troubleshooting

### "Index Required" Errors
- Deploy Firestore indexes using the Firebase CLI
- Wait for indexes to build completely
- Check Firebase Console → Firestore → Indexes for status

### Missing Data
- Ensure user activity tracking is enabled
- Verify conversion tracking is logging correctly
- Check that timestamps are being set on all documents

### Slow Performance
- Verify all required indexes are built and enabled
- Check if you're querying very large date ranges
- Consider implementing data aggregation for better performance

## Future Enhancements

Potential additions to the dashboard:
- User retention cohort analysis
- Revenue forecasting
- Geographic distribution maps
- Peak usage hours analysis
- A/B test results tracking
- Email campaign performance
- Conversion funnel analysis

## Security

- Dashboard is only accessible to admin users
- Admin access is verified via `checkAdminAccess()` utility
- Only designated admin emails can view analytics
- No sensitive user data (passwords, payment details) is displayed

## Support

For issues or questions:
1. Check Firebase Console for index build status
2. Review browser console for error messages
3. Verify admin permissions are correctly set
4. Contact development team if issues persist
