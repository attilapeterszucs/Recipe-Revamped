# Payment System Testing Guide

## 🔧 Pre-Testing Setup

### 1. Environment Configuration
Ensure you have the following configured:

**Frontend (.env):**
```env
VITE_STRIPE_WEBHOOK_URL=https://stripe-webhook-428797186446.us-central1.run.app
# ... other env vars
```

**Google Cloud Run Services:**
- `stripe-webhook`: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- `generaterecipev2`: OPENAI_API_KEY, PEXELS_API_KEY
- `searchimagesv2`: PEXELS_API_KEY

### 2. Stripe Configuration
1. Update price IDs in both frontend and webhook service
2. Configure webhook endpoint in Stripe Dashboard
3. Test mode vs live mode consistency

## 🧪 Manual Testing Checklist

### User Flow Testing

#### 1. Sign Up & Authentication ✅
```bash
# Test Steps:
1. Navigate to /signup
2. Create account with email/password
3. Verify email verification prompt appears
4. Check email and click verification link
5. Sign in with verified account
6. Verify user lands on /app with free plan features

# Expected Results:
- ✅ Account created successfully
- ✅ Email verification sent
- ✅ User can sign in after verification
- ✅ Free plan limits applied (5 recipes, 3 daily conversions)
```

#### 2. Pricing Modal & Checkout ✅
```bash
# Test Steps:
1. Click "Upgrade" button anywhere in app
2. Verify pricing modal opens correctly
3. Toggle between Monthly/Yearly billing
4. Select Chef plan
5. Click "Start Chef Plan" button
6. Verify Stripe checkout opens
7. Use test card: 4242424242424242
8. Complete payment
9. Verify redirect back to app with success=true

# Expected Results:
- ✅ Pricing modal displays correct prices
- ✅ Stripe checkout loads with correct plan
- ✅ Payment processes successfully
- ✅ User redirected back with success parameter
```

#### 3. Subscription Activation ✅
```bash
# Test Steps:
1. After payment success, wait 5-10 seconds
2. Check if subscription status updates in UI
3. Verify access to Chef plan features:
   - 100 recipe limit
   - 100 daily conversions
   - All dietary filters
   - Meal planning calendar
   - Custom ingredient preferences
4. Check Firestore database for subscription record

# Expected Results:
- ✅ Subscription status updates automatically
- ✅ Chef plan features become available
- ✅ Firestore has correct subscription data
- ✅ UI shows Chef plan status
```

#### 4. Feature Access Control ✅
```bash
# Test Steps:
1. As free user, try to access meal planning
2. Verify upgrade prompt appears
3. As Chef user, access meal planning successfully
4. Test recipe conversion limits
5. Test recipe saving limits

# Expected Results:
- ✅ Free users see upgrade prompts for premium features
- ✅ Paid users can access their plan's features
- ✅ Limits enforced correctly
- ✅ Usage tracking works
```

#### 5. Subscription Management ✅
```bash
# Test Steps:
1. Navigate to Settings
2. Find subscription management section
3. Click "Manage Subscription" (should open Stripe portal)
4. Test plan changes
5. Test cancellation flow

# Expected Results:
- ✅ Stripe customer portal opens
- ✅ Users can change plans
- ✅ Cancellation preserves access until period end
- ✅ Changes sync back to app
```

### API Testing

#### 1. Webhook Endpoint Testing ✅
```bash
# Test webhook endpoints manually:

# Checkout Session Creation
curl -X POST https://stripe-webhook-428797186446.us-central1.run.app/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "priceId": "price_1S72MwJqTrCMANHgFwwcwtnG",
    "customerEmail": "test@example.com",
    "successUrl": "https://yoursite.com/success",
    "cancelUrl": "https://yoursite.com/cancel",
    "metadata": {"userId": "test-user"}
  }'

# Expected: 200 OK with checkout session URL
```

#### 2. Recipe Generation Testing ✅
```bash
# Test OpenAI integration:

curl -X POST https://generaterecipev2-428797186446.us-central1.run.app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "originalRecipe": "Spaghetti Carbonara",
    "filters": ["Vegan"],
    "userSettings": {
      "defaultServingSize": 4,
      "preferredUnits": "metric"
    }
  }'

# Expected: 200 OK with structured recipe JSON
```

