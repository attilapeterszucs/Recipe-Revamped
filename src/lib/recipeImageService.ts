// Service to get default recipe images from free APIs
// Using Pexels API for high-quality food images with improved precision and duplicate prevention

import { getAuth } from 'firebase/auth';
import { logger } from './logger';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

// Pexels API will be called through Firebase Functions for security

// Track used images to prevent duplicates
const usedImageCache = new Set<string>();
const userImageTracker = new Map<string, Set<string>>(); // userId -> Set of image URLs

// Fallback food images (free to use stock images)
const FALLBACK_FOOD_IMAGES = [
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/793785/pexels-photo-793785.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1109197/pexels-photo-1109197.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1565982/pexels-photo-1565982.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2641886/pexels-photo-2641886.jpeg?auto=compress&cs=tinysrgb&w=800'
];

// Extract keywords from recipe title/content for better image search
const extractFoodKeywords = (recipeContent: string): string[] => {
  const content = recipeContent.toLowerCase();
  
  // Priority-based food keyword categories (higher priority = better match)
  const keywordCategories = {
    // High priority - specific proteins
    proteins: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'seafood', 'lamb', 'turkey', 'bacon'],
    
    // High priority - dish types
    dishes: ['pasta', 'pizza', 'sandwich', 'burger', 'salad', 'soup', 'curry', 'tacos', 'sushi', 'ramen', 'stir fry'],
    
    // Medium priority - cooking methods
    methods: ['grilled', 'baked', 'roasted', 'fried', 'steamed', 'sauteed', 'braised', 'smoked'],
    
    // Medium priority - cuisine styles  
    cuisines: ['italian', 'asian', 'mexican', 'indian', 'mediterranean', 'chinese', 'japanese', 'thai', 'french'],
    
    // Medium priority - meal types
    meals: ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'brunch', 'appetizer'],
    
    // Lower priority - ingredients
    ingredients: ['rice', 'noodles', 'bread', 'vegetables', 'fruit', 'cheese', 'eggs', 'avocado', 'tomato'],
    
    // Lower priority - dietary
    dietary: ['vegetarian', 'vegan', 'healthy', 'fresh', 'organic', 'gluten-free', 'keto', 'paleo']
  };
  
  const foundKeywords: { keyword: string, priority: number }[] = [];
  
  // Check each category with different priorities
  Object.entries(keywordCategories).forEach(([category, keywords], categoryIndex) => {
    keywords.forEach(keyword => {
      if (content.includes(keyword)) {
        foundKeywords.push({ 
          keyword, 
          priority: 10 - categoryIndex // Higher number = higher priority
        });
      }
    });
  });
  
  // Try to extract from JSON recipe name first (most accurate)
  try {
    const jsonData = JSON.parse(recipeContent);
    if (jsonData.recipeName) {
      const recipeName = jsonData.recipeName.toLowerCase();
      Object.entries(keywordCategories).forEach(([category, keywords]) => {
        keywords.forEach(keyword => {
          if (recipeName.includes(keyword)) {
            foundKeywords.push({ 
              keyword, 
              priority: 15 // Even higher priority for recipe name matches
            });
          }
        });
      });
    }
  } catch (error) {
    // Not JSON, continue with markdown parsing
    const recipeNameMatch = content.match(/\*\*recipe name\*\*\s*:\s*([^*\n]+)/i);
    if (recipeNameMatch) {
      const recipeName = recipeNameMatch[1].trim().toLowerCase();
      Object.entries(keywordCategories).forEach(([category, keywords]) => {
        keywords.forEach(keyword => {
          if (recipeName.includes(keyword)) {
            foundKeywords.push({ 
              keyword, 
              priority: 12 // High priority for recipe name matches
            });
          }
        });
      });
    }
  }
  
  // Sort by priority and return top keywords
  const sortedKeywords = foundKeywords
    .sort((a, b) => b.priority - a.priority)
    .map(item => item.keyword);
  
  // Remove duplicates while preserving order
  const uniqueKeywords = [...new Set(sortedKeywords)];
  
  return uniqueKeywords.length > 0 ? uniqueKeywords : ['food'];
};

