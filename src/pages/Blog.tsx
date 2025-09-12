import React, { useEffect } from 'react';
import { Calendar, User, Clock, ArrowRight, Tag, ChefHat, ArrowLeft } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
  image: string;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'How AI Transforms Your Favorite Recipes: The Complete Guide to Smart Recipe Conversion',
    excerpt: 'Discover the revolutionary technology behind AI-powered recipe adaptation. Learn how machine learning algorithms analyze nutritional content, ingredient interactions, and dietary restrictions to create perfect recipe modifications that maintain flavor while meeting your health goals.',
    content: `# How AI Transforms Your Favorite Recipes: The Complete Guide to Smart Recipe Conversion

In today's health-conscious world, adapting recipes to meet dietary needs has become essential for millions of people. Whether you're managing diabetes, following a keto diet, or dealing with food allergies, traditional recipe conversion can be time-consuming and often results in disappointing meals that lack flavor or proper nutrition.

## The Science Behind AI Recipe Adaptation

Artificial Intelligence has revolutionized the way we approach recipe modification. Unlike simple ingredient substitutions, AI-powered recipe conversion analyzes multiple factors simultaneously:

### Nutritional Balance Analysis
Modern AI systems understand the complex relationships between macronutrients (proteins, carbohydrates, and fats) and micronutrients (vitamins and minerals). When converting a recipe from standard to keto, for instance, the AI doesn't just replace high-carb ingredients—it ensures the resulting dish maintains proper nutritional balance while achieving the desired macronutrient ratios.

### Ingredient Interaction Modeling
Professional chefs know that cooking is chemistry. AI recipe converters have learned from thousands of successful recipes to understand how ingredients interact. When substituting wheat flour with almond flour, the AI knows to adjust liquid ratios, add binding agents, and modify cooking temperatures and times to achieve the desired texture.

### Flavor Profile Preservation
One of the biggest challenges in recipe adaptation is maintaining the original dish's flavor profile. AI systems analyze taste compounds and their interactions to suggest substitutions that preserve the essential flavors while meeting dietary requirements.

## Real-World Applications

### For Diabetes Management
AI can automatically adjust recipes to achieve specific glycemic index targets, replacing high-GI ingredients with lower-impact alternatives while maintaining satisfaction and flavor.

### For Weight Management
Smart recipe conversion can reduce caloric density while increasing satiety through strategic ingredient substitutions and portion optimization.

### For Food Allergies
AI systems maintain comprehensive databases of allergen-free alternatives and can instantly convert recipes to avoid specific triggers while preserving nutritional value.

## The Future of Personalized Cooking

As AI technology continues to advance, we're moving toward truly personalized nutrition. Future systems will consider individual metabolic profiles, genetic factors, and taste preferences to create completely customized recipes.

## Getting Started with AI Recipe Conversion

The best AI recipe converters offer:
- **Instant conversion** across multiple dietary patterns
- **Nutritional transparency** with detailed breakdowns
- **Shopping list generation** with calculated portions
- **Cooking instruction adjustments** for modified ingredients
- **Success rate predictions** based on user feedback

By embracing AI-powered recipe conversion, home cooks can enjoy their favorite dishes while maintaining their health goals—no compromise required.`,
    author: 'Recipe Revamped Team',
    date: '2025-01-08',
    readTime: '8 min read',
    tags: ['AI', 'Recipe Conversion', 'Nutrition', 'Health Technology'],
    image: 'https://images.pexels.com/photos/4226217/pexels-photo-4226217.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: '2',
    title: 'Keto Recipe Conversion Mastery: 12 Expert Techniques for Perfect Low-Carb Adaptations',
    excerpt: 'Master the art of ketogenic recipe conversion with professional techniques used by top nutritionists. Learn the science-backed methods for transforming any traditional recipe into a delicious, keto-compliant version while maintaining flavor, texture, and nutritional value.',
    content: `# Keto Recipe Conversion Mastery: 12 Expert Techniques for Perfect Low-Carb Adaptations

The ketogenic diet has gained massive popularity for its proven weight loss and metabolic health benefits. However, many people struggle to adapt their favorite recipes to fit keto macronutrient requirements. This comprehensive guide reveals the professional techniques used by nutritionists and keto chefs worldwide.

## Understanding Keto Fundamentals

Before diving into conversion techniques, it's crucial to understand the ketogenic framework:
- **70-80% of calories from healthy fats**
- **15-25% from quality proteins**
- **5-10% from net carbohydrates (total carbs minus fiber)**

## The 12 Essential Conversion Techniques

### 1. Master Flour Substitutions
Traditional wheat flour contains 95g carbs per cup. Keto alternatives include:
- **Almond flour**: 24g net carbs per cup (best for baked goods)
- **Coconut flour**: 16g net carbs per cup (highly absorbent—use 1/4 the amount)
- **Psyllium husk powder**: Near-zero carbs (excellent binding agent)

### 2. Sugar Replacement Strategies
Replace sugar with keto-friendly sweeteners while maintaining proper ratios:
- **Erythritol**: 1:1 replacement ratio, cooling effect
- **Monk fruit**: 1:3 ratio (much sweeter than sugar)
- **Stevia**: 1:24 ratio (extremely potent)

### 3. Vegetable Carb Swaps
Transform high-carb vegetables into keto-compliant alternatives:
- Replace potatoes with cauliflower or turnips
- Substitute rice with cauliflower rice or shirataki rice
- Use zucchini noodles instead of pasta
- Replace corn with diced radishes

### 4. Thickening Agent Modifications
Traditional thickeners like cornstarch are high-carb. Keto alternatives:
- **Xanthan gum**: Extremely powerful (use sparingly)
- **Glucomannan powder**: Excellent for sauces
- **Egg yolks**: Natural thickening for custards and sauces

### 5. Dairy Optimization
Choose full-fat, low-carb dairy options:
- Heavy cream instead of milk
- Full-fat Greek yogurt over regular yogurt
- Aged cheeses over processed varieties
- Butter over margarine

### 6. Protein Source Selection
Optimize protein choices for better fat ratios:
- Fatty fish (salmon, mackerel) over lean fish
- Dark meat chicken over white meat
- Grass-fed beef over lean cuts
- Eggs (especially yolks) for complete nutrition

### 7. Sauce and Dressing Conversions
Most commercial sauces contain hidden sugars:
- Make mayonnaise-based dressings from scratch
- Use olive oil and vinegar combinations
- Create cream-based sauces instead of tomato-based
- Add herbs and spices for flavor complexity

### 8. Baking Technique Adjustments
Keto baking requires modified techniques:
- Increase eggs for structure and moisture
- Add extra fat to compensate for flour changes
- Lower oven temperature by 25°F
- Extend baking time slightly
- Use parchment paper to prevent sticking

### 9. Liquid Modifications
Adjust liquid ratios for different flour types:
- Coconut flour absorbs 3-4x more liquid than wheat flour
- Almond flour requires slightly more liquid
- Add bone broth for savory dishes
- Use unsweetened almond milk in sweet applications

### 10. Seasoning Enhancement
Without sugar and starchy foods, flavor becomes crucial:
- Use fresh herbs generously
- Incorporate healthy fats like avocado oil for cooking
- Add acid (lemon, vinegar) to brighten flavors
- Include umami sources (mushrooms, aged cheese, fish sauce)

### 11. Texture Preservation
Maintain appealing textures in keto versions:
- Add psyllium husk for bread-like texture
- Use unflavored gelatin for structure
- Incorporate nuts and seeds for crunch
- Whip cream for lightness

### 12. Portion and Macro Calculation
Ensure recipes meet keto requirements:
- Calculate net carbs per serving
- Verify fat percentage targets
- Adjust portion sizes for satiety
- Use nutrition tracking apps for accuracy

## Common Conversion Mistakes to Avoid

- **Over-substituting**: Making too many changes at once
- **Ignoring texture**: Focusing only on macros, not mouthfeel
- **Underseasoning**: Keto foods need more flavor enhancement
- **Improper ratios**: Not adjusting liquid-to-dry ingredient ratios

## Sample Conversion: Classic Chocolate Chip Cookies

**Original Recipe Issues**: High in sugar, wheat flour, and processed ingredients

**Keto Conversion**:
- Replace 2 cups flour with 1½ cups almond flour + ¼ cup coconut flour
- Substitute 1 cup sugar with ⅓ cup erythritol + stevia to taste
- Use sugar-free chocolate chips (Lily's brand)
- Add extra egg yolk for richness
- Increase vanilla extract by 50%

**Result**: Cookies with 3g net carbs vs. original 15g per serving

## Advanced Tips for Success

1. **Experiment gradually**: Make one substitution at a time
2. **Keep detailed notes**: Track what works and what doesn't
3. **Taste as you go**: Adjust seasonings throughout cooking
4. **Consider texture**: Some dishes work better than others for conversion
5. **Plan for learning curve**: First attempts may need refinement

## The Science of Successful Keto Conversions

Understanding why certain substitutions work helps create better results:

- **Fat provides satiety**: Higher fat content keeps you satisfied longer
- **Protein preserves muscle**: Adequate protein prevents muscle loss during weight loss
- **Low carbs maintain ketosis**: Staying under carb limits keeps your body in fat-burning mode
- **Fiber improves digestion**: Many keto substitutes are higher in beneficial fiber

## Measuring Success

Track these indicators to ensure your conversions are working:
- **Ketone levels**: Use strips or meters to confirm ketosis
- **Energy levels**: Good conversions maintain stable energy
- **Satisfaction**: Properly converted recipes should be filling and enjoyable
- **Weight management**: Successful keto eating supports weight goals

## Conclusion

Mastering keto recipe conversion opens up a world of culinary possibilities while maintaining your health goals. Start with simple substitutions, gradually build your skills, and soon you'll be creating keto versions of any recipe that are even better than the originals.

Remember: the best keto recipes don't taste like "diet food"—they're simply delicious food that happens to be perfectly aligned with your health goals.`,
    author: 'Recipe Revamped Team',
    date: '2025-01-06',
    readTime: '12 min read',
    tags: ['Keto', 'Low-Carb', 'Recipe Conversion', 'Weight Loss', 'Nutrition'],
    image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: '3',
    title: 'Food Allergy-Safe Recipe Adaptation: The Complete Professional Guide to Safe, Delicious Cooking',
    excerpt: 'Navigate food allergies with confidence using proven techniques from allergy specialists and professional chefs. Discover how to create safe, nutritious, and delicious versions of any recipe while avoiding cross-contamination and maintaining nutritional balance.',
    content: `# Food Allergy-Safe Recipe Adaptation: The Complete Professional Guide to Safe, Delicious Cooking

Food allergies affect over 32 million Americans, making safe recipe adaptation not just convenient, but essential for health and sometimes survival. This comprehensive guide combines medical expertise with culinary science to help you create delicious, safe versions of any recipe.

## Understanding Food Allergies vs. Intolerances

### Food Allergies (Immune Response)
- **Symptoms**: Range from mild (hives, digestive upset) to severe (anaphylaxis)
- **Timeline**: Usually occur within minutes to 2 hours after exposure
- **Treatment**: Complete avoidance of trigger foods
- **Common allergens**: Milk, eggs, peanuts, tree nuts, soy, wheat, fish, shellfish

### Food Intolerances (Digestive Response)
- **Symptoms**: Primarily digestive (bloating, gas, diarrhea)
- **Timeline**: Can occur hours after consumption
- **Treatment**: May tolerate small amounts or with digestive aids
- **Common intolerances**: Lactose, fructose, histamine, FODMAPs

## The 8 Major Allergens and Safe Substitutions

### 1. Milk/Dairy Allergies
**Safe substitutions**:
- **Milk**: Oat milk, almond milk, coconut milk (choose unsweetened)
- **Butter**: Vegan butter, coconut oil, olive oil
- **Cheese**: Nutritional yeast, dairy-free cheese alternatives
- **Cream**: Coconut cream, cashew cream
- **Yogurt**: Coconut yogurt, almond yogurt with probiotics

**Pro tip**: For baking, coconut milk powder provides richness without liquid adjustments.

### 2. Egg Allergies
**Safe substitutions** (per egg):
- **Ground flaxseed**: 1 tbsp + 3 tbsp water (let sit 5 minutes)
- **Chia seeds**: 1 tbsp + 3 tbsp water (excellent binding)
- **Aquafaba**: 3 tbsp (liquid from canned chickpeas)
- **Commercial egg replacer**: Follow package directions
- **Banana**: ¼ mashed banana (adds sweetness and moisture)

**Function-specific substitutions**:
- **Binding**: Flax or chia eggs
- **Leavening**: Baking soda + acid (vinegar/lemon)
- **Moisture**: Applesauce, mashed banana

### 3. Peanut Allergies
**Safe alternatives**:
- **Sunbutter** (sunflower seed butter): Similar texture and protein
- **Tahini**: Rich, nutty flavor perfect for sauces
- **Soy butter**: High protein option (if soy is safe)
- **Coconut butter**: Creamy texture, different flavor profile

**Cross-contamination warning**: Many tree nut butters are processed in facilities that also process peanuts.

### 4. Tree Nut Allergies
**Safe substitutions**:
- **Seeds**: Sunflower seeds, pumpkin seeds, hemp hearts
- **Toasted coconut**: Adds crunch and flavor
- **Crispy chickpeas**: Roasted for texture
- **Breadcrumbs**: For coating applications

### 5. Soy Allergies
**Hidden soy sources**: Lecithin, vegetable oil, many processed foods
**Safe alternatives**:
- **Soy sauce**: Coconut aminos, salt, or tamari (if wheat-free needed)
- **Tofu**: Extra-firm mushrooms, cauliflower
- **Tempeh**: Marinated mushrooms or lentil-based alternatives

### 6. Wheat/Gluten Allergies
**Flour substitutions** (1:1 ratios work best with blends):
- **All-purpose blend**: Combine rice flour, potato starch, tapioca flour
- **Almond flour**: High protein, works well for pancakes and quick breads
- **Oat flour**: Make by grinding certified gluten-free oats
- **Coconut flour**: Use ¼ the amount, increase liquids significantly

**Binding agents for gluten-free baking**:
- Xanthan gum: ½ teaspoon per cup of flour
- Psyllium husk: 1 teaspoon per cup of flour
- Ground flaxseed: Adds nutrition and binding

### 7. Fish Allergies
**Umami alternatives**:
- **Mushroom powder**: Dried shiitake mushrooms ground fine
- **Seaweed**: Nori, dulse, or kelp for ocean flavor
- **Miso paste**: If soy is safe, adds deep umami
- **Nutritional yeast**: Provides savory depth

### 8. Shellfish Allergies
**Flavor alternatives**:
- **Old Bay seasoning**: Without shellfish-derived ingredients
- **Mushrooms**: King oyster mushrooms mimic scallop texture
- **Hearts of palm**: Shredded for "crab" salad texture
- **Kelp noodles**: Ocean flavor without seafood

## Advanced Techniques for Safe Recipe Adaptation

### Cross-Contamination Prevention
1. **Dedicated equipment**: Use separate cutting boards, utensils, and prep areas
2. **Thorough cleaning**: Wash all surfaces with hot, soapy water
3. **Storage separation**: Keep allergen-free ingredients in clearly labeled containers
4. **Reading labels**: Check every ingredient, even familiar ones, as formulations change

### Nutritional Balance Maintenance
When removing major food groups, ensure adequate nutrition:

**Protein replacement strategies**:
- Combine complementary proteins (rice + beans)
- Include variety of protein sources
- Consider amino acid profiles

**Vitamin and mineral considerations**:
- **Calcium** (dairy-free): Fortified plant milks, leafy greens, tahini
- **B12** (if avoiding animal products): Nutritional yeast, fortified foods
- **Iron**: Pair plant sources with vitamin C for better absorption

### Texture and Flavor Compensation
**Replacing richness**:
- Avocado for creaminess
- Coconut milk for richness
- Tahini for nutty depth
- Roasted vegetables for complexity

**Enhancing flavors**:
- Fresh herbs and spices
- Acid (lemon, vinegar) to brighten
- Roasting and caramelizing
- Layering seasonings throughout cooking

## Recipe Conversion Process

### Step 1: Identify All Allergens
- Read every ingredient label
- Check for cross-contamination warnings
- Research hidden sources of allergens
- Consider cooking methods (shared fryers, etc.)

### Step 2: Choose Appropriate Substitutions
- Match function (binding, leavening, flavor)
- Consider cooking method
- Account for texture changes
- Plan for nutritional needs

### Step 3: Test and Adjust
- Start with small batches
- Keep detailed notes
- Adjust seasonings and textures
- Get feedback from those with allergies

### Step 4: Verify Safety
- Double-check all substitute ingredients
- Ensure proper labeling and storage
- Maintain detailed ingredient lists
- Consider keeping EpiPens nearby for severe allergies

## Professional Kitchen Standards

### Label Everything
- Ingredient lists on all containers
- "Contains" and "May contain" warnings
- Preparation dates and storage requirements
- Clear allergen-free designations

### Staff Training
- Recognition of allergic reactions
- Cross-contamination prevention
- Proper cleaning protocols
- Emergency response procedures

### Documentation
- Keep records of all recipes and modifications
- Track successful substitutions
- Note any adverse reactions
- Maintain supplier ingredient information

## Common Mistakes to Avoid

1. **Assuming "natural" means safe**: Many natural ingredients can cause reactions
2. **Not checking medications and supplements**: These can contain allergens
3. **Overlooking cross-reactive foods**: Some allergens share proteins
4. **Inadequate cleaning between preparations**: Microscopic amounts can trigger reactions
5. **Not planning for emergencies**: Always have emergency action plans

## Emergency Preparedness

### Recognition of Allergic Reactions
**Mild reactions**:
- Skin: Hives, itching, eczema flare
- Digestive: Nausea, vomiting, diarrhea, stomach pain
- Respiratory: Sneezing, mild cough

**Severe reactions (anaphylaxis)**:
- Difficulty breathing or swallowing
- Swelling of face, lips, tongue, throat
- Rapid pulse, dizziness, loss of consciousness
- Severe full-body reaction

### Action Steps
1. **Stop eating immediately**
2. **Administer antihistamines** for mild reactions
3. **Use epinephrine auto-injector** for severe reactions
4. **Call 911** for any severe reaction
5. **Seek medical attention** even if symptoms improve

## Building Confidence in Allergy-Safe Cooking

### Start Simple
- Begin with naturally allergen-free recipes
- Master a few reliable substitutions
- Build a repertoire of safe, favorite dishes
- Gradually tackle more complex recipes

### Create Support Systems
- Connect with others managing similar allergies
- Join online communities and support groups
- Work with registered dietitians when needed
- Build relationships with understanding healthcare providers

### Stay Informed
- Keep updated on food labeling regulations
- Learn about new allergen-free products
- Stay current on cross-contamination research
- Follow reputable allergy organizations

## The Future of Allergy-Safe Cooking

Emerging technologies are making allergy-safe cooking easier:
- **AI-powered recipe conversion** tools that automatically suggest safe substitutions
- **Advanced allergen testing** for home and commercial use
- **Improved food labeling** with better allergen information
- **New ingredient innovations** creating better allergen-free alternatives

## Conclusion

Creating delicious, safe, allergen-free recipes is both an art and a science. With proper knowledge, techniques, and precautions, anyone can enjoy a varied, nutritious, and satisfying diet despite food allergies.

Remember: safety always comes first, but that doesn't mean sacrificing flavor or enjoyment. The key is understanding both the science of allergies and the art of cooking, then applying both with confidence and creativity.

**Always consult with healthcare providers and allergists for personalized advice, especially for severe allergies or when introducing new foods.**`,
    author: 'Recipe Revamped Team',
    date: '2025-01-04',
    readTime: '15 min read',
    tags: ['Food Allergies', 'Food Safety', 'Health', 'Recipe Adaptation', 'Nutrition'],
    image: 'https://images.pexels.com/photos/6544773/pexels-photo-6544773.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

