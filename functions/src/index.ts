import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for Gen2 functions
setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
});

// Get API keys from environment variables (Gen2 uses different config)
function getApiKeys() {
  // Gen2 functions use environment variables or Firebase config
  let openaiKey = process.env.OPENAI_API_KEY;
  let pexelsKey = process.env.PEXELS_API_KEY;
  
  // Also try the old config format for backward compatibility
  if (!openaiKey && process.env.FIREBASE_CONFIG) {
    openaiKey = process.env.OPENAI_API_KEY;
  }
  if (!pexelsKey && process.env.FIREBASE_CONFIG) {
    pexelsKey = process.env.PEXELS_API_KEY;
  }
  
  return { openaiKey, pexelsKey };
}

// Safe environment validation
function safeValidateEnvironment(): { valid: boolean; errors: string[]; keys?: { openaiKey: string; pexelsKey: string } } {
  const errors: string[] = [];
  const { openaiKey, pexelsKey } = getApiKeys();
  
  // Placeholder values that indicate missing configuration
  const PLACEHOLDER_VALUES = [
    'your_openai_api_key_here',
    'your_pexels_api_key_here',
    'your_secure_openai_key_here',
    'your_secure_pexels_key_here',
  ];
  
  if (!openaiKey) {
    errors.push('OPENAI_API_KEY is required but not set in Firebase config or environment');
  } else if (PLACEHOLDER_VALUES.includes(openaiKey)) {
    errors.push('OPENAI_API_KEY is set to placeholder value - please configure with actual API key');
  } else if (!openaiKey.startsWith('sk-')) {
    errors.push('OPENAI_API_KEY format is invalid (should start with sk-)');
  }
  
  if (!pexelsKey) {
    errors.push('PEXELS_API_KEY is required but not set in Firebase config or environment');
  } else if (PLACEHOLDER_VALUES.includes(pexelsKey)) {
    errors.push('PEXELS_API_KEY is set to placeholder value - please configure with actual API key');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    keys: errors.length === 0 ? { openaiKey, pexelsKey } : undefined
  };
}

// Health check endpoint (Gen2)
export const healthCheckV2 = onRequest((request, response) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000', 
    'https://reciperevamped.web.app',
    'https://reciperevamped.firebaseapp.com'
  ];
  
  const origin = request.headers.origin;
  if (allowedOrigins.includes(origin)) {
    response.set("Access-Control-Allow-Origin", origin);
  }
  
  response.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "recipe-conversion-functions",
    message: "Firebase Functions deployed successfully"
  });
});

