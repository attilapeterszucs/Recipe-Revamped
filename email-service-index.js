const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp();
}

// ============================================================================
// SMTP CONFIGURATION
// ============================================================================

// SMTP Configuration for Gmail
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER || 'noreply@reciperevamped.com',
    pass: process.env.SMTP_PASS || 'pass'
  },
  tls: {
    rejectUnauthorized: false
  }
};

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport(SMTP_CONFIG);

// ============================================================================
// ADMIN VERIFICATION FUNCTION
// ============================================================================

// Admin verification function - matches frontend logic exactly
async function verifyAdminUser(adminEmail, adminUid) {
  try {
    console.log(`[ADMIN_CHECK] Starting verification for: ${adminEmail} (${adminUid})`);

    if (!adminEmail || !adminUid) {
      console.log(`[ADMIN_CHECK] Missing email or UID - email: ${adminEmail}, uid: ${adminUid}`);
      return false;
    }

    // Check the admins collection - exactly like frontend
    const adminsRef = admin.firestore().collection('admins');
    console.log(`[ADMIN_CHECK] Querying admins collection with:`);
    console.log(`[ADMIN_CHECK] - email: ${adminEmail.toLowerCase()}`);
    console.log(`[ADMIN_CHECK] - uid: ${adminUid}`);
    console.log(`[ADMIN_CHECK] - isActive: true`);

    const query = adminsRef
      .where('email', '==', adminEmail.toLowerCase())
      .where('uid', '==', adminUid)
      .where('isActive', '==', true);

    const snapshot = await query.get();
    console.log(`[ADMIN_CHECK] Query returned ${snapshot.size} documents`);

    if (!snapshot.empty) {
      console.log(`[ADMIN_CHECK] ✅ Admin verified successfully: ${adminEmail}`);
      const doc = snapshot.docs[0];
      console.log(`[ADMIN_CHECK] Admin doc data:`, doc.data());
      return true;
    }

    // Let's also check what exists in the admins collection for debugging
    console.log(`[ADMIN_CHECK] ❌ No matching admin found. Checking all admins for debugging...`);
    const allAdminsSnapshot = await adminsRef.get();
    console.log(`[ADMIN_CHECK] Total admins in collection: ${allAdminsSnapshot.size}`);

    allAdminsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`[ADMIN_CHECK] Admin ${index + 1}:`, {
        id: doc.id,
        email: data.email,
        uid: data.uid,
        isActive: data.isActive,
        role: data.role
      });
    });

    console.log(`[ADMIN_CHECK] ❌ Admin verification failed for: ${adminEmail}`);
    return false;

  } catch (error) {
    console.error(`[ADMIN_CHECK] Error verifying admin ${adminEmail}:`, error);
    console.error(`[ADMIN_CHECK] Error stack:`, error.stack);
    return false;
  }
}

// Verify SMTP connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Configuration Error:', error);
  } else {
    console.log('SMTP Server ready for messages');
  }
});

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

