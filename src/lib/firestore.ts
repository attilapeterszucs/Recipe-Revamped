import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { SavedRecipe } from './validation';
import { SubscriptionService } from './subscriptionService';
import { getDefaultRecipeImage } from './recipeImageService';

const RECIPES_COLLECTION = 'recipes';

// Auto-detect recipe category based on content
const detectRecipeCategory = (recipeContent: string): string => {
  const content = recipeContent.toLowerCase();
  
  // Check for appetizer keywords
  if (content.includes('appetizer') || content.includes('starter') || 
      content.includes('hors d\'oeuvre') || content.includes('canapé') || 
      content.includes('antipasto') || content.includes('bruschetta') ||
      content.includes('dip') || content.includes('wing') || 
      content.includes('bite') || content.includes('canape')) {
    return 'appetizer';
  }
  
  // Check for dessert keywords
  if (content.includes('dessert') || content.includes('sweet') ||
      content.includes('cake') || content.includes('cookie') || 
      content.includes('ice cream') || content.includes('pie') ||
      content.includes('pudding') || content.includes('tart') ||
      content.includes('brownie') || content.includes('cheesecake') ||
      content.includes('muffin') || content.includes('donut') ||
      content.includes('chocolate') || content.includes('frosting')) {
    return 'dessert';
  }
  
  // Check for side dish keywords
  if (content.includes('side') || content.includes('accompaniment') ||
      content.includes('garnish') || content.includes('roasted vegetables') ||
      content.includes('mashed potato') || content.includes('rice pilaf') ||
      content.includes('bread roll') || content.includes('coleslaw') ||
      content.includes('french fries') || content.includes('salad') &&
      !content.includes('main') && !content.includes('entree')) {
    return 'side-dish';
  }
  
  // Default to main dish for everything else
  return 'main-dish';
};

// Extract recipe name from the generated content (JSON or Markdown)
const extractRecipeName = (recipeContent: string): string => {
  // First, try to parse as JSON (new format)
  try {
    const recipeData = JSON.parse(recipeContent);
    if (recipeData.recipeName && typeof recipeData.recipeName === 'string') {
      return recipeData.recipeName.trim();
    }
  } catch (error) {
    // Not JSON, continue with markdown parsing
  }
  
  // Fallback to markdown parsing for backwards compatibility
  const lines = recipeContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  for (const line of lines.slice(0, 8)) { // Check first 8 non-empty lines    
    
    // Handle recipe name with trailing asterisks: **Recipe Name**
    let match = line.match(/^\*\*([^*]+)\*\*\s*$/i);
    if (match) {
      let title = match[1].trim();
      // Remove any leading/trailing quotes or punctuation
      title = title.replace(/^["""'']+|["""''.,!?]+$/g, '');
      return title;
    }
    
    // Handle the specific format: **Recipe Name:** "Title with apostrophe's"
    match = line.match(/\*\*recipe\s*name\*\*\s*:\s*[""]([^""]+)[""]?/i);
    if (match) {
      return match[1].trim();
    }
    
    // Handle markdown format with regular quotes: **Recipe Name:** "Title"
    match = line.match(/\*\*recipe\s*name\*\*\s*:\s*"([^"]+)"/i);
    if (match) {
      return match[1].trim();
    }
    
    // Handle markdown format without quotes: **Recipe Name:** Title
    match = line.match(/\*\*recipe\s*name\*\*\s*:\s*([^*\n(]+?)(?:\s*[\(]|\s*$)/i);
    if (match) {
      let title = match[1].trim();
      // Remove any leading/trailing quotes or punctuation
      title = title.replace(/^["""'']+|["""''.,!?]+$/g, '');
      if (title && title.length > 0) {
        return title;
      }
    }
    
    // Handle regular recipe patterns: Recipe Name: "Title" or Recipe: "Title"
    match = line.match(/(?:recipe\s*(?:name|title)?)\s*:\s*[""]([^""]+)[""]?/i);
    if (match) {
      return match[1].trim();
    }
    
    // Handle regular quotes
    match = line.match(/(?:recipe\s*(?:name|title)?)\s*:\s*"([^"]+)"/i);
    if (match) {
      return match[1].trim();
    }
    
    // Look for quoted titles anywhere in the line
    match = line.match(/[""]([^""]{3,50})[""]?/);
    if (match && !line.toLowerCase().includes('ingredient') && !line.toLowerCase().includes('instruction')) {
      return match[1].trim();
    }
    
    // Look for regular quoted titles
    match = line.match(/"([^"]{3,50})"/);
    if (match && !line.toLowerCase().includes('ingredient') && !line.toLowerCase().includes('instruction')) {
      return match[1].trim();
    }
    
    // Skip common prefixes and look for actual recipe titles
    if (line.toLowerCase().includes('recipe') && line.length < 80) {
      // Remove common prefixes like "Recipe:", "Recipe for", etc.
      let title = line.replace(/^(\*\*)?recipe\s*(name|title|for)?(\*\*)?\s*:?\s*/i, '').trim();
      // Remove quotes if present
      title = title.replace(/^["""'']+|["""'']+$/g, '');
      if (title && title.length > 3 && title.length < 60) {
        return title.charAt(0).toUpperCase() + title.slice(1);
      }
    }
    
    // Look for lines that look like titles (not instructions, not ingredients lists)
    if (line.length > 5 && 
        line.length < 60 && 
        !line.toLowerCase().includes('ingredients') &&
        !line.toLowerCase().includes('instructions') &&
        !line.toLowerCase().includes('step') &&
        !line.includes('•') &&
        !line.match(/^\d+\./) &&
        !line.includes(':') &&
        !line.toLowerCase().startsWith('prep') &&
        !line.toLowerCase().startsWith('cook') &&
        !line.toLowerCase().startsWith('total') &&
        !line.toLowerCase().startsWith('serves') &&
        !line.toLowerCase().startsWith('serving')) {
      
      return line.charAt(0).toUpperCase() + line.slice(1);
    }
  }
  
  // Fallback: use first substantial line or default
  const firstLine = lines.find(line => line.length > 10 && line.length < 60);
  const fallback = firstLine ? firstLine.charAt(0).toUpperCase() + firstLine.slice(1) : `Recipe - ${new Date().toLocaleDateString()}`;
  return fallback;
};