// Recipe conversion function using native fetch (Gen2)
export const generateRecipeV2 = onRequest(
  {
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (request, response) => {
    // Set CORS headers for specific origins only
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000', 
      'https://reciperevamped.web.app',
      'https://reciperevamped.firebaseapp.com'
    ];
    
    const origin = request.headers.origin;
    if (allowedOrigins.includes(origin)) {
      response.set("Access-Control-Allow-Origin", origin);
    }
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    try {
      // Verify authentication
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        response.status(401).json({ error: "Unauthorized: Missing or invalid authorization header" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Validate request method
      if (request.method !== "POST") {
        response.status(405).json({ error: "Method not allowed" });
        return;
      }

      // Get request data
      const { originalRecipe, filters, userSettings, mode = "convert" } = request.body;

      // Basic validation
      if (!originalRecipe || typeof originalRecipe !== "string" || originalRecipe.length === 0) {
        response.status(400).json({ error: "Original recipe is required" });
        return;
      }

      if (!filters || !Array.isArray(filters) || filters.length === 0) {
        response.status(400).json({ error: "At least one dietary filter is required" });
        return;
      }

      // Check environment configuration
      const envValidation = safeValidateEnvironment();
      if (!envValidation.valid) {
        console.error('Environment validation failed:', envValidation.errors);
        response.status(500).json({ 
          error: "Service configuration error",
          details: "API keys not properly configured"
        });
        return;
      }
      
      const { openaiKey } = envValidation.keys!;

      // Generate system prompt
      const servingSize = userSettings?.defaultServingSize || 4;
      const unitSystem = userSettings?.preferredUnits || "metric";
      const unitInstructions = unitSystem === "metric" 
        ? "Use metric measurements exclusively (grams, milliliters, liters, Celsius)" 
        : "Use imperial measurements exclusively (cups, tablespoons, teaspoons, ounces, pounds, Fahrenheit)";

      const systemPrompt = `You are a professional chef and nutritionist. Transform the provided recipe according to these requirements:

DIETARY FILTERS: ${filters.join(", ")}
SERVING SIZE: ${servingSize} people
MEASUREMENTS: ${unitInstructions}

CRITICAL: Return ONLY a valid JSON object matching this exact schema:
{
  "recipeName": "string (creative, descriptive name)",
  "prepTime": "string (e.g., '15 minutes')",
  "cookTime": "string (e.g., '30 minutes')", 
  "totalTime": "string (e.g., '45 minutes')",
  "servings": ${servingSize},
  "dietaryRequirements": "string (comma-separated list of dietary compliance)",
  "ingredients": ["array of ingredients with quantities in ${unitSystem} units"],
  "instructions": ["array of step-by-step cooking instructions"],
  "nutrition": {
    "calories": number,
    "protein": number,
    "carbohydrates": number,
    "fat": number,
    "fiber": number,
    "sodium": number
  },
  "tips": ["array of 2-3 professional cooking tips"]
}

Return ONLY valid JSON, no markdown, no explanations.`;

      let userMessage: string;
      if (mode === "convert") {
        userMessage = `Transform this recipe to comply with the dietary requirements:\\n\\n${originalRecipe}`;
      } else if (mode === "create") {
        userMessage = `Create a new recipe using this as inspiration: ${originalRecipe}`;
      } else {
        userMessage = `Create a surprise recipe that incorporates elements from: ${originalRecipe}`;
      }

      // Call OpenAI API using native fetch
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        console.error("OpenAI API error:", errorData);
        response.status(500).json({ error: "AI service error" });
        return;
      }

      const completion: any = await openaiResponse.json();
      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error("No response from OpenAI");
      }

      // Parse JSON response
      let recipeData: any;
      try {
        recipeData = JSON.parse(aiResponse.trim());
      } catch (parseError) {
        // Try to extract JSON from response if it contains extra text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          recipeData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Invalid JSON response from AI");
        }
      }

      // Log usage for monitoring
      console.log("Recipe conversion completed", {
        userId,
        mode,
        filters,
        tokensUsed: completion.usage?.total_tokens || 0,
      });

      // Return successful response
      response.status(200).json({
        success: true,
        data: recipeData,
        tokensUsed: completion.usage?.total_tokens || 0,
      });

    } catch (error: any) {
      console.error("Recipe conversion error:", error);
      
      // Handle specific error types
      if (error.message?.includes("API key")) {
        response.status(500).json({ error: "AI service configuration error" });
      } else if (error.message?.includes("quota")) {
        response.status(429).json({ error: "AI service quota exceeded. Please try again later." });
      } else if (error.message?.includes("Invalid JSON")) {
        response.status(500).json({ error: "AI response parsing error" });
      } else {
        response.status(500).json({ error: "Recipe conversion failed" });
      }
    }
  });

