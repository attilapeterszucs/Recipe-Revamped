const functions = require('@google-cloud/functions-framework');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');
const RSS = require('rss');
const { marked } = require('marked');
const DOMPurify = require('isomorphic-dompurify');

const app = express();
const firestore = new Firestore();
const storage = new Storage();
const bucket = storage.bucket(process.env.STORAGE_BUCKET || 'reciperevamped-blog-assets');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: [
    'https://reciperevamped.com',
    'https://www.reciperevamped.com',
    'https://reciperevamped.netlify.app',
    'http://localhost:5173'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { error: 'Too many requests from this IP' }
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: { error: 'Rate limit exceeded for content operations' }
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Collections
const BLOG_POSTS_COLLECTION = 'blog_posts';
const BLOG_CATEGORIES_COLLECTION = 'blog_categories';
const BLOG_ANALYTICS_COLLECTION = 'blog_analytics';

// Helper functions
const validateBlogPost = (post) => {
  const required = ['title', 'content', 'excerpt', 'category'];
  const missing = required.filter(field => !post[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  if (post.title.length > 200) {
    throw new Error('Title must be less than 200 characters');
  }

  if (post.excerpt.length > 300) {
    throw new Error('Excerpt must be less than 300 characters');
  }

  return true;
};

const sanitizeContent = (content) => {
  const html = marked(content);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel']
  });
};

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Authentication middleware
const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const idToken = authHeader.split(' ')[1];

    // Verify Firebase ID token
    const admin = require('firebase-admin');

    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.GOOGLE_CLOUD_PROJECT
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    // Check if user is admin - you can customize this logic
    const adminEmails = [
      'attilaszucs2002@gmail.com',
      'admin@reciperevamped.com',
      'tech@reciperevamped.com'
    ];

    if (!adminEmails.includes(email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'blog-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all blog posts with pagination and filtering
app.get('/api/blog/posts', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      featured,
      status = 'published'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = firestore.collection(BLOG_POSTS_COLLECTION)
      .where('status', '==', status)
      .orderBy('publishedAt', 'desc');

    if (category) {
      query = query.where('category', '==', category);
    }

    if (featured === 'true') {
      query = query.where('featured', '==', true);
    }

    const snapshot = await query.get();
    let posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      publishedAt: doc.data().publishedAt?.toDate?.() || doc.data().publishedAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    }));

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    const total = posts.length;
    const paginatedPosts = posts.slice(offset, offset + limitNum);

    res.json({
      posts: paginatedPosts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Get single blog post by slug
app.get('/api/blog/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const snapshot = await firestore.collection(BLOG_POSTS_COLLECTION)
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const doc = snapshot.docs[0];
    const post = {
      id: doc.id,
      ...doc.data(),
      publishedAt: doc.data().publishedAt?.toDate?.() || doc.data().publishedAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    };

    // Increment view count
    await firestore.collection(BLOG_ANALYTICS_COLLECTION).add({
      postId: doc.id,
      action: 'view',
      timestamp: new Date(),
      ip: req.ip
    });

    // Get related posts
    const relatedSnapshot = await firestore.collection(BLOG_POSTS_COLLECTION)
      .where('category', '==', post.category)
      .where('status', '==', 'published')
      .where('slug', '!=', slug)
      .limit(3)
      .get();

    const relatedPosts = relatedSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      slug: doc.data().slug,
      excerpt: doc.data().excerpt,
      featuredImage: doc.data().featuredImage,
      publishedAt: doc.data().publishedAt?.toDate?.() || doc.data().publishedAt
    }));

    res.json({ post, relatedPosts });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// Create blog post (admin only)
app.post('/api/blog/posts', strictLimiter, verifyAuth, async (req, res) => {
  try {
    const postData = req.body;
    validateBlogPost(postData);

    const slug = generateSlug(postData.title);

    // Check if slug already exists
    const existingSlug = await firestore.collection(BLOG_POSTS_COLLECTION)
      .where('slug', '==', slug)
      .get();

    if (!existingSlug.empty) {
      return res.status(409).json({ error: 'A post with this title already exists' });
    }

    const now = new Date();
    const blogPost = {
      ...postData,
      slug,
      content: sanitizeContent(postData.content),
      status: postData.status || 'draft',
      featured: postData.featured || false,
      tags: postData.tags || [],
      seoTitle: postData.seoTitle || postData.title,
      seoDescription: postData.seoDescription || postData.excerpt,
      publishedAt: postData.status === 'published' ? now : null,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await firestore.collection(BLOG_POSTS_COLLECTION).add(blogPost);

    res.status(201).json({
      message: 'Blog post created successfully',
      id: docRef.id,
      slug: slug
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(400).json({ error: error.message || 'Failed to create blog post' });
  }
});

// Update blog post (admin only)
app.put('/api/blog/posts/:id', strictLimiter, verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const docRef = firestore.collection(BLOG_POSTS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const existingData = doc.data();
    let updatedData = {
      ...updateData,
      updatedAt: new Date()
    };

    // Update slug if title changed
    if (updateData.title && updateData.title !== existingData.title) {
      updatedData.slug = generateSlug(updateData.title);
    }

    // Sanitize content if provided
    if (updateData.content) {
      updatedData.content = sanitizeContent(updateData.content);
    }

    // Set publishedAt if status changes to published
    if (updateData.status === 'published' && existingData.status !== 'published') {
      updatedData.publishedAt = new Date();
    }

    await docRef.update(updatedData);

    res.json({ message: 'Blog post updated successfully' });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// Delete blog post (admin only)
app.delete('/api/blog/posts/:id', strictLimiter, verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = firestore.collection(BLOG_POSTS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    await docRef.delete();

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// Search blog posts
app.get('/api/blog/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchLower = q.toLowerCase();
    const limitNum = parseInt(limit, 10);

    const snapshot = await firestore.collection(BLOG_POSTS_COLLECTION)
      .where('status', '==', 'published')
      .get();

    const results = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate?.() || doc.data().publishedAt
      }))
      .filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limitNum)
      .map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        category: post.category,
        featuredImage: post.featuredImage,
        publishedAt: post.publishedAt
      }));

    res.json({ results, count: results.length });
  } catch (error) {
    console.error('Error searching blog posts:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get blog categories
app.get('/api/blog/categories', async (req, res) => {
  try {
    const snapshot = await firestore.collection(BLOG_CATEGORIES_COLLECTION)
      .orderBy('name')
      .get();

    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Generate RSS feed
app.get('/api/blog/rss', async (req, res) => {
  try {
    const snapshot = await firestore.collection(BLOG_POSTS_COLLECTION)
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(20)
      .get();

    const feed = new RSS({
      title: 'RecipeRevamped Blog',
      description: 'AI-powered recipe transformation tips, cooking advice, and healthy eating guides',
      feed_url: 'https://reciperevamped.com/api/blog/rss',
      site_url: 'https://reciperevamped.com',
      managingEditor: 'blog@reciperevamped.com',
      webMaster: 'tech@reciperevamped.com',
      copyright: `© ${new Date().getFullYear()} RecipeRevamped`,
      language: 'en-US',
      pubDate: new Date().toUTCString(),
      ttl: 60
    });

    snapshot.docs.forEach(doc => {
      const post = doc.data();
      feed.item({
        title: post.title,
        description: post.excerpt,
        url: `https://reciperevamped.com/blog/${post.slug}`,
        author: post.author || 'RecipeRevamped Team',
        date: post.publishedAt?.toDate?.() || post.publishedAt,
        categories: [post.category, ...(post.tags || [])]
      });
    });

    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.xml());
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
});

// Generate sitemap
app.get('/api/blog/sitemap', async (req, res) => {
  try {
    const snapshot = await firestore.collection(BLOG_POSTS_COLLECTION)
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .get();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add blog index page
    sitemap += `
  <url>
    <loc>https://reciperevamped.com/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Add individual blog posts
    snapshot.docs.forEach(doc => {
      const post = doc.data();
      const lastmod = post.updatedAt?.toDate?.() || post.publishedAt?.toDate?.() || new Date();

      sitemap += `
  <url>
    <loc>https://reciperevamped.com/blog/${post.slug}</loc>
    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    sitemap += '\n</urlset>';

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
});

// Upload and optimize images
app.post('/api/blog/upload', strictLimiter, verifyAuth, async (req, res) => {
  try {
    const { image, filename } = req.body;

    if (!image || !filename) {
      return res.status(400).json({ error: 'Image data and filename required' });
    }

    // Decode base64 image
    const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const ext = filename.split('.').pop();
    const uniqueFilename = `blog-images/${timestamp}-${filename}`;

    // Optimize image with Sharp
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Upload to Google Cloud Storage
    const file = bucket.file(uniqueFilename);
    await file.save(optimizedBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });

    // Make file publicly accessible
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFilename}`;

    res.json({
      message: 'Image uploaded successfully',
      url: publicUrl,
      filename: uniqueFilename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get blog analytics
app.get('/api/blog/analytics', verifyAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const snapshot = await firestore.collection(BLOG_ANALYTICS_COLLECTION)
      .where('timestamp', '>=', startDate)
      .get();

    const analytics = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const postId = data.postId;

      if (!analytics[postId]) {
        analytics[postId] = { views: 0 };
      }

      if (data.action === 'view') {
        analytics[postId].views++;
      }
    });

    // Get post titles
    const postsSnapshot = await firestore.collection(BLOG_POSTS_COLLECTION).get();
    const posts = {};
    postsSnapshot.docs.forEach(doc => {
      posts[doc.id] = {
        title: doc.data().title,
        slug: doc.data().slug
      };
    });

    const result = Object.entries(analytics).map(([postId, data]) => ({
      postId,
      title: posts[postId]?.title || 'Unknown',
      slug: posts[postId]?.slug || 'unknown',
      ...data
    })).sort((a, b) => b.views - a.views);

    res.json({ analytics: result, period: daysNum });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Register the function for Cloud Functions
functions.http('reciperevamped-blog-assets', app);

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Blog service running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;