export const saveRecipe = async (
  userId: string,
  originalRecipe: string,
  convertedRecipe: string,
  dietaryFilters: string[],
  title?: string,
  existingImageUrl?: string
) => {
  // Secure validation - verify authenticated user can save recipes
  const subscription = await SubscriptionService.getUserSubscriptionSecure(userId);
  if (!subscription) {
    throw new Error('Access denied: Invalid authentication');
  }
  
  // Check current recipe count and subscription limits
  const currentRecipes = await getUserRecipes(userId, 1000); // Get all recipes to count
  const limitCheck = await SubscriptionService.canUserSaveRecipe(userId, currentRecipes.length);
  
  if (!limitCheck.canSave) {
    throw new Error(`Recipe limit reached. ${limitCheck.plan.toUpperCase()} plan allows up to ${limitCheck.limit} recipes. Upgrade your plan to save more recipes.`);
  }
  
  // Use existing image URL or get default image for the recipe
  let recipeImageUrl: string | undefined;
  
  if (existingImageUrl) {
    // Use the image URL that was already fetched during recipe generation
    recipeImageUrl = existingImageUrl;
  } else {
    // Fallback to default image if no existing image provided
    try {
      recipeImageUrl = await getDefaultRecipeImage(convertedRecipe, userId);
    } catch (error) {
      console.error('Failed to get fallback recipe image:', error);
      // Continue without image
    }
  }
  
  // Auto-detect recipe category
  const category = detectRecipeCategory(convertedRecipe);
  
  const recipeDoc = {
    originalRecipe,
    convertedRecipe,
    dietaryFilters,
    title: title || extractRecipeName(convertedRecipe),
    category,
    imageUrl: recipeImageUrl,
    ownerUid: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, RECIPES_COLLECTION), recipeDoc);
    return docRef.id;
  } catch (error) {
    // Check if it's a network/connectivity issue
    const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const isNetworkError = errorMsg.includes('blocked') || 
                          errorMsg.includes('network') ||
                          errorMsg.includes('firestore') ||
                          errorMsg.includes('unavailable');
    
    if (error instanceof Error && error.message.includes('Recipe limit reached')) {
      throw error; // Re-throw limit errors
    }
    
    if (isNetworkError) {
      throw new Error('Unable to save recipe - please check your connection and try again.');
    }
    
    throw new Error('Failed to save recipe');
  }
};

// Get user's recipe count and limit info
export const getUserRecipeLimitInfo = async (userId: string): Promise<{
  currentCount: number;
  limit: number;
  plan: string;
  canSave: boolean;
}> => {
  try {
    const recipes = await getUserRecipes(userId, 1000);
    const limitCheck = await SubscriptionService.canUserSaveRecipe(userId, recipes.length);
    
    return {
      currentCount: recipes.length,
      limit: limitCheck.limit,
      plan: limitCheck.plan,
      canSave: limitCheck.canSave
    };
  } catch (error) {
    // Only log non-network/permission errors to avoid console spam
    const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const isKnownError = errorMsg.includes('permissions') || 
                        errorMsg.includes('blocked') || 
                        errorMsg.includes('network') ||
                        errorMsg.includes('firestore');
    
    if (!isKnownError) {
    }
    return {
      currentCount: 0,
      limit: 5,
      plan: 'free',
      canSave: false
    };
  }
};

export const updateRecipe = async (
  recipeId: string,
  updates: {
    title?: string;
    convertedRecipe?: string;
    dietaryFilters?: string[];
    imageUrl?: string;
    category?: string;
  }
) => {
  const updateData = {
    ...updates,
    updatedAt: serverTimestamp()
  };

  await updateDoc(doc(db, RECIPES_COLLECTION, recipeId), updateData);
};

export const getUserRecipes = async (userId: string, maxResults = 20) => {
  const q = query(
    collection(db, RECIPES_COLLECTION),
    where('ownerUid', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const querySnapshot = await getDocs(q);
  const recipes: SavedRecipe[] = [];
  
  querySnapshot.forEach((doc) => {
    recipes.push({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as SavedRecipe);
  });

  return recipes;
};

export const deleteRecipe = async (recipeId: string) => {
  await deleteDoc(doc(db, RECIPES_COLLECTION, recipeId));
};

export const updateRecipeTitle = async (recipeId: string, title: string) => {
  await updateDoc(doc(db, RECIPES_COLLECTION, recipeId), {
    title,
    updatedAt: serverTimestamp()
  });
};
