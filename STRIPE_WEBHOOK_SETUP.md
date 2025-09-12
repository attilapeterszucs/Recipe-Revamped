# Stripe Webhook Setup Guide

This guide explains how to set up secure Stripe webhooks for automatic subscription management.

## Overview

The system automatically handles:
- ✅ **New Subscriptions**: Grants chosen plan when payment completes
- ✅ **Recurring Renewals**: Extends expiry date on successful recurring payments  
- ✅ **Failed Payments**: Marks subscriptions as past_due for grace period
- ✅ **Cancellations**: Downgrades users to free plan
- ✅ **Plan Changes**: Updates user subscription when plan is modified
- 🔒 **Security**: Verifies webhook signatures to prevent tampering

## Setup Steps

### 1. Configure Environment Variables

In your Firebase Functions environment, set these variables:

```bash
# Production deployment
firebase functions:config:set stripe.secret_key="sk_live_your_actual_stripe_secret_key"
firebase functions:config:set stripe.webhook_secret="whsec_your_webhook_endpoint_secret"

# For testing (already configured for test mode)
# Set STRIPE_SECRET_KEY=sk_test_... in functions/.env
# Set STRIPE_WEBHOOK_SECRET=whsec_... in functions/.env
```

### 2. Deploy Cloud Function

```bash
cd functions
npm run build
firebase deploy --only functions:stripeWebhook
```

### 3. Configure Stripe Webhook

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL to: `https://your-region-your-project.cloudfunctions.net/stripeWebhook`
4. Select these events to send:
   - `checkout.session.completed` - New subscription payments
   - `invoice.payment_succeeded` - Recurring payment success
   - `invoice.payment_failed` - Payment failures
   - `customer.subscription.deleted` - Subscription cancellations  
   - `customer.subscription.updated` - Plan changes
5. Copy the webhook signing secret (starts with `whsec_`) to your environment config

### 4. Update Price Mapping

In `functions/src/index.ts`, update the `determinePlanFromSession` function with your actual Stripe Price IDs:

```typescript
const priceMapping: { [key: string]: {plan: string, billing_period: string} } = {
  // Replace with your actual Stripe Price IDs
  'price_1234567890abcdef': { plan: 'chef', billing_period: 'monthly' },
  'price_abcdef1234567890': { plan: 'chef', billing_period: 'yearly' },
  'price_9876543210fedcba': { plan: 'master-chef', billing_period: 'monthly' },
  'price_fedcba0987654321': { plan: 'master-chef', billing_period: 'yearly' },
};
```

## Security Features

### Webhook Verification
- ✅ Verifies Stripe signature on every webhook request
- ✅ Rejects requests with invalid or missing signatures
- ✅ Prevents replay attacks and tampering

### User Identification
- ✅ Links Stripe customers to Firebase users via email
- ✅ Validates user exists before granting subscription
- ✅ Prevents unauthorized subscription grants

### Error Handling
- ✅ Comprehensive logging for debugging
- ✅ Graceful error handling with proper HTTP status codes
- ✅ Automatic retry logic for transient failures

## Subscription Flow

### New Subscription (checkout.session.completed)
1. User completes payment on Stripe Checkout
2. Webhook receives checkout completion event
3. System looks up Firebase user by email
4. Determines plan from payment amount/price ID
5. Creates subscription record with expiry date:
   - **Monthly**: Expires same day next month
   - **Yearly**: Expires same day next year
6. User immediately gets access to chosen plan features

### Recurring Renewal (invoice.payment_succeeded)
1. Stripe automatically charges for subscription renewal
2. Webhook receives payment success event
3. System finds user by Stripe customer ID  
4. Extends subscription expiry date by billing period
5. User maintains uninterrupted access

### Payment Failure (invoice.payment_failed)
1. Stripe fails to charge for renewal
2. Webhook receives payment failure event
3. System marks subscription as `past_due`
4. User gets grace period before features are restricted
5. Access restored when payment succeeds

### Cancellation (customer.subscription.deleted)
1. User cancels subscription in Stripe
2. Webhook receives cancellation event
3. System immediately downgrades user to free plan
4. Paid features become unavailable

## Testing

### Test with Stripe CLI
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local function emulator
stripe listen --forward-to http://localhost:5001/your-project/us-central1/stripeWebhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

### Monitor Logs
```bash
# Firebase function logs
firebase functions:log --only stripeWebhook

# Real-time logs
firebase functions:log --follow
```

## Troubleshooting

### Common Issues

1. **"Webhook signature verification failed"**
   - Check webhook secret is correctly configured
   - Ensure raw request body is being passed to webhook verification

2. **"User not found in Firebase Auth"**
   - Ensure user email in Stripe matches Firebase Auth email
   - Check user is properly signed up before making payment

3. **"Could not determine plan from session"**
   - Update price mapping with your actual Stripe Price IDs
   - Check payment amount matches expected plan prices

4. **Function timeout**
   - Increase timeout in function configuration
   - Check for long-running operations in webhook handlers

### Debug Mode

Add this to functions/.env for detailed logging:
```
DEBUG_MODE=true
```

## Production Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Update webhook endpoint URL to production function
- [ ] Configure proper price mappings for live Price IDs
- [ ] Test all subscription flows end-to-end
- [ ] Set up monitoring and alerting for webhook failures
- [ ] Configure backup webhook endpoint for redundancy

## Support

- 📖 [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- 🔥 [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- 🛡️ [Security Best Practices](https://stripe.com/docs/webhooks/best-practices)