// Images for blog posts content
const blogImages = {
  '1': [
    'https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  '2': [
    'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  '3': [
    'https://images.pexels.com/photos/5938323/pexels-photo-5938323.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/7627437/pexels-photo-7627437.jpeg?auto=compress&cs=tinysrgb&w=800'
  ]
};

const formatBlogContent = (content: string, blogId: string): string => {
  let formatted = content;
  const images = blogImages[blogId as keyof typeof blogImages] || [];
  
  // Remove the first H1 title since it's already in the header
  formatted = formatted.replace(/^# .+$/m, '');
  
  // Convert markdown headers to HTML
  formatted = formatted.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  
  // Convert markdown bold text
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert markdown lists
  formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Split content into paragraphs and add images
  const paragraphs = formatted.split('\n\n');
  const result: string[] = [];
  
  let imageIndex = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    if (!paragraph) continue;
    
    // Add paragraph
    if (!paragraph.startsWith('<h') && !paragraph.startsWith('<ul') && !paragraph.startsWith('<li')) {
      result.push(`<p>${paragraph}</p>`);
    } else {
      result.push(paragraph);
    }
    
    // Add images at strategic points (after 30% and 70% of content)
    if (images.length > imageIndex) {
      const insertPoint1 = Math.floor(paragraphs.length * 0.3);
      const insertPoint2 = Math.floor(paragraphs.length * 0.7);
      
      if (i === insertPoint1 || i === insertPoint2) {
        result.push(`
          <div class="my-12 rounded-2xl overflow-hidden shadow-lg">
            <img src="${images[imageIndex]}" alt="Recipe cooking illustration" class="w-full h-80 object-cover" />
          </div>
        `);
        imageIndex++;
      }
    }
  }
  
  return result.join('\n');
};

