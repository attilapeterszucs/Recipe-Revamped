import React, { useEffect, useState } from 'react';
import { Calendar, Clock, ArrowRight, Tag, ChefHat, ArrowLeft, Share2 } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { SEOHead } from '../components/SEOHead';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  featured: boolean;
  featuredImage?: string;
  readTime?: string;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  author: string;
  authorId: string;
}

// This will be replaced with Firestore data

// Images for blog posts content
const blogImages: Record<string, string[]> = {};

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

const addStructuredData = (post?: BlogPost, posts: BlogPost[] = []) => {
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
      "image": post.featuredImage,
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
      "datePublished": post.publishedAt,
      "dateModified": post.updatedAt,
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
      "blogPost": posts.map(post => ({
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt,
        "image": post.featuredImage,
        "author": {
          "@type": "Organization",
          "name": "Recipe Revamped"
        },
        "datePublished": post.publishedAt,
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

  const handleShare = async (post: BlogPost) => {
    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        // Use native Web Share API on mobile devices
        await navigator.share(shareData);
      } else {
        // Fallback to copying URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      // Fallback to copying URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (clipboardError) {
        // Final fallback - show URL in a prompt for manual copying
        prompt('Copy this link to share:', window.location.href);
      }
    }
  };
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allTags = Array.from(new Set(blogPosts.flatMap(post => post.tags)));

  const filteredPosts = selectedTag
    ? blogPosts.filter(post => post.tags.includes(selectedTag))
    : blogPosts;

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const postsRef = collection(db, 'blog_posts');
      const q = query(
        postsRef,
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];

      setBlogPosts(postsData);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      setError('Failed to load blog posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Timestamp | Date | string) => {
    let dateObj: Date;

    if (date instanceof Timestamp) {
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateReadTime = (content: string): string => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, []);

  // SEO updates for individual posts or blog listing
  useEffect(() => {
    if (blogId) {
      const post = blogPosts.find(p => p.id === blogId || p.slug === blogId);
      if (post) {
        updateMetaTags(
          `${post.seoTitle || post.title} | Recipe Revamped Blog`,
          post.seoDescription || post.excerpt,
          post.tags.join(', ') + ', recipe conversion, AI cooking, healthy eating',
          post.featuredImage
        );
        addStructuredData(post);
      }
    } else {
      updateMetaTags(
        'Recipe Revamped Blog | AI-Powered Cooking Insights & Recipe Conversion Tips',
        'Discover expert insights on AI-powered recipe conversion, dietary adaptation, and healthy cooking. Learn from nutrition specialists about keto, food allergies, and smart recipe modification.',
        'AI recipe conversion, smart cooking, dietary adaptation, keto recipes, food allergy cooking, recipe modification, healthy eating, nutrition tips, cooking technology'
      );
      addStructuredData(undefined, blogPosts);
    }
  }, [blogId, blogPosts]);

  // If blogId is provided, show individual blog post
  if (blogId) {
    const post = blogPosts.find(p => p.id === blogId || p.slug === blogId);

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50">
          <AuthAwareNavigation />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Loading blog post...</span>
            </div>
          </div>
        </div>
      );
    }

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
      <div className="min-h-screen bg-white">
        <AuthAwareNavigation />
        
        {/* Apple Newsroom Style Header */}
        <div className="bg-white">
          {/* Navigation Breadcrumb */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
            <Link
              to="/blog"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Newsroom
            </Link>
          </div>

          {/* Article Header */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            {/* Publication Date */}
            <div className="text-gray-500 text-sm font-medium mb-4 uppercase tracking-wider">
              {formatDate(post.publishedAt)}
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] mb-8 tracking-tight">
              {post.title}
            </h1>

            {/* Subtitle/Excerpt */}
            <div className="text-xl sm:text-2xl text-gray-600 leading-relaxed mb-8 font-normal max-w-4xl">
              {post.excerpt}
            </div>

            {/* Reading Time */}
            <div className="flex items-center text-gray-500 text-sm">
              <Clock className="w-4 h-4 mr-2" />
              <span>{post.readTime || '5 min read'}</span>
            </div>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-auto object-cover rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Apple-style Content */}
        <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h1:text-3xl prose-h1:leading-tight prose-h1:mb-8 prose-h2:text-2xl prose-h2:leading-tight prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-xl prose-h3:leading-tight prose-h3:mt-8 prose-h3:mb-4 prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg prose-strong:text-gray-900 prose-ul:my-6 prose-li:text-gray-600 prose-li:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-6 prose-blockquote:text-gray-600 prose-blockquote:font-normal prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm">
            <div dangerouslySetInnerHTML={{ __html: formatBlogContent(post.content, post.id) }} />
          </div>

          {/* Apple-style Footer */}
          <div className="border-t border-gray-200 mt-16 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-500">
                Published {formatDate(post.publishedAt)}
              </div>
              <button
                onClick={() => handleShare(post)}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </article>

        {/* Related Articles - Apple Style */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="border-t border-gray-200 pt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 tracking-tight">Related Articles</h2>

            <div className="grid md:grid-cols-2 gap-12">
              {blogPosts
                .filter(p => p.id !== post.id && p.tags.some(tag => post.tags.includes(tag)))
                .slice(0, 2)
                .map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    to={`/blog/${relatedPost.id}`}
                    className="group block hover:opacity-75 transition-opacity duration-200"
                  >
                    {relatedPost.featuredImage && (
                      <div className="mb-6">
                        <img
                          src={relatedPost.featuredImage}
                          alt={relatedPost.title}
                          className="w-full h-64 object-cover"
                        />
                      </div>
                    )}

                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">
                      {formatDate(relatedPost.publishedAt || relatedPost.createdAt)}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                      {relatedPost.title}
                    </h3>

                    <p className="text-gray-600 leading-relaxed mb-4">
                      {relatedPost.excerpt}
                    </p>

                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{relatedPost.readTime || '5 min read'}</span>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <AuthAwareNavigation />

      {/* Apple Newsroom Style Header */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
            Newsroom
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl">
            The latest on AI-powered cooking, nutrition science, and dietary adaptation.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* Apple-style Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-6">
            <button
              onClick={() => setSelectedTag(null)}
              className={`text-lg font-medium transition-colors ${
                selectedTag === null
                  ? 'text-gray-900 border-b-2 border-blue-600 pb-1'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-lg font-medium transition-colors ${
                  selectedTag === tag
                    ? 'text-gray-900 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading blog posts...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
              <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No blog posts found</p>
              <p className="text-gray-500 text-sm">
                {selectedTag ? `No posts found for "${selectedTag}"` : 'Check back later for new content!'}
              </p>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Show All Posts
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {filteredPosts.map((post) => (
              <article key={post.id} className="group">
                <Link to={`/blog/${post.id}`} className="block hover:opacity-75 transition-opacity duration-200">
                  {post.featuredImage && (
                    <div className="mb-4">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-48 lg:h-56 object-cover"
                      />
                    </div>
                  )}

                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">
                    {formatDate(post.publishedAt)}
                  </div>

                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 leading-tight">
                    {post.title}
                  </h2>

                  <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center text-gray-500 text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{post.readTime || '5 min read'}</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}


      </div>
    </div>
  );
};

export default Blog;