#### 3. Image Search Testing ✅
```bash
# Test Pexels integration:

curl -X POST https://searchimagesv2-428797186446.us-central1.run.app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "keywords": ["pasta", "vegan"],
    "usedImages": []
  }'

# Expected: 200 OK with image URL
```

## 🐛 Common Issues & Solutions

### Issue 1: Checkout Session Creation Fails
**Symptoms:** 500 error when creating checkout session
**Solutions:**
1. Check STRIPE_SECRET_KEY in Cloud Run environment
2. Verify price IDs match your Stripe products
3. Check Cloud Run logs for detailed error

### Issue 2: Subscription Not Activating
**Symptoms:** Payment succeeds but user doesn't get premium features
**Solutions:**
1. Check webhook endpoint is receiving events
2. Verify webhook secret in Cloud Run environment
3. Check Firestore for subscription records
4. Look for webhook processing errors in logs

### Issue 3: CORS Errors
**Symptoms:** Network errors when calling APIs
**Solutions:**
1. Add your domain to allowedOrigins in all services
2. Check that Origin header is being sent
3. Verify HTTPS is being used in production

### Issue 4: Authentication Errors
**Symptoms:** 401 Unauthorized errors
**Solutions:**
1. Check Firebase Authentication is working
2. Verify JWT tokens are being sent in Authorization header
3. Check token expiration and refresh logic

### Issue 5: Feature Access Not Working
**Symptoms:** Users can't access features they paid for
**Solutions:**
1. Check subscription status in Firestore
2. Verify subscription expiry checking logic
3. Check feature access control logic
4. Refresh user session

## 📊 Testing Metrics

Track these metrics during testing:

### Performance Metrics
- [ ] Checkout session creation < 2 seconds
- [ ] Recipe generation < 30 seconds
- [ ] Subscription activation < 10 seconds
- [ ] Page load times < 3 seconds

### Success Rates
- [ ] Payment success rate > 95%
- [ ] Webhook delivery success rate > 99%
- [ ] API success rates > 99%
- [ ] Feature access accuracy > 99%

### User Experience Metrics
- [ ] Time from payment to feature access < 30 seconds
- [ ] Zero failed payment redirects
- [ ] Clear error messages for all failure cases
- [ ] Smooth upgrade/downgrade flows

## 🔒 Security Testing

### 1. API Security ✅
```bash
# Test without authentication
curl -X POST https://generaterecipev2-428797186446.us-central1.run.app
# Expected: 401 Unauthorized

# Test with invalid token
curl -X POST https://generaterecipev2-428797186446.us-central1.run.app \
  -H "Authorization: Bearer invalid-token"
# Expected: 401 Unauthorized
```

### 2. Payment Security ✅
- [ ] Test with invalid price IDs (should fail)
- [ ] Test webhook signature verification
- [ ] Test with tampered webhook payloads
- [ ] Verify SSL/TLS certificates

### 3. Access Control ✅
- [ ] Test accessing premium features without subscription
- [ ] Test expired subscription behavior
- [ ] Test plan downgrade scenarios
- [ ] Verify user data isolation

## 📝 Test Results Documentation

Create a test results document with:

### Test Case Results
```
✅ PASS: User signup and email verification
✅ PASS: Stripe checkout integration
❌ FAIL: Subscription activation (timeout issue)
✅ PASS: Feature access control
...
```

### Performance Results
```
Average checkout session creation: 1.2s
Average recipe generation: 15.3s
Average subscription activation: 8.7s
Average page load time: 2.1s
```

### Issues Found
```
1. Webhook timeout after 30s - need to increase Cloud Run timeout
2. Race condition in subscription status updates - add retry logic
3. Error handling could be more user-friendly
```

## 🚀 Go-Live Checklist

Before launching:

- [ ] All tests pass
- [ ] Performance metrics acceptable
- [ ] Security tests pass
- [ ] Error monitoring configured
- [ ] Customer support process ready
- [ ] Payment failure handling tested
- [ ] Refund process tested
- [ ] Subscription cancellation tested
- [ ] Data backup verified

## 📞 Emergency Contacts

Have these ready for launch:
- Stripe support contact
- Firebase support process
- Google Cloud support
- Your payment processor contact
- Emergency developer contacts

---

**Remember**: Test with both test and live API keys before going live!