// SEO helper functions
const updateMetaTags = (title: string, description: string, keywords: string, image?: string) => {
  // Update title
  document.title = title;
  
  // Update meta description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', description);
  
  // Update keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', keywords);
  
  // Update Open Graph tags
  const ogTags = [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: window.location.href },
    { property: 'og:site_name', content: 'Recipe Revamped' }
  ];
  
  if (image) {
    ogTags.push({ property: 'og:image', content: image });
  }
  
  ogTags.forEach(tag => {
    let meta = document.querySelector(`meta[property="${tag.property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', tag.property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', tag.content);
  });
  
  // Update Twitter Card tags
  const twitterTags = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description }
  ];
  
  if (image) {
    twitterTags.push({ name: 'twitter:image', content: image });
  }
  
  twitterTags.forEach(tag => {
    let meta = document.querySelector(`meta[name="${tag.name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', tag.name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', tag.content);
  });
};

const addStructuredData = (post?: BlogPost) => {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }
  
  let structuredData;
  
  if (post) {
    // Individual blog post structured data
    structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "image": post.image,
      "author": {
        "@type": "Organization",
        "name": "Recipe Revamped"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Recipe Revamped",
        "logo": {
          "@type": "ImageObject",
          "url": "https://reciperevamped.com/logo.png"
        }
      },
      "datePublished": post.date,
      "dateModified": post.date,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      }
    };
  } else {
    // Blog listing structured data
    structuredData = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Recipe Revamped Blog",
      "description": "Expert insights on AI-powered cooking, recipe conversion, and dietary adaptation",
      "url": "https://reciperevamped.com/blog",
      "author": {
        "@type": "Organization",
        "name": "Recipe Revamped"
      },
      "blogPost": blogPosts.map(post => ({
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt,
        "image": post.image,
        "author": {
          "@type": "Organization",
          "name": "Recipe Revamped"
        },
        "datePublished": post.date,
        "url": `https://reciperevamped.com/blog/${post.id}`
      }))
    };
  }
  
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
};

