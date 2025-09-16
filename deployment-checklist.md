# Production Deployment Checklist

## ✅ Environment Setup

### Google Cloud Environment Variables
Ensure these are set in your Google Cloud Run services:

**stripe-webhook service:**
```bash
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**generaterecipev2 service:**
```bash
OPENAI_API_KEY=sk-proj-...
PEXELS_API_KEY=...
```

**searchimagesv2 service:**
```bash
PEXELS_API_KEY=...
```

### Frontend Environment (.env)
```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_STRIPE_WEBHOOK_URL=https://stripe-webhook-428797186446.us-central1.run.app
VITE_ALLOWED_FILTERS=Vegan,Gluten-Free,Low-Carb,Keto,Paleo,Dairy-Free,Nut-Free,Sugar-Free,Vegetarian,Whole30,High-Protein,Low-Sodium,Diabetic-Friendly,Heart-Healthy,Mediterranean,Raw-Food
```

## ✅ Stripe Configuration

### 1. Update Price IDs
In `stripe-webhook-index.js`, update the `PRICE_TO_PLAN_MAPPING` with your actual Stripe price IDs:

```javascript
const PRICE_TO_PLAN_MAPPING = {
  'price_YOUR_CHEF_MONTHLY': { plan: 'chef', billing_period: 'monthly', amount: 1499 },
  'price_YOUR_CHEF_YEARLY': { plan: 'chef', billing_period: 'yearly', amount: 14390 },
  'price_YOUR_MASTER_CHEF_MONTHLY': { plan: 'master-chef', billing_period: 'monthly', amount: 1999 },
  'price_YOUR_MASTER_CHEF_YEARLY': { plan: 'master-chef', billing_period: 'yearly', amount: 19190 }
};
```

### 2. Update Price IDs in Frontend
In `src/components/PricingModal.tsx`, update the `STRIPE_PRICE_IDS`:

```javascript
const STRIPE_PRICE_IDS = {
  chef: {
    monthly: 'price_YOUR_CHEF_MONTHLY',
    yearly: 'price_YOUR_CHEF_YEARLY'
  },
  'master-chef': {
    monthly: 'price_YOUR_MASTER_CHEF_MONTHLY',
    yearly: 'price_YOUR_MASTER_CHEF_YEARLY'
  }
};
```

### 3. Configure Stripe Webhooks
In Stripe Dashboard:
1. Go to Developers > Webhooks
2. Add endpoint: `https://stripe-webhook-428797186446.us-central1.run.app`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## ✅ Deployment Steps

### 1. Deploy Firebase Functions
```bash
cd functions
npm run build
firebase deploy --only functions
```

### 2. Deploy Firestore Rules and Indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 3. Update Stripe Webhook Service
Upload the updated `stripe-webhook-index.js` to your Google Cloud Run service:
```bash
# Replace the index.js in your stripe-webhook Cloud Run service
# with the contents of stripe-webhook-index.js
```

### 4. Deploy Frontend
```bash
npm run build
# Deploy to your hosting platform (Netlify, Vercel, etc.)
```

### 5. Update Domain CORS
Ensure your production domains are included in CORS origins in:
- `functions/src/index.ts` (all allowedOrigins arrays)
- `stripe-webhook-index.js` (allowedOrigins array)

## ✅ Testing Checklist

### Payment Flow Testing
1. **Sign Up Flow**
   - [ ] User can create account
   - [ ] Email verification works
   - [ ] User can sign in after verification

2. **Subscription Purchase**
   - [ ] Pricing modal opens correctly
   - [ ] Stripe checkout loads
   - [ ] Payment processing works
   - [ ] User redirected back successfully
   - [ ] Subscription activated in database
   - [ ] User gains access to premium features

3. **Subscription Management**
   - [ ] Plan changes work
   - [ ] Subscription cancellation works
   - [ ] Customer portal access works
   - [ ] Webhook events process correctly

4. **Feature Access**
   - [ ] Free users see correct limits
   - [ ] Paid users access premium features
   - [ ] Usage tracking works
   - [ ] Daily limits enforced

### API Testing
1. **Recipe Generation**
   - [ ] OpenAI API calls work
   - [ ] Recipe conversion functions
   - [ ] Image search works
   - [ ] Error handling works

2. **Authentication**
   - [ ] Firebase Auth works
   - [ ] JWT tokens validated
   - [ ] Session management works

## ✅ Post-Launch Monitoring

### 1. Error Monitoring
- Monitor Cloud Run logs for errors
- Check Firebase Function logs
- Monitor Stripe webhook logs

### 2. Performance Monitoring
- Monitor API response times
- Check database query performance
- Monitor usage limits and costs

### 3. Security Monitoring
- Review authentication logs
- Monitor for unusual usage patterns
- Check for API abuse

## 🚨 Critical Security Notes

1. **Never expose API keys** in frontend code or version control
2. **Use HTTPS only** for all endpoints
3. **Validate all inputs** on both client and server
4. **Monitor for abuse** and implement rate limiting
5. **Regular security audits** of API keys and access

## 📞 Support Setup

1. **Error Alerting**: Set up alerts for critical errors
2. **User Support**: Prepare support documentation
3. **Billing Support**: Handle subscription billing issues
4. **Technical Support**: Monitor and resolve technical issues

---

## Quick Launch Commands

```bash
# 1. Deploy Firebase
firebase deploy

# 2. Build and deploy frontend
npm run build
# Deploy to your hosting platform

# 3. Update Cloud Run services with environment variables
# (Done via Google Cloud Console)

# 4. Test payment flow end-to-end
# 5. Monitor logs and metrics
```

## Environment Validation

Run these commands to validate your setup:

```bash
# Check Firebase connection
firebase projects:list

# Test Firebase Functions locally
cd functions && npm run serve

# Test frontend locally
npm run dev

# Verify environment variables are set
# Check Google Cloud Run service configurations
```