function generateContactEmailHTML(formData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Form Submission - Recipe Revamped</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316, #eab308); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #374151; }
        .value { background: white; padding: 10px; border-radius: 4px; border: 1px solid #d1d5db; margin-top: 5px; }
        .priority { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🍳 New Contact Form Submission</h2>
          <p>Recipe Revamped - Contact Form</p>
        </div>

        <div class="content">
          <div class="field">
            <div class="label">Name:</div>
            <div class="value">${formData.name}</div>
          </div>

          <div class="field">
            <div class="label">Email:</div>
            <div class="value">${formData.email}</div>
          </div>

          <div class="field">
            <div class="label">Category:</div>
            <div class="value" style="background: #fef3c7; border-color: #f59e0b; color: #92400e; font-weight: bold; text-transform: uppercase;">${formData.category || 'General'}</div>
          </div>

          <div class="field">
            <div class="label">Subject:</div>
            <div class="value">${formData.subject}</div>
          </div>

          <div class="field">
            <div class="label">Message:</div>
            <div class="value" style="white-space: pre-wrap;">${formData.message}</div>
          </div>

          <div class="field">
            <div class="label">Submission Time:</div>
            <div class="value">${new Date().toLocaleString()}</div>
          </div>

          <div class="field">
            <div class="label">IP Address:</div>
            <div class="value">${formData.ipAddress || 'Not available'}</div>
          </div>
        </div>

        <div class="footer">
          <p>This message was sent through the Recipe Revamped contact form</p>
          <p><a href="https://reciperevamped.com" style="color: #fbbf24;">reciperevamped.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateMarketingEmailHTML(recipeName, recipeContent, userName) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${recipeName} - Recipe Revamped</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #10b981, #16a34a);
          color: white;
          padding: 30px 25px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
          font-weight: 300;
        }
        .logo {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .content {
          padding: 30px 25px;
          background-color: #ffffff;
        }
        .greeting {
          font-size: 18px;
          color: #374151;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .intro {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 25px;
          line-height: 1.7;
        }
        .recipe-card {
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border: 1px solid #d1fae5;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
        }
        .recipe-title {
          color: #065f46;
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 15px 0;
          line-height: 1.3;
        }
        .recipe-content {
          color: #047857;
          font-size: 15px;
          line-height: 1.7;
          white-space: pre-wrap;
          background: rgba(255, 255, 255, 0.8);
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #10b981;
        }
        .cta-section {
          text-align: center;
          margin: 30px 0;
        }
        .cta {
          background: linear-gradient(135deg, #10b981, #16a34a);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          display: inline-block;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }
        .features {
          background: #f8fafc;
          border-radius: 10px;
          padding: 20px;
          margin: 25px 0;
          border-left: 4px solid #10b981;
        }
        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .feature-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          font-size: 15px;
          color: #374151;
        }
        .feature-icon {
          color: #10b981;
          margin-right: 10px;
          font-weight: bold;
        }
        .footer {
          background: #1f2937;
          color: #d1d5db;
          padding: 25px;
          text-align: center;
        }
        .footer-brand {
          color: #ffffff;
          font-weight: 600;
          font-size: 18px;
          margin-bottom: 10px;
        }
        .footer-tagline {
          color: #9ca3af;
          font-size: 14px;
          margin-bottom: 15px;
        }
        .footer-links {
          margin: 15px 0;
        }
        .footer-links a {
          color: #10b981;
          text-decoration: none;
          margin: 0 8px;
          font-size: 14px;
        }
        .footer-links a:hover {
          color: #34d399;
        }
        .unsubscribe {
          font-size: 12px;
          color: #6b7280;
          margin-top: 15px;
          line-height: 1.5;
        }
        .unsubscribe a {
          color: #10b981;
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #d1d5db, transparent);
          margin: 20px 0;
        }

        /* Responsive design */
        @media only screen and (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .header, .content, .footer {
            padding: 20px;
          }
          .header h1 {
            font-size: 24px;
          }
          .recipe-card {
            padding: 20px;
          }
          .cta {
            padding: 12px 24px;
            font-size: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🍳</div>
          <h1>Recipe Revamped</h1>
          <p>Transform Your Cooking Experience</p>
        </div>

        <div class="content">
          <div class="greeting">Hi ${userName || 'Food Lover'}! 👋</div>

          <div class="intro">
            ${getEmailIntroText(recipeName, recipeContent)}
          </div>

          ${getRecipeCard(recipeName, recipeContent)}

          ${getEmailFeatures(recipeName, recipeContent)}

          <div class="cta-section">
            <a href="https://reciperevamped.com/app" class="cta">
              ${getCtaText(recipeName, recipeContent)} →
            </a>
          </div>

          <div class="divider"></div>

          <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0;">
            ✨ Join thousands of home cooks discovering amazing recipes every day!
          </p>
        </div>

        <div class="footer">
          <div class="footer-brand">Recipe Revamped</div>
          <div class="footer-tagline">AI-Powered Culinary Innovation</div>

          <div class="footer-links">
            <a href="https://reciperevamped.com">Website</a> |
            <a href="https://reciperevamped.com/app">Recipe App</a> |
            <a href="https://reciperevamped.com/contact">Contact</a>
          </div>

          <div class="unsubscribe">
            <p>You're receiving this because you opted in to marketing emails.</p>
            <p>
              <a href="https://reciperevamped.com/app">Manage preferences</a> |
              <a href="https://reciperevamped.com/unsubscribe">Unsubscribe</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper functions for dynamic content based on email type
function getRecipeCard(recipeName, recipeContent) {
  // Don't show recipe card for any emails - content is now handled in intro section
  return '';
}

function getEmailIntroText(recipeName, recipeContent) {
  if (recipeName.toLowerCase().includes('welcome')) {
    return `Welcome to Recipe Revamped! 🎉 We're thrilled to have you join our community of passionate home cooks. Get ready to transform your kitchen experience with AI-powered recipe discovery and personalized meal planning.`;
  } else if (recipeName.toLowerCase().includes('weekly') || recipeName.toLowerCase().includes('feature')) {
    return `This week's featured recipe is here! We've handpicked something special that we think you'll absolutely love. Time to add some excitement to your meal rotation! 🌟`;
  } else if (recipeName.toLowerCase().includes('comeback') || recipeName.toLowerCase().includes('miss')) {
    return `We miss you in the kitchen! 👨‍🍳 Come back and discover what's new at Recipe Revamped. We've added amazing new features and recipes just waiting for you to explore.`;
  } else {
    // For custom emails, use the recipeContent as the main intro text
    return recipeContent;
  }
}

function getEmailFeatures(recipeName, recipeContent) {
  // Only show features for welcome and comeback emails, not for custom emails
  if (recipeName.toLowerCase().includes('welcome')) {
    return `
      <div class="features">
        <h4 style="color: #374151; margin: 0 0 15px 0;">🌟 What you can do with Recipe Revamped:</h4>
        <ul class="feature-list">
          <li class="feature-item">
            <span class="feature-icon">🔍</span>
            AI-powered recipe discovery based on your preferences
          </li>
          <li class="feature-item">
            <span class="feature-icon">📋</span>
            Smart meal planning and grocery list generation
          </li>
          <li class="feature-item">
            <span class="feature-icon">⏱️</span>
            Quick recipe suggestions for busy weeknights
          </li>
          <li class="feature-item">
            <span class="feature-icon">👥</span>
            Share and save your favorite recipes
          </li>
        </ul>
      </div>
    `;
  } else if (recipeName.toLowerCase().includes('comeback')) {
    return `
      <div class="features">
        <h4 style="color: #374151; margin: 0 0 15px 0;">🆕 New features you haven't tried yet:</h4>
        <ul class="feature-list">
          <li class="feature-item">
            <span class="feature-icon">🎯</span>
            Enhanced personalization engine
          </li>
          <li class="feature-item">
            <span class="feature-icon">📱</span>
            Improved mobile experience
          </li>
          <li class="feature-item">
            <span class="feature-icon">🍽️</span>
            New dietary restriction filters
          </li>
        </ul>
      </div>
    `;
  }
  // Custom emails and other templates don't show features section
  return '';
}

function getCtaText(recipeName, recipeContent) {
  if (recipeName.toLowerCase().includes('welcome')) {
    return 'Start Your Culinary Journey';
  } else if (recipeName.toLowerCase().includes('comeback')) {
    return 'Welcome Back - Start Cooking';
  } else if (recipeName.toLowerCase().includes('weekly') || recipeName.toLowerCase().includes('feature')) {
    return 'Try This Week\'s Recipe';
  } else {
    return 'Start Cooking Now';
  }
}

// ============================================================================
// CONTACT FORM EMAIL HANDLER
// ============================================================================

async function sendContactEmail(req, res) {
  const startTime = Date.now();

  try {
    console.log('[CONTACT] Processing contact form submission');

    // Verify authentication (optional for contact form, but good practice)
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        userId = decodedToken.uid;
        console.log(`[CONTACT] Authenticated user: ${userId}`);
      } catch (authError) {
        console.log('[CONTACT] Anonymous contact form submission');
      }
    }

    // Validate request method
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Parse and validate request body
    const { name, email, subject, message, category = 'general' } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400).json({
        error: 'Missing required fields: name, email, subject, message'
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: 'Invalid email address'
      });
      return;
    }

    // Get IP address for logging
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Determine target email based on category
    const getTargetEmail = (category) => {
      const emailRoutes = {
        'general': 'info@reciperevamped.com',
        'support': 'support@reciperevamped.com',
        'business': 'business@reciperevamped.com',
        'legal': 'legal@reciperevamped.com',
        'privacy': 'privacy@reciperevamped.com',
        'cookies': 'cookies@reciperevamped.com',
        'dpo': 'dpo@reciperevamped.com'
      };
      return emailRoutes[category] || 'info@reciperevamped.com';
    };

    const targetEmail = getTargetEmail(category);

    const formData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      category: category.trim(),
      targetEmail,
      ipAddress,
      userId
    };

    console.log(`[CONTACT] Sending email from: ${formData.email}, Subject: ${formData.subject}, Category: ${formData.category}, Target: ${formData.targetEmail}`);

    // Configure email options
    const mailOptions = {
      from: {
        name: 'Recipe Revamped Contact Form',
        address: 'noreply@reciperevamped.com'
      },
      to: formData.targetEmail,
      subject: `[${formData.category.toUpperCase()}] Contact Form: ${formData.subject}`,
      html: generateContactEmailHTML(formData),
      text: `
New Contact Form Submission

Name: ${formData.name}
Email: ${formData.email}
Category: ${formData.category?.toUpperCase() || 'GENERAL'}
Subject: ${formData.subject}

Message:
${formData.message}

Submission Time: ${new Date().toLocaleString()}
IP Address: ${formData.ipAddress || 'Not available'}
      `,
      replyTo: formData.email
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SUCCESS] Contact email sent: ${info.messageId}`);

    // Log the contact form submission to Firestore
    await admin.firestore().collection('contact_submissions').add({
      ...formData,
      emailSent: true,
      messageId: info.messageId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      processed: true
    });

    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully',
      messageId: info.messageId,
      processing_time: processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[CRITICAL] Contact form processing error:', error);

    // Log error to Firestore
    try {
      await admin.firestore().collection('contact_errors').add({
        error: error.message,
        stack: error.stack,
        requestBody: req.body,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processing_time: processingTime
      });
    } catch (logError) {
      console.error('[ERROR] Failed to log contact form error:', logError);
    }

    res.status(500).json({
      success: false,
      error: 'Contact form processing failed',
      message: error.message,
      processing_time: processingTime
    });
  }
}

// ============================================================================
// MARKETING EMAIL FREQUENCY HELPERS
// ============================================================================

function shouldSendMarketingEmail(lastSentDate, frequency = 'weekly') {
  if (!lastSentDate) return true; // First time sending

  const lastSent = new Date(lastSentDate);
  const now = new Date();
  const daysSinceLastSent = Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24));

  switch (frequency) {
    case 'weekly':
      return daysSinceLastSent >= 7;
    case 'biweekly':
      return daysSinceLastSent >= 14;
    default:
      return daysSinceLastSent >= 7; // Default to weekly
  }
}

async function updateUserLastMarketingEmail(userId) {
  try {
    const userDocRef = admin.firestore().collection('userSettings').doc(userId);
    await userDocRef.update({
      'emailPreferences.lastMarketingEmailSent': admin.firestore.FieldValue.serverTimestamp(),
      'emailPreferences.marketingEmailCount': admin.firestore.FieldValue.increment(1)
    });
  } catch (error) {
    console.error(`Error updating last marketing email for user ${userId}:`, error);
  }
}

// ============================================================================
// MARKETING EMAIL HANDLER - UPDATED TO USE MARKETINGEMAILS FIELD
// ============================================================================

async function sendMarketingEmail(req, res) {
  const startTime = Date.now();

  try {
    console.log('[MARKETING] Processing marketing email request');

    // Parse request body to get admin info
    const { recipeName, recipeContent, frequency = 'weekly', overrideFrequency = false, targetUserIds, adminUserId, adminEmail } = req.body;

    // Verify admin privileges if provided in request body
    if (adminUserId && adminEmail) {
      try {
        console.log(`[MARKETING] Attempting to verify admin: ${adminEmail} (${adminUserId})`);

        // Admin verification function (embedded to avoid module issues)
        const isAdmin = await verifyAdminUser(adminEmail, adminUserId);
        console.log(`[MARKETING] Admin verification result: ${isAdmin}`);

        if (!isAdmin) {
          console.log(`[MARKETING] Admin verification failed for: ${adminEmail}`);
          res.status(403).json({ error: "Unauthorized: Admin privileges required" });
          return;
        }
        console.log(`[MARKETING] Admin verified successfully: ${adminEmail}`);
      } catch (error) {
        console.error('[MARKETING] Admin verification failed:', error);
        console.error('[MARKETING] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        res.status(403).json({
          error: "Admin verification failed",
          details: error.message
        });
        return;
      }
    } else {
      // Fallback to token-based authentication if no admin info provided
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized: Missing admin credentials or authorization header" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      await admin.auth().verifyIdToken(idToken);
    }

    // Validate request method
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    if (!recipeName || !recipeContent) {
      res.status(400).json({
        error: 'Missing required fields: recipeName, recipeContent'
      });
      return;
    }

    console.log(`[MARKETING] Sending recipe: ${recipeName} (frequency: ${frequency}, override: ${overrideFrequency})`);

    // Query users who have marketing emails enabled - UPDATED TO USE MARKETINGEMAILS FIELD
    let usersDocuments = [];

    if (targetUserIds && targetUserIds.length > 0) {
      console.log(`[MARKETING] Querying ${targetUserIds.length} specific users`);

      // Handle Firestore 'in' operator limitation (max 10 items)
      // Split into batches of 10 to handle large selections
      const batchSize = 10;
      const batches = [];

      for (let i = 0; i < targetUserIds.length; i += batchSize) {
        const batch = targetUserIds.slice(i, i + batchSize);
        batches.push(batch);
      }

      console.log(`[MARKETING] Processing ${batches.length} batches of users`);
      batches.forEach((batch, index) => {
        console.log(`[MARKETING] Batch ${index + 1}: [${batch.join(', ')}]`);
      });

      // Execute all batches in parallel
      const batchPromises = batches.map(async (batch) => {
        const batchQuery = admin.firestore().collection('userSettings')
          .where(admin.firestore.FieldPath.documentId(), 'in', batch);
        return await batchQuery.get();
      });

      const batchResults = await Promise.all(batchPromises);

      // Combine all batch results
      batchResults.forEach(snapshot => {
        snapshot.forEach(doc => {
          usersDocuments.push(doc);
        });
      });

      console.log(`[MARKETING] Retrieved ${usersDocuments.length} user documents from batches`);
      const retrievedUserIds = usersDocuments.map(doc => doc.id);
      console.log(`[MARKETING] Retrieved user IDs: [${retrievedUserIds.join(', ')}]`);

      // Check if any selected users were missing
      const missingUserIds = targetUserIds.filter(id => !retrievedUserIds.includes(id));
      if (missingUserIds.length > 0) {
        console.log(`[MARKETING] Warning: ${missingUserIds.length} selected users not found in userSettings: [${missingUserIds.join(', ')}]`);
      }
    } else {
      console.log(`[MARKETING] Querying all users with marketing emails enabled`);
      // Send to all users - single query
      const usersQuery = admin.firestore().collection('userSettings');
      const usersSnapshot = await usersQuery.get();
      usersSnapshot.forEach(doc => {
        usersDocuments.push(doc);
      });
    }
    const marketingUsers = [];
    const skippedUsers = [];

    usersDocuments.forEach(doc => {
      const userData = doc.data();
      const userId = doc.id;

      // Debug: Log user data to understand the structure
      console.log(`[MARKETING] Checking user ${userId}:`, {
        email: userData.email,
        emailPreferences: userData.emailPreferences,
        marketingEmails: userData.marketingEmails,
        personalProfile: userData.personalProfile ? {
          email: userData.personalProfile.email
        } : null
      });

      // UPDATED: Check if user has marketing emails enabled using the marketingEmails field from Settings > Notifications
      const hasMarketingEnabled = userData.marketingEmails === true;

      if (hasMarketingEnabled) {
        const lastSentDate = userData.emailPreferences?.lastMarketingEmailSent?.toDate?.() ||
                            userData.emailPreferences?.lastMarketingEmailSent;

        // Check frequency control (unless overridden)
        if (!overrideFrequency && !shouldSendMarketingEmail(lastSentDate, frequency)) {
          skippedUsers.push({
            userId,
            email: userData.email || userData.personalProfile?.email,
            reason: 'frequency_limit',
            lastSent: lastSentDate
          });
          return;
        }

        marketingUsers.push({
          userId,
          email: userData.email || userData.personalProfile?.email,
          name: userData.personalProfile?.name || userData.displayName,
          lastSent: lastSentDate
        });
      } else {
        // Skip users who don't have marketing emails enabled
        skippedUsers.push({
          userId,
          email: userData.email || userData.personalProfile?.email,
          reason: 'marketing_disabled',
          marketingEmails: userData.marketingEmails
        });
      }
    });

    console.log(`[MARKETING] Found ${marketingUsers.length} users with marketing emails enabled`);
    console.log(`[MARKETING] Skipped ${skippedUsers.length} users (marketing disabled or frequency limits)`);

    if (marketingUsers.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No users with marketing emails enabled',
        emailsSent: 0,
        skippedUsers: skippedUsers.length,
        skippedReasons: skippedUsers.reduce((acc, user) => {
          acc[user.reason] = (acc[user.reason] || 0) + 1;
          return acc;
        }, {}),
        processing_time: Date.now() - startTime
      });
      return;
    }

    // Send emails to all marketing-enabled users
    const emailPromises = marketingUsers.map(async (user) => {
      try {
        if (!user.email) {
          console.warn(`[MARKETING] No email found for user: ${user.userId}`);
          return { success: false, userId: user.userId, error: 'No email address' };
        }

        const mailOptions = {
          from: {
            name: 'Recipe Revamped',
            address: 'noreply@reciperevamped.com'
          },
          to: user.email,
          subject: `New Recipe: ${recipeName}`,
          html: generateMarketingEmailHTML(recipeName, recipeContent, user.name),
          text: `
Hi ${user.name || 'Food Lover'}!

New Recipe: ${recipeName}

${recipeContent}

Try this recipe and many more on Recipe Revamped!
Visit: https://reciperevamped.com/app

Happy cooking!
The Recipe Revamped Team

You're receiving this because you opted in to marketing emails.
Manage preferences: https://reciperevamped.com/app
Unsubscribe: https://reciperevamped.com/unsubscribe
          `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[SUCCESS] Marketing email sent to ${user.email}: ${info.messageId}`);

        // Update user's last marketing email sent timestamp
        await updateUserLastMarketingEmail(user.userId);

        return {
          success: true,
          userId: user.userId,
          email: user.email,
          messageId: info.messageId
        };

      } catch (emailError) {
        console.error(`[ERROR] Failed to send marketing email to ${user.email}:`, emailError);
        return {
          success: false,
          userId: user.userId,
          email: user.email,
          error: emailError.message
        };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Log marketing email campaign to Firestore
    await admin.firestore().collection('marketing_campaigns').add({
      recipeName,
      recipeContent,
      totalEligibleUsers: marketingUsers.length,
      skippedUsers: skippedUsers.length,
      emailsSent: successful.length,
      emailsFailed: failed.length,
      frequency,
      overrideFrequency,
      results,
      skippedUsers: skippedUsers.map(u => ({ userId: u.userId, reason: u.reason })),
      adminUserId,
      filterField: 'marketingEmails', // Added to track which field was used for filtering
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      message: 'Marketing email campaign completed',
      eligibleUsers: marketingUsers.length,
      skippedUsers: skippedUsers.length,
      emailsSent: successful.length,
      emailsFailed: failed.length,
      frequency,
      skippedReasons: skippedUsers.reduce((acc, user) => {
        acc[user.reason] = (acc[user.reason] || 0) + 1;
        return acc;
      }, {}),
      results,
      processing_time: processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[CRITICAL] Marketing email processing error:', error);

    res.status(500).json({
      success: false,
      error: 'Marketing email processing failed',
      message: error.message,
      processing_time: processingTime
    });
  }
}

// ============================================================================
// UNSUBSCRIBE HANDLER - UPDATED TO USE MARKETINGEMAILS FIELD
// ============================================================================

async function handleUnsubscribe(req, res) {
  const startTime = Date.now();

  try {
    console.log('[UNSUBSCRIBE] Processing unsubscribe request');

    // Validate request method
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Parse request body
    const { email, token } = req.body;

    if (!email) {
      res.status(400).json({
        error: 'Missing required field: email'
      });
      return;
    }

    console.log(`[UNSUBSCRIBE] Processing unsubscribe for email: ${email}`);

    // Find user by email in userSettings collection
    const usersSnapshot = await admin.firestore().collection('userSettings')
      .where('email', '==', email.toLowerCase())
      .get();

    if (usersSnapshot.empty) {
      // Check in personalProfile.email as well
      const profileSnapshot = await admin.firestore().collection('userSettings')
        .where('personalProfile.email', '==', email.toLowerCase())
        .get();

      if (profileSnapshot.empty) {
        res.status(404).json({
          success: false,
          error: 'Email address not found in our system'
        });
        return;
      }

      // Process unsubscribe from personalProfile email - UPDATED TO USE MARKETINGEMAILS FIELD
      const userDoc = profileSnapshot.docs[0];
      await userDoc.ref.update({
        'marketingEmails': false, // Updated field (correct case)
        'emailPreferences.marketing': false, // Keep legacy field for backward compatibility
        'emailPreferences.marketingUnsubscribedAt': admin.firestore.FieldValue.serverTimestamp(),
        'emailPreferences.unsubscribeMethod': 'direct_link',
        'emailPreferences.lastUpdated': admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Process unsubscribe from main email - UPDATED TO USE MARKETINGEMAILS FIELD
      const userDoc = usersSnapshot.docs[0];
      await userDoc.ref.update({
        'marketingEmails': false, // Updated field (correct case)
        'emailPreferences.marketing': false, // Keep legacy field for backward compatibility
        'emailPreferences.marketingUnsubscribedAt': admin.firestore.FieldValue.serverTimestamp(),
        'emailPreferences.unsubscribeMethod': 'direct_link',
        'emailPreferences.lastUpdated': admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Log unsubscribe event
    await admin.firestore().collection('unsubscribe_events').add({
      email: email.toLowerCase(),
      method: 'direct_link',
      token: token || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      processed: true
    });

    const processingTime = Date.now() - startTime;

    console.log(`[SUCCESS] Unsubscribe processed for: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from marketing emails',
      email: email.toLowerCase(),
      processing_time: processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[CRITICAL] Unsubscribe processing error:', error);

    res.status(500).json({
      success: false,
      error: 'Unsubscribe processing failed',
      message: error.message,
      processing_time: processingTime
    });
  }
}

// ============================================================================
// ADMIN NOTIFICATION EMAIL HANDLER
// ============================================================================

async function sendNotificationEmail(req, res) {
  const startTime = Date.now();

  try {
    console.log('[NOTIFICATION] Processing admin notification email request');

    // Validate request method
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Parse and validate request body
    const { title, message, type, recipients } = req.body;

    if (!title || !message || !recipients || !Array.isArray(recipients)) {
      res.status(400).json({
        error: 'Missing required fields: title, message, recipients (array)'
      });
      return;
    }

    if (recipients.length === 0) {
      res.status(400).json({
        error: 'Recipients array cannot be empty'
      });
      return;
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      res.status(400).json({
        error: 'Invalid email addresses found',
        invalidEmails
      });
      return;
    }

    console.log(`[NOTIFICATION] Sending notification "${title}" to ${recipients.length} recipients`);

    // Generate email template
    const notificationEmailHTML = generateNotificationEmailHTML({
      title,
      message,
      type: type || 'info'
    });

    // Send emails to all recipients
    const emailPromises = recipients.map(async (recipient) => {
      try {
        const mailOptions = {
          from: {
            name: 'Recipe Revamped Notifications',
            address: 'noreply@reciperevamped.com'
          },
          to: recipient,
          subject: `🔔 ${title} - Recipe Revamped`,
          html: notificationEmailHTML,
          text: `
Recipe Revamped Notification

${title}

${message}

---
This notification was sent by the Recipe Revamped admin team.
You can manage your notification preferences in your account settings.

Recipe Revamped
https://reciperevamped.com
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[NOTIFICATION] Email sent successfully to: ${recipient}`);
        return { success: true, email: recipient };
      } catch (error) {
        console.error(`[NOTIFICATION] Failed to send email to ${recipient}:`, error);
        return { success: false, email: recipient, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Log completion
    const processingTime = Date.now() - startTime;
    console.log(`[NOTIFICATION] Completed: ${successCount} sent, ${failureCount} failed, ${processingTime}ms`);

    res.status(200).json({
      success: true,
      message: `Notification emails processed`,
      totalRecipients: recipients.length,
      successCount,
      failureCount,
      results: results,
      processing_time: processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[NOTIFICATION] Error sending notification emails:', error);

    res.status(500).json({
      error: 'Failed to send notification emails',
      message: error.message,
      processing_time: processingTime
    });
  }
}

function generateNotificationEmailHTML(notificationData) {
  const typeColors = {
    info: { bg: '#e1f5fe', border: '#03a9f4', text: '#01579b' },
    success: { bg: '#e8f5e8', border: '#4caf50', text: '#1b5e20' },
    warning: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
    update: { bg: '#e3f2fd', border: '#2196f3', text: '#0d47a1' }
  };

  const colors = typeColors[notificationData.type] || typeColors.info;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Notification from Recipe Revamped</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316, #eab308); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; }
        .notification { background: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .notification-title { color: ${colors.text}; font-weight: bold; font-size: 18px; margin-bottom: 10px; }
        .notification-message { color: ${colors.text}; line-height: 1.6; }
        .footer { background: #374151; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 14px; }
        .footer a { color: #fbbf24; text-decoration: none; }
        .emoji { font-size: 24px; margin-right: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍳 Recipe Revamped</h1>
          <p>Admin Notification</p>
        </div>

        <div class="content">
          <div class="notification">
            <div class="notification-title">
              <span class="emoji">🔔</span>
              ${notificationData.title}
            </div>
            <div class="notification-message">
              ${notificationData.message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <p>This notification was sent by the Recipe Revamped admin team.</p>

          <p>You can manage your notification preferences in your account settings at any time.</p>
        </div>

        <div class="footer">
          <p>© 2024 Recipe Revamped. All rights reserved.</p>
          <p>
            <a href="https://reciperevamped.com">Visit Recipe Revamped</a> |
            <a href="https://reciperevamped.com/unsubscribe">Manage Email Preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// MAIN EMAIL SERVICE HANDLER WITH ROUTING
// ============================================================================

const emailService = onRequest(
  {
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res) => {
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin',
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
      if (req.path === '/contact' || req.url.includes('/contact')) {
        await sendContactEmail(req, res);
        return;
      }

      if (req.path === '/marketing' || req.url.includes('/marketing')) {
        await sendMarketingEmail(req, res);
        return;
      }

      if (req.path === '/unsubscribe' || req.url.includes('/unsubscribe')) {
        await handleUnsubscribe(req, res);
        return;
      }

      if (req.path === '/notification' || req.url.includes('/notification')) {
        await sendNotificationEmail(req, res);
        return;
      }

      // Health check endpoint
      if (req.path === '/health' || req.url.includes('/health')) {
        const processingTime = Date.now() - startTime;
        res.status(200).json({
          status: 'healthy',
          service: 'email-service',
          smtp_configured: true,
          filterField: 'marketingEmails', // Added to indicate which field is used for filtering
          timestamp: new Date().toISOString(),
          processing_time: processingTime
        });
        return;
      }

      // Default response for unknown routes
      res.status(404).json({
        error: 'Email service endpoint not found',
        availableEndpoints: ['/contact', '/marketing', '/unsubscribe', '/health'],
        processing_time: Date.now() - startTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('[CRITICAL] Email service error:', error);

      res.status(500).json({
        error: 'Email service processing failed',
        message: error.message,
        processing_time: processingTime
      });
    }
  }
);

// Export the function
exports.emailService = emailService;
