// Pexels API service for fetching food images
const PEXELS_API_KEY = 'YOUR_PEXELS_API_KEY'; // This would normally come from environment variables
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

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

// Cache for storing fetched images to avoid repeated API calls
const imageCache = new Map<string, string>();

export const fetchFoodImage = async (recipeName: string): Promise<string | null> => {
  // Check cache first
  const cacheKey = recipeName.toLowerCase();
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey) || null;
  }

  // For development, return a placeholder food image
  // In production, you would implement actual Pexels API integration
  const placeholderImages = [
    'https://images.unsplash.com/photo-1546554137-f86b9593a222?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80', // Delicious food
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=1480&q=80', // Pancakes
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1481&q=80', // Pizza
    'https://images.unsplash.com/photo-1574979751333-f5a98a7fb4b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80', // Salad
    'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80', // Burger
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1480&q=80', // Healthy bowl
    'https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80', // Dessert
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=1465&q=80', // Soup
  ];

  // Select image based on recipe name hash for consistency
  const hash = recipeName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const imageUrl = placeholderImages[Math.abs(hash) % placeholderImages.length];
  
  // Cache the result
  imageCache.set(cacheKey, imageUrl);
  
  return imageUrl;

  /* 
  // Actual Pexels API implementation (commented out for development)
  try {
    // Create search query from recipe name
    const query = recipeName
      .toLowerCase()
      .replace(/recipe|dish|food/g, '')
      .trim()
      .split(' ')
      .slice(0, 3) // Use first 3 words
      .join(' ');
    
    const searchQuery = `${query} food`;
    
    const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`, {
      headers: {
        'Authorization': PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Pexels API error:', response.statusText);
      return null;
    }

    const data: PexelsResponse = await response.json();
    
    if (data.photos && data.photos.length > 0) {
      // Get a random photo from the results
      const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
      const imageUrl = randomPhoto.src.large;
      
      // Cache the result
      imageCache.set(cacheKey, imageUrl);
      
      return imageUrl;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching image from Pexels:', error);
    return null;
  }
  */
};

// Generate search terms from recipe name for better image matching
export const generateFoodSearchTerms = (recipeName: string): string[] => {
  const commonWords = ['recipe', 'dish', 'food', 'homemade', 'easy', 'quick', 'healthy', 'delicious'];
  const words = recipeName
    .toLowerCase()
    .split(' ')
    .filter(word => !commonWords.includes(word) && word.length > 2);
  
  return words.slice(0, 3); // Return top 3 relevant words
};