const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);
const cors = require('cors')({
  origin: true,
  credentials: true
});

admin.initializeApp();
const db = admin.firestore();

// Collections
const USERS_COLLECTION = 'users';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

// Helper function to verify Firebase ID token
async function verifyIdToken(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw new functions.https.HttpsError('unauthenticated', 'Invalid authentication token');
  }
}

// Helper function to get or create Stripe customer
async function getOrCreateStripeCustomer(user) {
  try {
    // Check if user already has a Stripe customer ID
    const userDoc = await db.collection(USERS_COLLECTION).doc(user.uid).get();

    if (userDoc.exists && userDoc.data().stripeCustomerId) {
      return userDoc.data().stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.displayName || user.email,
      metadata: {
        firebaseUid: user.uid
      }
    });

    // Save customer ID to user document
    await db.collection(USERS_COLLECTION).doc(user.uid).set({
      stripeCustomerId: customer.id,
      email: user.email,
      displayName: user.displayName || user.email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create customer');
  }
}

// Helper function to create or update subscription in Firestore
async function createOrUpdateSubscription(subscription, customer, source = null) {
  try {
    const plan = subscription.items.data[0]?.price?.nickname || 'Unknown';
    const priceId = subscription.items.data[0]?.price?.id;

    const subscriptionData = {
      subscriptionId: subscription.id,
      customerId: customer.id,
      customerEmail: customer.email,
      plan: plan.toLowerCase(),
      status: subscription.status,
      priceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(source && { source }) // Add source field when provided
    };

    // Update subscription in Firestore
    await db.collection(SUBSCRIPTIONS_COLLECTION).doc(subscription.id).set(subscriptionData, { merge: true });

    // Update user document with subscription info
    const userQuery = await db.collection(USERS_COLLECTION).where('email', '==', customer.email).limit(1).get();
    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      await userDoc.ref.set({
        subscriptionId: subscription.id,
        plan: plan.toLowerCase(),
        subscriptionStatus: subscription.status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    console.log('✅ Subscription saved to Firestore:', subscription.id);
  } catch (error) {
    console.error('❌ Error saving subscription to Firestore:', error);
    throw error;
  }
}

// Create checkout session
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { priceId, successUrl, cancelUrl } = data;

    if (!priceId) {
      throw new functions.https.HttpsError('invalid-argument', 'Price ID is required');
    }

    // Get user info
    const user = await admin.auth().getUser(context.auth.uid);

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || 'https://reciperevamped.com/app?success=true&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl || 'https://reciperevamped.com/pricing',
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        firebaseUid: user.uid
      }
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Create customer portal session
exports.createPortalSession = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { returnUrl } = data;

    // Get user info
    const user = await admin.auth().getUser(context.auth.uid);

    // Get Stripe customer ID
    const customerId = await getOrCreateStripeCustomer(user);

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || 'https://reciperevamped.com/app',
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Webhook handler for Stripe events
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe.webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Webhook event handlers
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('🎉 Checkout session completed:', session.id);

    if (session.mode === 'subscription') {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const customer = await stripe.customers.retrieve(session.customer);

      await createOrUpdateSubscription(subscription, customer);
    }
  } catch (error) {
    console.error('❌ Error handling checkout session completed:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    console.log('🆕 Subscription created:', subscription.id);

    const customer = await stripe.customers.retrieve(subscription.customer);
    await createOrUpdateSubscription(subscription, customer);
  } catch (error) {
    console.error('❌ Error handling subscription created:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('🔄 Processing subscription update:', subscription.id);

    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer);

    // Create or update subscription with source flag for real-time sync
    await createOrUpdateSubscription(subscription, customer, 'subscription_updated');

    console.log('✅ Subscription updated successfully');
  } catch (error) {
    console.error('❌ Error handling subscription update:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('🗑️ Subscription deleted:', subscription.id);

    // Update subscription status in Firestore
    await db.collection(SUBSCRIPTIONS_COLLECTION).doc(subscription.id).set({
      status: 'canceled',
      canceledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Update user document
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userQuery = await db.collection(USERS_COLLECTION).where('email', '==', customer.email).limit(1).get();
    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      await userDoc.ref.set({
        plan: 'free',
        subscriptionStatus: 'canceled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    console.log('✅ Subscription cancellation processed');
  } catch (error) {
    console.error('❌ Error handling subscription deleted:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    console.log('💰 Invoice payment succeeded:', invoice.id);

    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const customer = await stripe.customers.retrieve(invoice.customer);

      await createOrUpdateSubscription(subscription, customer);
    }
  } catch (error) {
    console.error('❌ Error handling invoice payment succeeded:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    console.log('❌ Invoice payment failed:', invoice.id);

    if (invoice.subscription) {
      // Update subscription status to indicate payment failure
      await db.collection(SUBSCRIPTIONS_COLLECTION).doc(invoice.subscription).set({
        lastPaymentFailed: true,
        lastPaymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    console.error('❌ Error handling invoice payment failed:', error);
    throw error;
  }
}

// Manual plan change function (for admin use)
exports.changePlan = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { newPriceId } = data;

    if (!newPriceId) {
      throw new functions.https.HttpsError('invalid-argument', 'New price ID is required');
    }

    // Get user info
    const user = await admin.auth().getUser(context.auth.uid);

    // Get user's current subscription
    const userDoc = await db.collection(USERS_COLLECTION).doc(user.uid).get();
    if (!userDoc.exists || !userDoc.data().subscriptionId) {
      throw new functions.https.HttpsError('not-found', 'No active subscription found');
    }

    const subscriptionId = userDoc.data().subscriptionId;

    // Get current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    });

    // Update Firestore
    const customer = await stripe.customers.retrieve(subscription.customer);
    await createOrUpdateSubscription(updatedSubscription, customer);

    return { success: true, subscriptionId: updatedSubscription.id };
  } catch (error) {
    console.error('Error changing plan:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cancel subscription function
exports.cancelSubscription = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { cancelImmediately = false } = data;

    // Get user info
    const user = await admin.auth().getUser(context.auth.uid);

    // Get user's current subscription
    const userDoc = await db.collection(USERS_COLLECTION).doc(user.uid).get();
    if (!userDoc.exists || !userDoc.data().subscriptionId) {
      throw new functions.https.HttpsError('not-found', 'No active subscription found');
    }

    const subscriptionId = userDoc.data().subscriptionId;

    let updatedSubscription;
    if (cancelImmediately) {
      // Cancel immediately
      updatedSubscription = await stripe.subscriptions.del(subscriptionId);
    } else {
      // Cancel at period end
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    }

    // Update Firestore
    const customer = await stripe.customers.retrieve(updatedSubscription.customer);
    await createOrUpdateSubscription(updatedSubscription, customer);

    return { success: true, canceledAt: updatedSubscription.canceled_at };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Get subscription status function
exports.getSubscriptionStatus = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Get user info
    const user = await admin.auth().getUser(context.auth.uid);

    // Get subscription from Firestore
    const subscriptionsQuery = await db.collection(SUBSCRIPTIONS_COLLECTION)
      .where('customerEmail', '==', user.email)
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();

    if (subscriptionsQuery.empty) {
      return { plan: 'free', status: 'inactive' };
    }

    const subscriptionDoc = subscriptionsQuery.docs[0];
    const subscriptionData = subscriptionDoc.data();

    return {
      plan: subscriptionData.plan || 'free',
      status: subscriptionData.status || 'inactive',
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});