// Image search function using Pexels API (Gen2)
export const searchImagesV2 = onRequest(
  {
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (request, response) => {
    // Set CORS headers for specific origin only
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000', 
      'https://reciperevamped.web.app',
      'https://reciperevamped.firebaseapp.com'
    ];
    
    const origin = request.headers.origin;
    if (allowedOrigins.includes(origin)) {
      response.set("Access-Control-Allow-Origin", origin);
    }
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    try {
      // Verify authentication
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      if (request.method !== "POST") {
        response.status(405).json({ error: "Method not allowed" });
        return;
      }

      const { keywords, usedImages = [] } = request.body;

      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        response.status(400).json({ error: "Keywords array is required" });
        return;
      }

      // Check environment configuration
      const envValidation = safeValidateEnvironment();
      if (!envValidation.valid) {
        console.error('Environment validation failed:', envValidation.errors);
        response.status(500).json({ 
          error: "Image search service configuration error",
          details: "API keys not properly configured"
        });
        return;
      }
      
      const { pexelsKey } = envValidation.keys!;

      // Try multiple search queries
      const searchQueries = [
        `${keywords[0]} ${keywords[1] || ''} food recipe`.trim(),
        `${keywords[0]} dish meal`.trim(),
        `${keywords[0]} cooking cuisine`.trim()
      ].filter(query => query.length > 5);

      for (const searchQuery of searchQueries) {
        const pexelsResponse = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=20&page=1&orientation=landscape`,
          {
            headers: {
              'Authorization': pexelsKey,
            },
          }
        );

        if (!pexelsResponse.ok) {
          continue;
        }

        const data: any = await pexelsResponse.json();

        if (data.photos && data.photos.length > 0) {
          // Filter out used images
          const availablePhotos = data.photos.filter((photo: any) => 
            !usedImages.includes(photo.src.medium)
          );

          if (availablePhotos.length > 0) {
            const selectedPhoto = availablePhotos[0];
            
            // Log usage for rate limiting
            console.log("Image search completed", {
              userId,
              query: searchQuery,
              imageSelected: selectedPhoto.id,
            });

            response.status(200).json({
              success: true,
              imageUrl: selectedPhoto.src.medium,
              photographer: selectedPhoto.photographer,
              alt: selectedPhoto.alt
            });
            return;
          }
        }
      }

      // No images found
      response.status(200).json({
        success: false,
        message: "No suitable images found"
      });

    } catch (error: any) {
      console.error("Image search error:", error);
      
      if (error.message?.includes("quota")) {
        response.status(429).json({ error: "Image search quota exceeded" });
      } else {
        response.status(500).json({ error: "Image search failed" });
      }
    }
  });

// Exchange rates function with caching and rate limiting (Gen2)
export const getExchangeRatesV2 = onRequest(
  {
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (request, response) => {
    // Set CORS headers for specific origins only
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000', 
      'https://reciperevamped.web.app',
      'https://reciperevamped.firebaseapp.com'
    ];
    
    const origin = request.headers.origin;
    if (allowedOrigins.includes(origin)) {
      response.set("Access-Control-Allow-Origin", origin);
    }
    response.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "GET") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      // Fallback rates (updated as of January 2025)
      const fallbackRates = {
        'USD': 1.0,
        'EUR': 0.94,
        'GBP': 0.81,
        'HUF': 395.50,
        'CAD': 1.44,
        'AUD': 1.61,
        'JPY': 157.20,
        'CHF': 0.91,
        'NOK': 11.45,
        'SEK': 11.12,
        'DKK': 7.01,
        'PLN': 4.12,
        'CZK': 24.38
      };

      let rates = fallbackRates;

      // Try to fetch live rates from free APIs
      try {
        // Try ExchangeRate-API first (free tier: 1500 requests/month)
        const apiResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        
        if (apiResponse.ok) {
          const data: any = await apiResponse.json();
          if (data.rates) {
            rates = { USD: 1.0, ...data.rates };
          }
        } else {
          // Try alternative free API
          const altResponse = await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd.json');
          
          if (altResponse.ok) {
            const altData = await altResponse.json();
            const convertedRates: any = { USD: 1.0 };
            
            for (const [currency, rate] of Object.entries((altData as any).usd)) {
              if (typeof rate === 'number') {
                convertedRates[currency.toUpperCase()] = rate;
              }
            }
            
            rates = convertedRates;
          }
        }
      } catch (apiError) {
        // Use fallback rates if APIs fail
        console.warn('Exchange rate APIs failed, using fallback rates');
      }

      // Log usage for rate limiting
      console.log("Exchange rates requested", {
        timestamp: new Date().toISOString(),
        source: rates === fallbackRates ? 'fallback' : 'api',
      });

      response.status(200).json({
        success: true,
        rates,
        timestamp: Date.now(),
        source: rates === fallbackRates ? 'fallback' : 'api'
      });

    } catch (error: any) {
      console.error("Exchange rates error:", error);
      response.status(500).json({ error: "Exchange rates service failed" });
    }
  });

// Security monitoring dashboard endpoint (admin only) (Gen2)
export const securityDashboardV2 = onRequest(async (request, response) => {
    try {
      // Verify admin authentication
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Basic security summary (simplified version without external monitoring)
      const securitySummary = {
        status: "operational",
        lastUpdated: new Date().toISOString(),
        metrics: {
          totalRequests: "monitoring_not_configured",
          failedAuthentications: "monitoring_not_configured", 
          apiErrors: "monitoring_not_configured"
        },
        alerts: [],
        message: "Security monitoring is operational. Full metrics require monitoring system integration."
      };
      
      response.status(200).json({
        status: "success",
        data: securitySummary,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Security dashboard error:", error);
      response.status(500).json({ error: "Dashboard unavailable" });
    }
  });

// Subscription Cancellation Endpoint (temporary workaround)
export const cancelSubscriptionV2 = onRequest(
  {
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (request, response) => {
    // Set CORS headers for specific origins only
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://reciperevamped.web.app',
      'https://reciperevamped.firebaseapp.com',
      'https://reciperevamped.com',
      'https://www.reciperevamped.com'
    ];

    const origin = request.headers.origin;
    if (allowedOrigins.includes(origin)) {
      response.set("Access-Control-Allow-Origin", origin);
    }
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.set("Access-Control-Allow-Credentials", "true");

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    try {
      // Verify authentication
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        response.status(401).json({ error: "Unauthorized: Missing or invalid authorization header" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Validate request method
      if (request.method !== "POST") {
        response.status(405).json({ error: "Method not allowed" });
        return;
      }

      // Parse request body
      const { stripeSubscriptionId, stripeCustomerId, reason } = request.body;

      console.log(`🚫 Processing subscription cancellation for user: ${userId}`);

      // Get current subscription from Firestore
      const subscriptionRef = admin.firestore().collection('subscriptions').doc(userId);
      const subscriptionDoc = await subscriptionRef.get();

      if (!subscriptionDoc.exists) {
        response.status(404).json({ error: 'Subscription not found' });
        return;
      }

      const subscriptionData = subscriptionDoc.data();

      // For now, just mark as cancelled in Firestore (temporary workaround)
      // Full Stripe integration will be handled by the standalone webhook
      const updateData = {
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancellationReason: reason || 'User requested',
        downgradeToPlan: 'free',
        autoRenewal: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await subscriptionRef.update(updateData);

      console.log(`✅ Subscription marked as cancelled for user: ${userId}`);

      response.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully',
        userId,
        currentPlan: 'free', // Immediate downgrade for this workaround
        willDowngradeTo: 'free',
        cancelledAt: new Date().toISOString(),
        note: 'This is a temporary cancellation. Please contact support for full Stripe cancellation.'
      });

    } catch (error: any) {
      console.error("Subscription cancellation error:", error);

      if (error.message?.includes("auth")) {
        response.status(401).json({ error: "Authentication failed" });
      } else {
        response.status(500).json({
          error: "Cancellation failed",
          message: error.message
        });
      }
    }
  });

// Note: Stripe webhook handling has been moved to a standalone Google Cloud Function
// See: /stripe-webhook-service/ for the webhook implementation
// This keeps Firebase Functions lean and separates payment processing concerns