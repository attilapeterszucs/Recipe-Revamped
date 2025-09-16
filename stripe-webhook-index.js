const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const stripe = require('stripe');

// ============================================================================
// CONFIGURATION & INITIALIZATION
// ============================================================================

// Initialize Firebase Admin SDK (no need to specify projectId in Cloud Functions)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Database collections
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const PAYMENT_LOGS_COLLECTION = 'payment_logs';

// Plan configuration with updated Price IDs
const PRICE_TO_PLAN_MAPPING = {
  'price_1S72MwJqTrCMANHgFwwcwtnG': { plan: 'chef', billing_period: 'monthly', amount: 1499 },
  'price_1S72MwJqTrCMANHgYg1hLd5W': { plan: 'chef', billing_period: 'yearly', amount: 14390 },
  'price_1S72MwJqTrCMANHgYsTjUAtS': { plan: 'master-chef', billing_period: 'monthly', amount: 1999 },
  'price_1S72MwJqTrCMANHgmG64NQcW': { plan: 'master-chef', billing_period: 'yearly', amount: 19190 }
};

// ============================================================================
// STRIPE CHECKOUT SESSION CREATION
// ============================================================================

async function createCheckoutSessionHandler(req, res) {
  const startTime = Date.now();

  try {
    console.log('[CHECKOUT] Processing checkout session creation');

    // Validate request method
    if (req.method !== 'POST') {
      console.log('[ERROR] Invalid method:', req.method);
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Parse request body
    const { priceId, customerEmail, successUrl, cancelUrl, metadata } = req.body;

    // Validate required fields
    if (!priceId || !customerEmail || !successUrl || !cancelUrl) {
      res.status(400).json({
        error: 'Missing required fields: priceId, customerEmail, successUrl, cancelUrl'
      });
      return;
    }

    console.log(`[INFO] Creating checkout session - Price: ${priceId}, Customer: ${customerEmail}`);

    try {
      // Create Stripe checkout session
      const session = await stripeClient.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        customer_email: customerEmail,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: metadata || {},
        subscription_data: {
          metadata: metadata || {}
        },
        billing_address_collection: 'auto',
        tax_id_collection: {
          enabled: true
        },
        allow_promotion_codes: true,
        automatic_tax: {
          enabled: true
        }
      });

      console.log(`[SUCCESS] Checkout session created: ${session.id}`);

      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        url: session.url,
        sessionId: session.id,
        processing_time: processingTime
      });

    } catch (stripeError) {
      console.error('[STRIPE ERROR] Checkout session creation failed:', stripeError);

      res.status(500).json({
        success: false,
        error: 'Failed to create checkout session',
        message: stripeError.message
      });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[CRITICAL] Checkout session processing error:', error);

    res.status(500).json({
      success: false,
      error: 'Checkout session processing failed',
      message: error.message,
      processing_time: processingTime
    });
  }
}

// ============================================================================
// STRIPE CUSTOMER PORTAL SESSION CREATION
// ============================================================================

async function createPortalSessionHandler(req, res) {
  const startTime = Date.now();

  try {
    console.log('[PORTAL] Processing portal session creation');

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: Missing or invalid authorization header" });
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Validate request method
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Parse request body
    const { returnUrl } = req.body;

    // Validate required fields
    if (!returnUrl) {
      res.status(400).json({
        error: 'Missing required field: returnUrl'
      });
      return;
    }

    // Get user's subscription to find Stripe customer ID
    const subscriptionRef = admin.firestore().collection('subscriptions').doc(userId);
    const subscriptionDoc = await subscriptionRef.get();

    if (!subscriptionDoc.exists) {
      res.status(404).json({ error: 'No subscription found' });
      return;
    }

    const subscriptionData = subscriptionDoc.data();
    const stripeCustomerId = subscriptionData.stripeCustomerId;

    if (!stripeCustomerId) {
      res.status(400).json({
        error: 'No Stripe customer ID found',
        message: 'Customer portal is only available for active subscriptions'
      });
      return;
    }

    console.log(`[INFO] Creating portal session for customer: ${stripeCustomerId}`);

    try {
      // Create Stripe customer portal session
      const portalSession = await stripeClient.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      });

      console.log(`[SUCCESS] Portal session created: ${portalSession.id}`);

      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        url: portalSession.url,
        processing_time: processingTime
      });

    } catch (stripeError) {
      console.error('[STRIPE ERROR] Portal session creation failed:', stripeError);

      res.status(500).json({
        success: false,
        error: 'Failed to create portal session',
        message: stripeError.message
      });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[CRITICAL] Portal session processing error:', error);

    res.status(500).json({
      success: false,
      error: 'Portal session processing failed',
      message: error.message,
      processing_time: processingTime
    });
  }
}