// Get recipe image from Pexels API through Firebase Functions with duplicate prevention
export const getRecipeImageFromPexels = async (recipeContent: string, userId?: string): Promise<string | null> => {
  try {
    const keywords = extractFoodKeywords(recipeContent);
    
    // Get Firebase auth token for secure API call
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    
    const idToken = await user.getIdToken();
    
    // Call Firebase Function for secure Pexels API access - Updated for Gen2 deployment
    const functionsUrl = process.env.NODE_ENV === 'development' 
      ? 'https://searchimagesv2-428797186446.us-central1.run.app'
      : 'https://searchimagesv2-428797186446.us-central1.run.app';
    
    const response = await fetch(functionsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        keywords: keywords.slice(0, 3), // Send top 3 keywords
        userId: userId,
        usedImages: userId ? Array.from(userImageTracker.get(userId) || new Set()) : []
      }),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    
    if (result.success && result.imageUrl) {
      // Track this image as used
      usedImageCache.add(result.imageUrl);
      if (userId) {
        if (!userImageTracker.has(userId)) {
          userImageTracker.set(userId, new Set());
        }
        userImageTracker.get(userId)!.add(result.imageUrl);
      }
      
      return result.imageUrl;
    }
    
    return null;
  } catch (error) {
    logger.warn('Failed to fetch image through secure API');
    return null;
  }
};

// Get a fallback image from our curated list with better precision
export const getFallbackRecipeImage = (recipeContent: string, userId?: string): string => {
  const keywords = extractFoodKeywords(recipeContent);
  const keywordText = keywords.join(' ');
  
  // Enhanced keyword-to-image mapping for better precision
  let imageIndex = 0;
  
  // Check keywords for best match
  if (keywordText.includes('chicken') || keywordText.includes('turkey') || keywordText.includes('poultry')) {
    imageIndex = 0; // Chicken dish
  } else if (keywordText.includes('pasta') || keywordText.includes('italian') || keywordText.includes('spaghetti')) {
    imageIndex = 1; // Pasta dish
  } else if (keywordText.includes('salad') || keywordText.includes('vegetarian') || keywordText.includes('fresh')) {
    imageIndex = 2; // Salad/healthy
  } else if (keywordText.includes('soup') || keywordText.includes('broth') || keywordText.includes('stew')) {
    imageIndex = 3; // Soup
  } else if (keywordText.includes('fish') || keywordText.includes('seafood') || keywordText.includes('salmon') || keywordText.includes('tuna')) {
    imageIndex = 4; // Seafood
  } else if (keywordText.includes('dessert') || keywordText.includes('cake') || keywordText.includes('sweet')) {
    imageIndex = 5; // Dessert
  } else if (keywordText.includes('asian') || keywordText.includes('rice') || keywordText.includes('chinese') || keywordText.includes('japanese')) {
    imageIndex = 6; // Asian cuisine
  } else if (keywordText.includes('breakfast') || keywordText.includes('brunch') || keywordText.includes('eggs')) {
    imageIndex = 7; // Breakfast
  } else if (keywordText.includes('beef') || keywordText.includes('pork') || keywordText.includes('meat')) {
    imageIndex = 8; // Meat dish
  } else if (keywordText.includes('pizza') || keywordText.includes('burger') || keywordText.includes('sandwich')) {
    imageIndex = 9 % FALLBACK_FOOD_IMAGES.length; // Comfort food (handle array bounds)
  } else {
    // Use a hash of the recipe content to ensure consistent image selection for the same recipe
    // This prevents the same recipe from getting different images on different saves
    const contentHash = recipeContent.split('').reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0);
    imageIndex = Math.abs(contentHash) % FALLBACK_FOOD_IMAGES.length;
  }
  
  // Track fallback image usage for this user
  const selectedImage = FALLBACK_FOOD_IMAGES[imageIndex];
  if (userId) {
    if (!userImageTracker.has(userId)) {
      userImageTracker.set(userId, new Set());
    }
    userImageTracker.get(userId)!.add(selectedImage);
  }
  usedImageCache.add(selectedImage);
  
  // Selected fallback image for keywords
  return selectedImage;
};

// Main function to get a recipe image (tries Pexels first, then fallback) with improved precision
export const getDefaultRecipeImage = async (recipeContent: string, userId?: string): Promise<string> => {
  // Getting default recipe image with precision matching
  
  // Try Pexels API first with user tracking
  try {
    const pexelsImage = await getRecipeImageFromPexels(recipeContent, userId);
    if (pexelsImage) {
      return pexelsImage;
    }
  } catch (error) {
    // Pexels API failed, using fallback
  }
  
  // Use fallback images with user tracking
  const fallbackImage = getFallbackRecipeImage(recipeContent, userId);
  // Using fallback recipe image with precision matching
  return fallbackImage;
};

// Validate if an image URL is accessible
export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};