export const Blog: React.FC = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  
  const allTags = Array.from(new Set(blogPosts.flatMap(post => post.tags)));
  
  const filteredPosts = selectedTag 
    ? blogPosts.filter(post => post.tags.includes(selectedTag))
    : blogPosts;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // SEO updates for individual posts or blog listing
  useEffect(() => {
    if (blogId) {
      const post = blogPosts.find(p => p.id === blogId);
      if (post) {
        updateMetaTags(
          `${post.title} | Recipe Revamped Blog`,
          post.excerpt,
          post.tags.join(', ') + ', recipe conversion, AI cooking, healthy eating',
          post.image
        );
        addStructuredData(post);
      }
    } else {
      updateMetaTags(
        'Recipe Revamped Blog | AI-Powered Cooking Insights & Recipe Conversion Tips',
        'Discover expert insights on AI-powered recipe conversion, dietary adaptation, and healthy cooking. Learn from nutrition specialists about keto, food allergies, and smart recipe modification.',
        'AI recipe conversion, smart cooking, dietary adaptation, keto recipes, food allergy cooking, recipe modification, healthy eating, nutrition tips, cooking technology'
      );
      addStructuredData();
    }
  }, [blogId]);

  // If blogId is provided, show individual blog post
  if (blogId) {
    const post = blogPosts.find(p => p.id === blogId);
    if (!post) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
          <AuthAwareNavigation />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
              <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
              <Link
                to="/blog"
                className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <AuthAwareNavigation />
        
        {/* Hero Section with Background Image */}
        <div className="relative h-[60vh] min-h-[500px] bg-gradient-to-r from-green-600 to-blue-600 overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10"></div>
          
          {/* Content Container */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16">
            {/* Back to blog link */}
            <div className="mb-8">
              <Link
                to="/blog"
                className="inline-flex items-center text-white/90 hover:text-white font-medium transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 bg-white/15 backdrop-blur-md text-white text-sm font-medium rounded-full border border-white/20 whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 4 && (
                <span className="px-4 py-2 bg-white/15 backdrop-blur-md text-white text-sm font-medium rounded-full border border-white/20">
                  +{post.tags.length - 4} more
                </span>
              )}
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight max-w-4xl">
              {post.title}
            </h1>
            
            {/* Excerpt */}
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mb-8 leading-relaxed">
              {post.excerpt}
            </p>
            
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-6 text-white/80">
              <div className="flex items-center bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="font-medium">{formatDate(post.date)}</span>
              </div>
              <div className="flex items-center bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Clock className="w-4 h-4 mr-2" />
                <span className="font-medium">{post.readTime}</span>
              </div>
            </div>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">

          {/* Blog post content */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-16">
            {/* Content Header */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 px-8 lg:px-12 py-8 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Content</h2>
                  <p className="text-gray-600">In-depth insights and expert guidance</p>
                </div>
                <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Published</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Article Content */}
            <div className="px-8 lg:px-12 py-12">
              <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-8 prose-h1:leading-tight prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-green-800 prose-h2:border-b prose-h2:border-green-200 prose-h2:pb-3 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-10 prose-h3:mb-6 prose-h3:text-gray-800 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:my-8 prose-ul:space-y-3 prose-li:text-gray-700 prose-li:leading-relaxed prose-li:pl-2 prose-code:bg-green-100 prose-code:text-green-800 prose-code:px-3 prose-code:py-1 prose-code:rounded-md prose-code:font-medium prose-blockquote:border-l-4 prose-blockquote:border-green-500 prose-blockquote:bg-green-50 prose-blockquote:p-6 prose-blockquote:my-8 prose-blockquote:rounded-r-lg prose-blockquote:shadow-sm prose-a:text-green-600 prose-a:font-medium prose-a:no-underline hover:prose-a:text-green-700 hover:prose-a:underline">
                <div dangerouslySetInnerHTML={{ __html: formatBlogContent(post.content, post.id) }} />
              </div>
            </div>
            
            {/* Article Footer */}
            <div className="bg-gray-50 px-8 lg:px-12 py-8 border-t border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Last updated: {formatDate(post.date)}
                </div>
                <div className="flex items-center space-x-4">
                  <button className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium">
                    <Heart className="w-4 h-4 mr-2" />
                    Helpful
                  </button>
                  <button className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                    Share Article
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related posts */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-16">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-8 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Related Articles</h2>
                  <p className="text-gray-600">Continue exploring expert insights</p>
                </div>
                <div className="hidden sm:block">
                  <Link
                    to="/blog"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    View All Articles
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {blogPosts
                  .filter(p => p.id !== post.id && p.tags.some(tag => post.tags.includes(tag)))
                  .slice(0, 2)
                  .map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      to={`/blog/${relatedPost.id}`}
                      className="group block bg-gray-50 rounded-2xl overflow-hidden hover:bg-gray-100 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="h-48 bg-gradient-to-br from-green-100 to-blue-100 relative overflow-hidden">
                        <img
                          src={relatedPost.image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                      <div className="p-6">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {relatedPost.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors line-clamp-2 leading-tight">
                          {relatedPost.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                          {relatedPost.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{relatedPost.readTime}</span>
                          </div>
                          <div className="text-green-600 font-medium text-sm group-hover:text-green-700 transition-colors">
                            Read Article →
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                }
              </div>
            </div>
          </div>

          {/* Newsletter signup */}
          <div className="mt-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Updated with Recipe Revamped</h2>
            <p className="mb-6 text-green-100">
              Get the latest insights on AI-powered cooking, nutrition tips, and recipe innovations delivered to your inbox.
            </p>
            <div className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                Subscribe
              </button>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-white mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Recipe Revamped Blog</h1>
            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
              Discover the latest insights in AI-powered cooking, nutrition science, and dietary adaptation
            </p>
          </div>
        </div>

        {/* Tag Filter */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by topic:</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedTag === null 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Posts
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center ${
                  selectedTag === tag
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:scale-[1.02] group">
              <Link to={`/blog/${post.id}`} className="block">
                <div className="h-48 bg-gradient-to-br from-green-100 to-blue-100 relative overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center">
                    <ChefHat className="w-16 h-16 text-green-600 opacity-50" />
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatDate(post.date)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        +{post.tags.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="text-green-600 font-medium group-hover:text-green-700 transition-colors flex items-center">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Stay Updated</h2>
          <p className="text-gray-600 mb-6">
            Get the latest recipes, nutrition tips, and AI cooking insights delivered to your inbox.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Subscribe
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Blog;