// ============================================================================
// MAIN WEBHOOK HANDLER WITH ROUTING
// ============================================================================

functions.http('stripeWebhook', async (req, res) => {
  const startTime = Date.now();

  try {
    // Get origin from request for CORS
    const origin = req.get('origin') || req.get('referer');
    const allowedOrigins = [
      'https://reciperevamped.com',
      'https://www.reciperevamped.com',
      'https://reciperevamped.web.app',
      'https://reciperevamped.firebaseapp.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];

    let corsOrigin = 'https://reciperevamped.com'; // default
    if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      corsOrigin = origin;
    }

    // Security headers with dynamic CORS origin
    res.set({
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature, Authorization, Origin',
      'Access-Control-Allow-Credentials': 'true',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    });

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Route to appropriate handler based on path
    if (req.path === '/create-checkout-session' || req.url.includes('/create-checkout-session')) {
      await createCheckoutSessionHandler(req, res);
      return;
    }

    if (req.path === '/create-portal-session' || req.url.includes('/create-portal-session')) {
      await createPortalSessionHandler(req, res);
      return;
    }

    // Check if this is a cancellation request (not a webhook)
    if (req.path === '/cancel-subscription' || req.url.includes('/cancel-subscription')) {
      await handleCancellationRequest(req, res);
      return;
    }

    // Check if this is a plan change request (not a webhook)
    console.log(`[DEBUG] Checking paths - req.path: "${req.path}", req.url: "${req.url}"`);
    if (req.path === '/change-plan' || req.url.includes('/change-plan')) {
      console.log('[DEBUG] Plan change request detected, routing to handler');
      await handlePlanChangeRequest(req, res);
      return;
    }

    // Validate request method for webhooks
    if (req.method !== 'POST') {
      console.error(`❌ Invalid method: ${req.method}`);
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Verify webhook signature
    const event = await verifyWebhookSignature(req);
    if (!event) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    console.log(`🔔 Processing webhook: ${event.type} (ID: ${event.id})`);

    // Log the event
    await logPaymentEvent(event);

    // Process the event
    await processWebhookEvent(event);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Webhook processed successfully in ${processingTime}ms`);

    res.status(200).json({
      received: true,
      event_type: event.type,
      event_id: event.id,
      processing_time: processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('💥 Webhook processing error:', error);

    // Log error details
    await logPaymentEvent({
      type: 'webhook.error',
      id: `error_${Date.now()}`,
      data: {
        error: error.message,
        stack: error.stack,
        processing_time: processingTime
      }
    });

    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message,
      processing_time: processingTime
    });
  }
});

// ============================================================================
// SECURITY & VALIDATION
// ============================================================================

async function verifyWebhookSignature(req) {
  try {
    const signature = req.get('stripe-signature');
    const payload = req.rawBody || req.body;

    if (!WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    const event = stripeClient.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
    console.log(`🔒 Webhook signature verified: ${event.type}`);
    return event;

  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error.message);
    return null;
  }
}

// ============================================================================
// EVENT PROCESSING
// ============================================================================

async function processWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object);
      break;

    default:
      console.log(`⚪ Unhandled event type: ${event.type}`);
  }
}

// ============================================================================
// PAYMENT EVENT HANDLERS
// ============================================================================

async function handleCheckoutCompleted(session) {
  try {
    console.log(`🎉 Checkout completed: ${session.id}`);

    const customerEmail = session.customer_email || session.customer_details?.email;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (!customerEmail) {
      throw new Error('No customer email found in checkout session');
    }

    // Determine plan from session
    const planInfo = await determinePlanFromSession(session);
    if (!planInfo) {
      throw new Error('Could not determine plan from checkout session');
    }

    console.log(`📋 Plan: ${planInfo.plan} (${planInfo.billing_period}) - ${planInfo.amount/100}`);

    // Create subscription object
    const subscription = createSubscriptionObject({
      customerId,
      customerEmail,
      subscriptionId,
      planInfo,
      status: 'active'
    });

    // Create temporary subscription record with the exact format the frontend expects
    const tempDocId = `temp_${customerId}`;
    await db.collection(SUBSCRIPTIONS_COLLECTION).doc(tempDocId).set({
      ...subscription,
      source: 'stripe_checkout',
      tempRecord: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Temporary subscription created: ${tempDocId}`);
    console.log(`📧 Customer email: ${customerEmail}`);
    console.log(`📅 Subscription expires: ${subscription.endDate.toDate().toISOString()}`);

    // Also create/update the permanent subscription record using customer ID
    await db.collection(SUBSCRIPTIONS_COLLECTION).doc(customerId).set({
      ...subscription,
      source: 'stripe_webhook',
      permanentRecord: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`✅ Permanent subscription record created/updated: ${customerId}`);

  } catch (error) {
    console.error('❌ Checkout completion error:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    console.log(`🆕 Subscription created: ${subscription.id}`);

    // Get customer details
    const customer = await stripeClient.customers.retrieve(subscription.customer);
    const planInfo = determinePlanFromSubscription(subscription);

    if (!planInfo) {
      console.warn('⚠️ Could not determine plan from subscription');
      return;
    }

    // Create/update subscription record
    await createOrUpdateSubscription({
      customerId: subscription.customer,
      customerEmail: customer.email,
      subscriptionId: subscription.id,
      planInfo,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });

    console.log(`✅ Subscription record created for: ${customer.email}`);

  } catch (error) {
    console.error('❌ Subscription creation error:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    console.log(`💳 Payment succeeded: ${invoice.id}`);

    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    if (subscriptionId) {
      // Retrieve subscription details
      const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
      const planInfo = determinePlanFromSubscription(subscription);

      if (planInfo) {
        await renewSubscription(customerId, {
          planInfo,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          paymentDate: new Date(invoice.created * 1000)
        });

        console.log(`✅ Subscription renewed for customer: ${customerId}`);
      }
    }

  } catch (error) {
    console.error('❌ Payment success handling error:', error);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    console.log(`❌ Payment failed: ${invoice.id}`);

    const customerId = invoice.customer;

    await updateSubscriptionStatus(customerId, {
      status: 'past_due',
      lastFailedPaymentDate: new Date(invoice.created * 1000),
      failureReason: invoice.last_finalization_error?.message || 'Payment failed'
    });

    console.log(`⚠️ Subscription marked as past_due for: ${customerId}`);

  } catch (error) {
    console.error('❌ Payment failure handling error:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    console.log(`🔄 Subscription updated: ${subscription.id}`);

    const customer = await stripeClient.customers.retrieve(subscription.customer);
    const planInfo = determinePlanFromSubscription(subscription);

    if (planInfo) {
      await createOrUpdateSubscription({
        customerId: subscription.customer,
        customerEmail: customer.email,
        subscriptionId: subscription.id,
        planInfo,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      });

      console.log(`✅ Subscription updated: ${planInfo.plan}`);
    }

  } catch (error) {
    console.error('❌ Subscription update error:', error);
  }
}

async function handleSubscriptionCancelled(subscription) {
  try {
    console.log(`❌ Subscription cancelled: ${subscription.id}`);

    const customerId = subscription.customer;

    await updateSubscriptionStatus(customerId, {
      status: 'cancelled',
      plan: 'free',
      cancelledAt: new Date(),
      endDate: null,
      stripeSubscriptionId: null,
      stripeCustomerId: null
    });

    console.log(`✅ User downgraded to free plan: ${customerId}`);

  } catch (error) {
    console.error('❌ Subscription cancellation error:', error);
  }
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT UTILITIES
// ============================================================================

async function determinePlanFromSession(session) {
  try {
    // Try to get from line items first
    if (session.line_items?.data?.[0]?.price?.id) {
      const priceId = session.line_items.data[0].price.id;
      const planInfo = PRICE_TO_PLAN_MAPPING[priceId];
      if (planInfo) {
        console.log(`🏷️ Plan found via price ID: ${priceId}`);
        return planInfo;
      }
    }

    // Expand line items if not already expanded
    if (session.line_items && !session.line_items.data) {
      const expandedSession = await stripeClient.checkout.sessions.retrieve(session.id, {
        expand: ['line_items']
      });

      if (expandedSession.line_items?.data?.[0]?.price?.id) {
        const priceId = expandedSession.line_items.data[0].price.id;
        const planInfo = PRICE_TO_PLAN_MAPPING[priceId];
        if (planInfo) {
          console.log(`🏷️ Plan found via expanded price ID: ${priceId}`);
          return planInfo;
        }
      }
    }

    // Fallback to amount mapping
    if (session.amount_total) {
      const amount = session.amount_total;
      for (const [priceId, planInfo] of Object.entries(PRICE_TO_PLAN_MAPPING)) {
        if (planInfo.amount === amount) {
          console.log(`💰 Plan found via amount matching: ${amount/100}`);
          return planInfo;
        }
      }
    }

    console.warn('⚠️ Could not determine plan from session');
    return null;

  } catch (error) {
    console.error('❌ Error determining plan from session:', error);
    return null;
  }
}

function determinePlanFromSubscription(subscription) {
  try {
    if (subscription.items?.data?.[0]?.price?.id) {
      const priceId = subscription.items.data[0].price.id;
      const planInfo = PRICE_TO_PLAN_MAPPING[priceId];

      if (planInfo) {
        console.log(`🏷️ Plan found via subscription price ID: ${priceId}`);
        return planInfo;
      }
    }

    console.warn('⚠️ Could not determine plan from subscription');
    return null;

  } catch (error) {
    console.error('❌ Error determining plan from subscription:', error);
    return null;
  }
}

function createSubscriptionObject({ customerId, customerEmail, subscriptionId, planInfo, status }) {
  const startDate = new Date();
  const endDate = calculateEndDate(planInfo.billing_period, startDate);

  return {
    userId: customerId,
    customerEmail: customerEmail,
    plan: planInfo.plan,
    status: status,
    startDate: admin.firestore.Timestamp.fromDate(startDate),
    endDate: admin.firestore.Timestamp.fromDate(endDate),
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    billingPeriod: planInfo.billing_period,
    amount: planInfo.amount,
    currency: 'usd',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

async function createOrUpdateSubscription(data) {
  const subscription = createSubscriptionObject(data);

  // Use customer ID as document ID for easy lookup
  await db.collection(SUBSCRIPTIONS_COLLECTION).doc(data.customerId).set({
    ...subscription,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

async function renewSubscription(customerId, renewalData) {
  await db.collection(SUBSCRIPTIONS_COLLECTION).doc(customerId).update({
    status: 'active',
    endDate: admin.firestore.Timestamp.fromDate(renewalData.currentPeriodEnd),
    lastPaymentDate: admin.firestore.Timestamp.fromDate(renewalData.paymentDate),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function updateSubscriptionStatus(customerId, updateData) {
  const updateObj = {
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Convert Date objects to Timestamps
  Object.keys(updateObj).forEach(key => {
    if (updateObj[key] instanceof Date) {
      updateObj[key] = admin.firestore.Timestamp.fromDate(updateObj[key]);
    }
  });

  await db.collection(SUBSCRIPTIONS_COLLECTION).doc(customerId).update(updateObj);
}

function calculateEndDate(billingPeriod, startDate = new Date()) {
  const endDate = new Date(startDate);

  if (billingPeriod === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  return endDate;
}

// ============================================================================
// PLAN CHANGE HANDLER
// ============================================================================

async function handlePlanChangeRequest(req, res) {
  const startTime = Date.now();

  try {
    console.log('[PLAN-CHANGE] Processing plan change request');

    // Validate request method
    if (req.method !== 'POST') {
      console.log('[ERROR] Invalid method:', req.method);
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Parse request body
    const { userId, newPlan, currentStripeSubscriptionId, currentStripeCustomerId, reason } = req.body;

    // Validate required fields
    if (!userId || !newPlan) {
      res.status(400).json({
        error: 'Missing required fields: userId, newPlan'
      });
      return;
    }

    // Don't allow downgrades to free - use cancellation instead
    if (newPlan === 'free') {
      res.status(400).json({
        error: 'To downgrade to free plan, please cancel your subscription'
      });
      return;
    }

    // Check if this is a test/admin subscription (no Stripe IDs)
    const isTestOrAdminSubscription = !currentStripeSubscriptionId && !currentStripeCustomerId;

    if (isTestOrAdminSubscription) {
      console.log('[WARN] Test/admin subscription detected - handling locally');
      const result = await handleTestPlanChange(userId, newPlan, reason);
      res.status(200).json(result);
      return;
    }

    console.log(`[INFO] Plan change request - User: ${userId}, New Plan: ${newPlan}, Subscription: ${currentStripeSubscriptionId}`);

    // Get current subscription from Firestore
    const subscriptionDoc = await db.collection(SUBSCRIPTIONS_COLLECTION).doc(userId).get();

    if (!subscriptionDoc.exists) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    const subscriptionData = subscriptionDoc.data();
    const currentPlan = subscriptionData.plan;

    // Get the new price ID for the target plan
    const newPriceId = getPriceIdForPlan(newPlan);
    if (!newPriceId) {
      res.status(400).json({ error: `Invalid plan: ${newPlan}` });
      return;
    }

    // Update the subscription in Stripe with idempotency
    console.log(`[PROCESS] Updating Stripe subscription to: ${newPlan} (${newPriceId})`);

    const idempotencyKey = `plan_change_${currentStripeSubscriptionId}_${newPlan}_${Date.now()}`;

    const updatedSubscription = await stripeClient.subscriptions.update(currentStripeSubscriptionId, {
      items: [{
        id: subscriptionData.stripeItemId || (await getSubscriptionItemId(currentStripeSubscriptionId)),
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice', // Always create invoice for plan changes
      billing_cycle_anchor: 'unchanged' // Keep current billing cycle
    }, {
      idempotencyKey // Prevent duplicate plan changes
    });

    console.log(`[SUCCESS] Stripe subscription updated: ${updatedSubscription.id}`);

    // Log plan change event
    await logPaymentEvent({
      type: 'subscription.plan_changed',
      id: `plan_change_${Date.now()}`,
      data: {
        userId,
        oldPlan: currentPlan,
        newPlan,
        stripeSubscriptionId: currentStripeSubscriptionId,
        stripeCustomerId: currentStripeCustomerId,
        reason: reason || 'User requested plan change',
        processingTime: Date.now() - startTime
      }
    });

    const processingTime = Date.now() - startTime;
    console.log(`[SUCCESS] Plan change completed successfully in ${processingTime}ms`);

    res.status(200).json({
      success: true,
      message: `Plan changed from ${currentPlan} to ${newPlan}`,
      userId,
      oldPlan: currentPlan,
      newPlan,
      effectiveDate: new Date().toISOString(),
      nextBillingDate: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      processing_time: processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[CRITICAL] Plan change processing error:', error);

    await logPaymentEvent({
      type: 'plan_change.error',
      id: `plan_change_error_${Date.now()}`,
      data: {
        error: error.message,
        stack: error.stack,
        processing_time: processingTime
      }
    });

    res.status(500).json({
      success: false,
      error: 'Plan change processing failed',
      message: error.message,
      processing_time: processingTime
    });
  }
}

async function handleTestPlanChange(userId, newPlan, reason) {
  try {
    // For test/admin subscriptions, update directly in Firestore
    const updateData = {
      plan: newPlan,
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPlanChange: admin.firestore.FieldValue.serverTimestamp(),
      planChangeReason: reason || `Test plan change to ${newPlan}`
    };

    await db.collection(SUBSCRIPTIONS_COLLECTION).doc(userId).update(updateData);

    return {
      success: true,
      message: `Test subscription plan changed to ${newPlan}`,
      userId,
      newPlan,
      effectiveDate: new Date().toISOString(),
      processing_time: Date.now()
    };

  } catch (error) {
    throw new Error(`Test plan change failed: ${error.message}`);
  }
}

function getPriceIdForPlan(plan, billingPeriod = 'monthly') {
  // Find price ID for the given plan and billing period
  for (const [priceId, planInfo] of Object.entries(PRICE_TO_PLAN_MAPPING)) {
    if (planInfo.plan === plan && planInfo.billing_period === billingPeriod) {
      return priceId;
    }
  }
  return null;
}

async function getSubscriptionItemId(subscriptionId) {
  try {
    const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
    return subscription.items.data[0]?.id;
  } catch (error) {
    console.error('[ERROR] Failed to get subscription item ID:', error);
    throw error;
  }
}

// ============================================================================
// SUBSCRIPTION CANCELLATION HANDLER
// ============================================================================

async function handleCancellationRequest(req, res) {
  const startTime = Date.now();
  const operationId = `cancel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[CANCEL] Processing cancellation request: ${operationId}`);

    // Validate request method
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Parse request body
    const { userId, stripeSubscriptionId, stripeCustomerId, reason, idempotencyKey } = req.body;

    // Validate required fields
    if (!userId) {
      res.status(400).json({
        error: 'Missing required field: userId'
      });
      return;
    }

    // Check for existing cancellation operation using idempotency key
    if (idempotencyKey) {
      const existingOperation = await checkExistingOperation(idempotencyKey, 'cancellation');
      if (existingOperation) {
        console.log(`[CANCEL] Returning cached result for idempotency key: ${idempotencyKey}`);
        res.status(200).json(existingOperation);
        return;
      }
    }

    console.log(`[INFO] Cancellation request - User: ${userId}, Subscription: ${stripeSubscriptionId}, Customer: ${stripeCustomerId}`);

    // Atomic check and lock to prevent race conditions
    const lockKey = `cancel_lock_${userId}`;
    const lockAcquired = await acquireLock(lockKey, operationId, 30000); // 30 second lock

    if (!lockAcquired) {
      res.status(429).json({
        error: 'Another cancellation operation is in progress. Please wait and try again.',
        retryAfter: 30
      });
      return;
    }

    try {
      // Get current subscription from Firestore
      const subscriptionDoc = await db.collection(SUBSCRIPTIONS_COLLECTION).doc(userId).get();

      if (!subscriptionDoc.exists) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      const subscriptionData = subscriptionDoc.data();
      const actualStripeSubId = stripeSubscriptionId || subscriptionData.stripeSubscriptionId;
      const actualStripeCustomerId = stripeCustomerId || subscriptionData.stripeCustomerId;

      // Check if this is a test/admin subscription (no Stripe IDs)
      const isTestOrAdminSubscription = !actualStripeSubId && !actualStripeCustomerId;

      if (isTestOrAdminSubscription) {
        console.log('[WARN] Test/admin subscription detected - handling locally');
        const result = await handleTestSubscriptionCancellation(userId, subscriptionData, reason);
        await releaseLock(lockKey, operationId);
        res.status(200).json(result);
        return;
      }

      if (!actualStripeSubId) {
        await releaseLock(lockKey, operationId);
        res.status(400).json({ error: 'No Stripe subscription ID found' });
        return;
      }

      // Cancel subscription in Stripe with idempotency
      console.log(`[PROCESS] Cancelling Stripe subscription: ${actualStripeSubId}`);

      let stripeSubscription;
      try {
        const cancelIdempotencyKey = `cancel_stripe_${actualStripeSubId}_${Date.now()}`;
        stripeSubscription = await stripeClient.subscriptions.cancel(actualStripeSubId, {
          prorate: true, // Prorate the cancellation
        }, {
          idempotencyKey: cancelIdempotencyKey
        });
        console.log(`[SUCCESS] Stripe subscription cancelled: ${actualStripeSubId}`);
      } catch (stripeError) {
        console.error(`[ERROR] Stripe cancellation failed:`, stripeError);

        // If subscription already cancelled in Stripe, continue with Firestore update
        if (stripeError.code !== 'resource_missing') {
          await releaseLock(lockKey, operationId);
          throw stripeError;
        }
        console.log('[WARN] Subscription already cancelled in Stripe, proceeding with Firestore update');
      }

      // Get current subscription end date to preserve access until expiry
      const currentEndDate = subscriptionData.endDate;
      const now = new Date();

      // Update subscription in Firestore - keep current plan active until expiry
      const updateData = {
        status: 'cancelled', // Mark as cancelled but keep plan active
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancellationReason: reason || 'User requested',
        willDowngradeAt: currentEndDate || admin.firestore.Timestamp.fromDate(now),
        downgradeToPlan: 'free',
        autoRenewal: false, // Prevent automatic renewal
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        operationId // Track operation for debugging
      };

      // Keep Stripe IDs for potential reactivation or billing history
      if (stripeSubscription) {
        updateData.stripeSubscriptionStatus = stripeSubscription.status;
        updateData.stripeCancelledAt = admin.firestore.Timestamp.fromDate(new Date(stripeSubscription.canceled_at * 1000));
      }

      await db.collection(SUBSCRIPTIONS_COLLECTION).doc(userId).update(updateData);

      // Log cancellation event
      await logPaymentEvent({
        type: 'subscription.cancelled_by_user',
        id: `cancel_${Date.now()}`,
        data: {
          userId,
          stripeSubscriptionId: actualStripeSubId,
          stripeCustomerId: actualStripeCustomerId,
          reason: reason || 'User requested',
          operationId,
          processingTime: Date.now() - startTime
        }
      });

      const processingTime = Date.now() - startTime;
      console.log(`[SUCCESS] Subscription cancelled successfully in ${processingTime}ms`);

      const willDowngradeAt = currentEndDate ? currentEndDate.toDate() : now;

      const result = {
        success: true,
        message: 'Subscription cancelled successfully',
        userId,
        currentPlan: subscriptionData.plan, // Keep current plan until expiry
        willDowngradeTo: 'free',
        willDowngradeAt: willDowngradeAt.toISOString(),
        cancelledAt: new Date().toISOString(),
        processing_time: processingTime,
        operationId
      };

      // Cache result for idempotency
      if (idempotencyKey) {
        await cacheOperationResult(idempotencyKey, 'cancellation', result);
      }

      await releaseLock(lockKey, operationId);
      res.status(200).json(result);

    } finally {
      // Ensure lock is always released
      await releaseLock(lockKey, operationId);
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[CRITICAL] Cancellation processing error:', error);

    await logPaymentEvent({
      type: 'cancellation.error',
      id: `cancel_error_${Date.now()}`,
      data: {
        error: error.message,
        stack: error.stack,
        operationId,
        processing_time: processingTime
      }
    });

    res.status(500).json({
      success: false,
      error: 'Cancellation processing failed',
      message: error.message,
      operationId,
      processing_time: processingTime
    });
  }
}

async function handleTestSubscriptionCancellation(userId, subscriptionData, reason) {
  try {
    // For test/admin subscriptions, delete completely
    const updateData = {
      plan: 'free',
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancellationReason: reason || 'Test/admin subscription cancelled',
      willDowngradeAt: admin.firestore.FieldValue.serverTimestamp(),
      downgradeToPlan: 'free',
      endDate: null,
      autoRenewal: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection(SUBSCRIPTIONS_COLLECTION).doc(userId).update(updateData);

    return {
      success: true,
      message: 'Test subscription cancelled successfully',
      userId,
      currentPlan: 'free',
      willDowngradeTo: 'free',
      cancelledAt: new Date().toISOString(),
      note: 'Test/admin subscription cancelled - immediately reverted to free plan'
    };

  } catch (error) {
    throw new Error(`Test subscription cancellation failed: ${error.message}`);
  }
}

// Lock management to prevent race conditions
async function acquireLock(lockKey, operationId, ttlMs) {
  try {
    const lockRef = db.collection('operation_locks').doc(lockKey);
    const lockDoc = await lockRef.get();

    if (lockDoc.exists) {
      const lockData = lockDoc.data();
      const lockAge = Date.now() - lockData.acquiredAt.toMillis();

      // Check if lock is expired
      if (lockAge > ttlMs) {
        console.log(`[LOCK] Expired lock found, releasing: ${lockKey}`);
        await lockRef.delete();
      } else {
        console.log(`[LOCK] Lock already held by operation: ${lockData.operationId}`);
        return false;
      }
    }

    // Acquire lock
    await lockRef.set({
      operationId,
      acquiredAt: admin.firestore.FieldValue.serverTimestamp(),
      ttl: ttlMs
    });

    console.log(`[LOCK] Lock acquired: ${lockKey} by ${operationId}`);
    return true;

  } catch (error) {
    console.error('[LOCK] Failed to acquire lock:', error);
    return false;
  }
}

async function releaseLock(lockKey, operationId) {
  try {
    const lockRef = db.collection('operation_locks').doc(lockKey);
    const lockDoc = await lockRef.get();

    if (lockDoc.exists) {
      const lockData = lockDoc.data();
      if (lockData.operationId === operationId) {
        await lockRef.delete();
        console.log(`[LOCK] Lock released: ${lockKey} by ${operationId}`);
      } else {
        console.warn(`[LOCK] Cannot release lock ${lockKey}: owned by ${lockData.operationId}, not ${operationId}`);
      }
    }
  } catch (error) {
    console.error('[LOCK] Failed to release lock:', error);
  }
}

// Idempotency management
async function checkExistingOperation(idempotencyKey, operationType) {
  try {
    const operationRef = db.collection('operation_cache').doc(`${operationType}_${idempotencyKey}`);
    const operationDoc = await operationRef.get();

    if (operationDoc.exists) {
      const operationData = operationDoc.data();
      const age = Date.now() - operationData.createdAt.toMillis();

      // Cache for 1 hour
      if (age < 3600000) {
        return operationData.result;
      } else {
        await operationRef.delete();
      }
    }

    return null;
  } catch (error) {
    console.error('[IDEMPOTENCY] Failed to check existing operation:', error);
    return null;
  }
}

async function cacheOperationResult(idempotencyKey, operationType, result) {
  try {
    const operationRef = db.collection('operation_cache').doc(`${operationType}_${idempotencyKey}`);
    await operationRef.set({
      result,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      operationType
    });
  } catch (error) {
    console.error('[IDEMPOTENCY] Failed to cache operation result:', error);
  }
}

// ============================================================================
// LOGGING & MONITORING
// ============================================================================

async function logPaymentEvent(event) {
  try {
    await db.collection(PAYMENT_LOGS_COLLECTION).add({
      eventType: event.type,
      eventId: event.id,
      data: event.data,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      processed: true
    });
  } catch (error) {
    console.error('❌ Error logging payment event:', error);
  }
}

// Export for Google Cloud Functions
exports.stripeWebhook = functions.http;