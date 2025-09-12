import { auth } from './firebase';

interface ImageSearchResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class ImageService {
  private static readonly SEARCH_IMAGES_URL = 'https://searchimagesv2-428797186446.us-central1.run.app';

  /**
   * Extract meaningful keywords from recipe name for image search
   */
  private static extractKeywords(recipeName: string): string[] {
    // Remove common recipe words that don't help with image search
    const stopWords = ['with', 'and', 'or', 'in', 'on', 'the', 'a', 'an', 'recipe', 'dish'];
    
    const words = recipeName.toLowerCase()
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 4); // Take up to 4 meaningful words
    
    // Ensure we have at least one keyword, fallback to generic food terms
    if (words.length === 0) {
      // If no meaningful words found, use generic food terms
      return [recipeName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() || 'food'];
    }
    return words;
  }

  /**
   * Fetches an image URL for a recipe based on its name
   * @param recipeName - The name of the recipe to search for
   * @returns Promise<string | null> - The image URL or null if no image found
   */
  static async getRecipeImage(recipeName: string): Promise<string | null> {
    try {
      // Check authentication
      const user = auth.currentUser;
      if (!user) {
        // User not authenticated for image search
        return null;
      }

      // Get Firebase ID token for authentication
      const idToken = await user.getIdToken();

      // Searching for image for recipe

      const response = await fetch(this.SEARCH_IMAGES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          keywords: this.extractKeywords(recipeName),
          usedImages: [] // Empty array for now - could be enhanced to track used images
        }),
      });

      if (!response.ok) {
        // Image search API returned error status
        return null;
      }

      const result: ImageSearchResponse = await response.json();

      if (!result.success || !result.imageUrl) {
        // No image found for recipe
        return null;
      }

      // Found image for recipe
      return result.imageUrl;

    } catch (error) {
      // Error fetching recipe image, try fallback
      try {
        const { getDefaultRecipeImage } = await import('./recipeImageService');
        const fallbackImage = await getDefaultRecipeImage(recipeName, auth.currentUser?.uid || 'anonymous');
        return fallbackImage;
      } catch (fallbackError) {
        // Both primary and fallback failed
        return null;
      }
    }
  }

  /**
   * Fetches multiple images for different recipes in batch
   * @param recipeNames - Array of recipe names
   * @returns Promise<Record<string, string | null>> - Map of recipe names to image URLs
   */
  static async getBatchRecipeImages(recipeNames: string[]): Promise<Record<string, string | null>> {
    const imageMap: Record<string, string | null> = {};
    
    // For now, we'll fetch images sequentially to avoid overwhelming the API
    // This could be optimized to parallel requests if the API supports it
    for (const recipeName of recipeNames) {
      imageMap[recipeName] = await this.getRecipeImage(recipeName);
      // Small delay between requests to be API-friendly
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return imageMap;
  }
}