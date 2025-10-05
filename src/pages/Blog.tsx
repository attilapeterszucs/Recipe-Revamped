import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50/30 to-white pt-20">
          <AuthAwareNavigation />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse space-y-8">
              <div className="space-y-4">
                <div className="h-8 bg-green-200 rounded-full w-32" />
                <div className="h-4 bg-green-200 rounded w-24" />
                <div className="h-12 bg-gray-200 rounded w-3/4" />
                <div className="h-6 bg-gray-200 rounded w-full" />
                <div className="h-6 bg-gray-200 rounded w-5/6" />
              </div>
              <div className="h-96 bg-gradient-to-br from-green-200 via-emerald-200 to-blue-200 rounded-2xl" />
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!post) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50/30 to-white pt-20">
          <AuthAwareNavigation />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-green-100 text-green-600 mb-6">
                <ChefHat className="w-10 h-10" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Article Not Found</h1>
              <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">The blog post you're looking for doesn't exist or has been removed.</p>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/30"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50/30 to-white pt-20">
        <AuthAwareNavigation />

        {/* Hero Header with Landing Page Design */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 -z-10">
            <div className="absolute top-0 -left-4 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 animate-in fade-in duration-500">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-green-200 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="flex items-center gap-2 text-green-600 text-sm font-bold mb-4 uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              {formatDate(post.publishedAt)}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] mb-8 tracking-tight">
              {post.title}
            </h1>

            <div className="text-xl sm:text-2xl text-gray-600 leading-relaxed mb-8 font-normal max-w-4xl">
              {post.excerpt}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center text-gray-600 text-sm font-semibold">
                <Clock className="w-4 h-4 mr-2 text-green-600" />
                <span>{post.readTime || '5 min read'}</span>
              </div>
            </div>
          </div>

          {post.featuredImage && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 animate-in fade-in duration-700 delay-300">
              <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-green-200">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Apple-style Content */}
        <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h1:text-3xl prose-h1:leading-tight prose-h1:mb-8 prose-h2:text-2xl prose-h2:leading-tight prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-xl prose-h3:leading-tight prose-h3:mt-8 prose-h3:mb-4 prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg prose-strong:text-gray-900 prose-ul:my-6 prose-li:text-gray-600 prose-li:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-6 prose-blockquote:text-gray-600 prose-blockquote:font-normal prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm">
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatBlogContent(post.content, post.id), {
              ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'],
              ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class']
            }) }} />
          </div>

          {/* Footer with Share Button */}
          <div className="border-t-2 border-green-100 mt-16 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
                <Calendar className="w-4 h-4 text-green-600" />
                Published {formatDate(post.publishedAt)}
              </div>
              <button
                onClick={() => handleShare(post)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/30"
              >
                <Share2 className="w-4 h-4" />
                Share Article
              </button>
            </div>
          </div>
        </article>

        {/* Related Articles with Landing Page Design */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="border-t-2 border-green-100 pt-16">
            <h2 className="text-3xl font-black text-gray-900 mb-12 tracking-tight">Related Articles</h2>

            <div className="grid md:grid-cols-2 gap-8">
              {blogPosts
                .filter(p => p.id !== post.id && p.tags.some(tag => post.tags.includes(tag)))
                .slice(0, 2)
                .map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    to={`/blog/${relatedPost.id}`}
                    className="group block h-full"
                  >
                    <div className="bg-white rounded-2xl border-2 border-gray-200 hover:border-green-400 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105 h-full flex flex-col">
                      <div className="relative h-48 bg-gradient-to-br from-green-400 via-emerald-400 to-blue-500 overflow-hidden flex-shrink-0">
                        {relatedPost.featuredImage ? (
                          <img
                            src={relatedPost.featuredImage}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ChefHat className="w-12 h-12 text-white opacity-80" />
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 text-xs text-green-600 font-bold uppercase tracking-wide mb-3">
                          <Calendar className="w-3 h-3" />
                          {formatDate(relatedPost.publishedAt || relatedPost.createdAt)}
                        </div>

                        <h3 className="text-xl lg:text-2xl font-black text-gray-900 mb-3 leading-tight group-hover:text-green-600 transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>

                        <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2 flex-grow">
                          {relatedPost.excerpt}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center text-gray-500 text-sm font-semibold">
                            <Clock className="w-4 h-4 mr-2 text-green-600" />
                            <span>{relatedPost.readTime || '5 min read'}</span>
                          </div>
                          <ArrowRight className="w-5 h-5 text-green-600 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50/30 to-white pt-20">
      {/* Header */}
      <AuthAwareNavigation />

      {/* Hero Header with Landing Page Design */}
      <div className="relative overflow-hidden">
        {/* Gradient Background Blobs */}
        <div className="absolute inset-0 opacity-30 -z-10">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm">
            <ChefHat className="w-4 h-4" />
            Recipe Revamped Blog
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
            Cooking
            <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Insights & Tips
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl">
            The latest on AI-powered cooking, nutrition science, and dietary adaptation.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* Filter Tags with Landing Page Design */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${
                selectedTag === null
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-105'
                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-500 hover:bg-green-50 hover:text-green-600 shadow-md hover:shadow-lg'
              }`}
            >
              All Posts
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${
                  selectedTag === tag
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-105'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-500 hover:bg-green-50 hover:text-green-600 shadow-md hover:shadow-lg'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
                  <div className="h-48 lg:h-56 bg-gradient-to-br from-green-200 via-emerald-200 to-blue-200" />
                  <div className="p-6">
                    <div className="h-4 bg-green-200 rounded w-24 mb-3" />
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-5/6 mb-4" />
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-green-100 rounded-full w-16" />
                      <div className="h-6 bg-green-100 rounded-full w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-200 rounded w-20" />
                      <div className="h-5 w-5 bg-green-200 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl border-2 border-red-200 shadow-lg p-8 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 text-red-600 mb-4">
                <ChefHat className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Oops! Something went wrong</h3>
              <p className="text-red-600 mb-6 font-semibold">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/30"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl border-2 border-green-200 shadow-lg p-8 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 text-green-600 mb-4">
                <ChefHat className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No Articles Found</h3>
              <p className="text-gray-600 mb-6">
                {selectedTag ? `No posts found for "${selectedTag}"` : 'Check back later for new content!'}
              </p>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/30"
                >
                  Show All Posts
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            {filteredPosts.map((post, index) => (
              <article
                key={post.id}
                className="group animate-in fade-in slide-in-from-bottom-4 duration-500 h-full"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <Link to={`/blog/${post.id}`} className="block h-full">
                  <div className="bg-white rounded-2xl border-2 border-gray-200 hover:border-green-400 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105 h-full flex flex-col">
                    <div className="relative h-48 lg:h-56 bg-gradient-to-br from-green-400 via-emerald-400 to-blue-500 overflow-hidden flex-shrink-0">
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ChefHat className="w-12 h-12 text-white opacity-80" />
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-2 text-xs text-green-600 font-bold uppercase tracking-wide mb-3">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.publishedAt)}
                      </div>

                      <h2 className="text-xl lg:text-2xl font-black text-gray-900 mb-3 leading-tight group-hover:text-green-600 transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3 flex-grow">
                        {post.excerpt}
                      </p>

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                          {post.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center text-gray-500 text-sm font-semibold">
                          <Clock className="w-4 h-4 mr-2 text-green-600" />
                          <span>{post.readTime || '5 min read'}</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-green-600 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
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