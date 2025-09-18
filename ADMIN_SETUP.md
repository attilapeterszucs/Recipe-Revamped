# Admin Blog Management Setup

## 🔑 Admin Token Configuration

To use the blog management features, you need to configure an admin token.

### **Step 1: Generate Admin Token**

Generate a secure token using one of these methods:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Online generator (use a secure one like 1Password)
```

### **Step 2: Configure Token**

#### **Method A: Environment Variable (Recommended)**
Add to your `.env` file:
```env
VITE_ADMIN_TOKEN=your_generated_token_here
```

#### **Method B: Local Storage (For Testing)**
In your browser console, run:
```javascript
localStorage.setItem('admin_token', 'your_generated_token_here');
```

### **Step 3: Set Token in Cloud Service**

The same token must be configured in your blog service deployment:

```bash
# When deploying the blog service, include the token
gcloud run deploy reciperevamped-blog-assets \
  --source ./cloud-services/blog-service \
  --region us-central1 \
  --set-env-vars="ADMIN_TOKEN=your_generated_token_here"
```

## 📝 Using Blog Management

### **Access Admin Panel**
1. Log in to RecipeRevamped
2. Go to Settings
3. Admin section will appear if you have admin privileges
4. Click on "Blog Management" tab

### **Available Features**
- ✅ Create new blog posts with rich markdown editor
- ✅ Edit existing posts
- ✅ Delete posts
- ✅ Upload and optimize images
- ✅ Manage categories and tags
- ✅ Set featured posts
- ✅ Draft/publish workflow
- ✅ SEO optimization (meta titles, descriptions)
- ✅ Search and filter posts
- ✅ Mobile-responsive interface

### **Blog Post Editor**
- **Markdown Support**: Full markdown syntax for rich content
- **Image Upload**: Drag & drop or URL-based images
- **SEO Fields**: Custom meta titles and descriptions
- **Categories**: Organize posts by topic
- **Tags**: Add searchable keywords
- **Status**: Draft or published workflow
- **Featured**: Highlight important posts

## 🌐 Blog Service Endpoints

Your blog service is available at:
```
https://reciperevamped-blog-assets-428797186446.us-central1.run.app
```

### **Public Endpoints** (No auth required)
- `GET /api/blog/posts` - List published posts
- `GET /api/blog/posts/:slug` - Get single post
- `GET /api/blog/search` - Search posts
- `GET /api/blog/rss` - RSS feed
- `GET /api/blog/sitemap` - XML sitemap

### **Admin Endpoints** (Auth required)
- `POST /api/blog/posts` - Create post
- `PUT /api/blog/posts/:id` - Update post
- `DELETE /api/blog/posts/:id` - Delete post
- `POST /api/blog/upload` - Upload images

## 🔧 Troubleshooting

### **"Authentication required" error**
- Check that your admin token is correctly set
- Verify the token matches between frontend and backend
- Clear browser cache and try again

### **"Failed to load posts" error**
- Verify blog service is running
- Check network connectivity
- Confirm service URL is correct

### **Image upload fails**
- Check file size (max 10MB)
- Verify image format (JPEG, PNG, WebP)
- Ensure admin token is valid

## 🚀 Next Steps

1. **Set up admin token** using the steps above
2. **Create your first blog post** about AI recipe conversion
3. **Test the public blog** by visiting `/blog` on your site
4. **Monitor analytics** through the admin panel

The blog management system is now integrated into your RecipeRevamped admin panel!