import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Calendar,
  Save,
  X,
  Upload,
  FileText,
  Star,
  Type
} from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';
import { EnhancedRichTextEditor } from './EnhancedRichTextEditor';
import { useToast } from './ToastContainer';
import { useAuth } from '../hooks/useAuth';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { logger } from '../lib/logger';

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
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  author: string;
  authorId: string;
}

interface BlogCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface AdminBlogManagementProps {
  adminUserId: string;
  adminEmail: string;
}

export const AdminBlogManagement: React.FC<AdminBlogManagementProps> = ({
  adminUserId,
  adminEmail
}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRichEditor, setShowRichEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Form state for blog post editor
  const [postForm, setPostForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published',
    featured: false,
    featuredImage: '',
    seoTitle: '',
    seoDescription: ''
  });

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);

      if (!user) {
        setPosts([]);
        return;
      }

      const postsRef = collection(db, 'blog_posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];

      setPosts(postsData);
    } catch (error) {
      logger.error('Error loading posts:', { error });
      showError(`Failed to load blog posts: ${error.message}`);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  const loadCategories = useCallback(async () => {
    // Use predefined categories - no Firestore dependency required
    const defaultCategories = [
      { id: '1', name: 'AI & Technology', description: 'AI recipe generation', color: 'blue' },
      { id: '2', name: 'Cooking Tips', description: 'General cooking advice', color: 'green' },
      { id: '3', name: 'Dietary Guides', description: 'Diet-specific content', color: 'purple' },
      { id: '4', name: 'Health & Nutrition', description: 'Health-focused recipes', color: 'pink' },
      { id: '5', name: 'Recipe Transformations', description: 'Recipe conversion examples', color: 'orange' }
    ];
    setCategories(defaultCategories);
  }, []);

  useEffect(() => {
    loadPosts();
    loadCategories();
  }, [loadPosts, loadCategories]);

  const handleCreatePost = () => {
    setEditingPost(null);
    setPostForm({
      title: '',
      excerpt: '',
      content: '',
      category: categories[0]?.name || '',
      tags: [],
      status: 'draft',
      featured: false,
      featuredImage: '',
      seoTitle: '',
      seoDescription: ''
    });
    setShowEditor(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: post.tags,
      status: post.status,
      featured: post.featured,
      featuredImage: post.featuredImage || '',
      seoTitle: post.seoTitle || post.title,
      seoDescription: post.seoDescription || post.excerpt
    });
    setShowEditor(true);
  };

  const handleSavePost = async () => {
    try {
      setSaving(true);

      if (!user) {
        showError('Authentication required. Please sign in again.');
        return;
      }

      const slug = generateSlug(postForm.title);
      const now = serverTimestamp();

      const postData = {
        title: postForm.title,
        slug,
        excerpt: postForm.excerpt,
        content: postForm.content,
        category: postForm.category,
        tags: postForm.tags,
        status: postForm.status,
        featured: postForm.featured,
        featuredImage: postForm.featuredImage,
        seoTitle: postForm.seoTitle || postForm.title,
        seoDescription: postForm.seoDescription || postForm.excerpt,
        author: adminEmail,
        authorId: adminUserId,
        updatedAt: now,
        ...(postForm.status === 'published' && { publishedAt: now }),
        ...(!editingPost && { createdAt: now })
      };

      if (editingPost) {
        const postRef = doc(db, 'blog_posts', editingPost.id);
        await updateDoc(postRef, postData);
        showSuccess('Post updated successfully!');
      } else {
        await addDoc(collection(db, 'blog_posts'), postData);
        showSuccess('Post created successfully!');
      }

      setShowEditor(false);
      loadPosts();
    } catch (error) {
      logger.error('Error saving post:', { error });
      showError(`Failed to save post: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = (post: BlogPost) => {
    setPostToDelete(post);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      if (!user) {
        showError('Authentication required. Please sign in again.');
        return;
      }

      const postRef = doc(db, 'blog_posts', postToDelete.id);
      await deleteDoc(postRef);

      showSuccess('Post deleted successfully!');
      loadPosts();
      setShowDeleteConfirm(false);
      setPostToDelete(null);
    } catch (error) {
      logger.error('Error deleting post:', { error });
      showError('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPostToDelete(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      if (!user) {
        showError('Authentication required. Please sign in again.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image file must be smaller than 5MB.');
        return;
      }

      // Create a unique filename
      const timestamp = Date.now();
      const filename = `blog-images/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, filename);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      setPostForm(prev => ({ ...prev, featuredImage: downloadURL }));
      showSuccess('Image uploaded successfully!');
    } catch (error) {
      logger.error('Error uploading image:', { error });
      showError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const inputValue = e.currentTarget.value.trim();

      if (inputValue) {
        // Handle multiple formats: 'text', 'text, text', 'text,text'
        const tags = inputValue
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0 && !postForm.tags.includes(tag));

        if (tags.length > 0) {
          setPostForm(prev => ({ ...prev, tags: [...prev.tags, ...tags] }));
        }
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPostForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading blog posts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Blog Management</h2>
              <p className="text-green-700 font-medium">Create and manage blog posts for RecipeRevamped</p>
            </div>
          </div>
          <button
            onClick={handleCreatePost}
            className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Post
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-700 font-bold uppercase tracking-wide">Total Posts</p>
                <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {posts.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-md">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-700 font-bold uppercase tracking-wide">Published</p>
                <p className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {posts.filter(p => p.status === 'published').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-amber-50/50 border-2 border-yellow-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl flex items-center justify-center shadow-md">
                <EyeOff className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-yellow-700 font-bold uppercase tracking-wide">Drafts</p>
                <p className="text-3xl font-black bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                  {posts.filter(p => p.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Row */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 p-6 rounded-2xl border-2 border-indigo-200 shadow-lg">
          <div className="space-y-5">
            {/* Search - Full Width */}
            <div>
              <label className="block text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                Search Posts
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium bg-white shadow-sm"
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-3">
                  Filter by Category
                </label>
                <CustomDropdown
                  value={selectedCategory}
                  onChange={(value) => setSelectedCategory(value)}
                  options={[
                    { value: 'all', label: 'All Categories', icon: '📁' },
                    ...categories.map(category => ({
                      value: category.name,
                      label: category.name,
                      icon: category.color === 'blue' ? '🔵' : category.color === 'green' ? '🟢' : category.color === 'purple' ? '🟣' : category.color === 'pink' ? '🩷' : '🟠'
                    }))
                  ]}
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-3">
                  Filter by Status
                </label>
                <CustomDropdown
                  value={selectedStatus}
                  onChange={(value) => setSelectedStatus(value)}
                  options={[
                    { value: 'all', label: 'All Status', icon: '📋' },
                    { value: 'published', label: 'Published', icon: '✅' },
                    { value: 'draft', label: 'Draft', icon: '📝' }
                  ]}
                />
              </div>

              {/* Results Count */}
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-3">
                  Results
                </label>
                <div className="bg-white border-2 border-indigo-300 rounded-xl px-4 text-center shadow-sm h-[46px] sm:h-[50px] flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <p className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-none">
                      {filteredPosts.length}
                    </p>
                    <p className="text-sm text-indigo-700 font-medium">
                      {filteredPosts.length === 1 ? 'post' : 'posts'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-black text-gray-900">
            Blog Posts
            <span className="ml-2 text-sm font-medium text-gray-500">({filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'})</span>
          </h3>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4 shadow-md">
              <FileText className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">No blog posts found</h3>
            <p className="text-sm text-gray-600 font-medium mb-6 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Get started by creating your first blog post to share with your audience.'
              }
            </p>
            <button
              onClick={handleCreatePost}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white border-2 border-gray-200 rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:border-blue-300"
              >
                <div className="flex flex-col lg:flex-row gap-5">
                  {/* Left Side: Image and Content */}
                  <div className="flex-1 flex gap-4">
                    {/* Featured Image */}
                    {post.featuredImage && (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover flex-shrink-0 border-2 border-gray-200 shadow-md"
                      />
                    )}

                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title with Featured Star */}
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-black text-gray-900 line-clamp-2 flex-1" title={post.title}>
                          {post.title}
                        </h3>
                        {post.featured && (
                          <Star className="w-6 h-6 text-yellow-500 fill-current flex-shrink-0" />
                        )}
                      </div>

                      {/* Excerpt */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3 font-medium" title={post.excerpt}>
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200 shadow-sm"
                              title={tag}
                            >
                              {tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                              +{post.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Meta Info and Actions */}
                  <div className="flex lg:flex-col justify-between lg:justify-start gap-4 lg:min-w-[200px]">
                    {/* Meta Information */}
                    <div className="flex flex-wrap lg:flex-col gap-3">
                      {/* Category */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium lg:hidden">Category:</span>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 shadow-sm">
                          {post.category}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium lg:hidden">Status:</span>
                        {post.status === 'published' ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
                            <Eye className="w-4 h-4 mr-1.5" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 border-2 border-gray-300">
                            <EyeOff className="w-4 h-4 mr-1.5" />
                            Draft
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">
                          {post.publishedAt
                            ? (post.publishedAt instanceof Timestamp
                               ? post.publishedAt.toDate().toLocaleDateString()
                               : new Date(post.publishedAt).toLocaleDateString())
                            : (post.createdAt instanceof Timestamp
                               ? post.createdAt.toDate().toLocaleDateString()
                               : new Date(post.createdAt).toLocaleDateString())
                          }
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex lg:flex-col gap-2 lg:mt-auto">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="flex-1 lg:w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md shadow-blue-500/30 hover:shadow-lg hover:scale-105 font-bold text-sm"
                        title="Edit post"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePost(post)}
                        className="flex-1 lg:w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-md shadow-red-500/30 hover:shadow-lg hover:scale-105 font-bold text-sm"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingPost ? 'Edit Post' : 'Create New Post'}
                </h3>
                <button
                  onClick={() => setShowEditor(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter post title..."
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt *
                </label>
                <textarea
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Brief description of the post..."
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content * (Rich Text Editor)
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        {postForm.content ? 'Content added' : 'No content added yet'}
                      </p>
                      {postForm.content && (
                        <p className="text-xs text-gray-500">
                          {postForm.content.length} characters
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRichEditor(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Type className="w-4 h-4 mr-2" />
                      Open Rich Text Editor
                    </button>
                  </div>
                  {postForm.content && (
                    <div className="mt-3 p-3 bg-white border rounded text-xs text-gray-600 max-h-20 overflow-hidden">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            postForm.content.length > 200
                              ? postForm.content.substring(0, 200) + '...'
                              : postForm.content,
                            {
                              ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                              ALLOWED_ATTR: []
                            }
                          )
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Category and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Category *
                  </label>
                  <CustomDropdown
                    value={postForm.category}
                    onChange={(value) => setPostForm(prev => ({ ...prev, category: value }))}
                    options={[
                      { value: '', label: 'Select category', icon: '📁' },
                      ...categories.map(category => ({
                        value: category.name,
                        label: category.name,
                        icon: category.color === 'blue' ? '🔵' : category.color === 'green' ? '🟢' : category.color === 'purple' ? '🟣' : category.color === 'pink' ? '🩷' : '🟠'
                      }))
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Status
                  </label>
                  <CustomDropdown
                    value={postForm.status}
                    onChange={(value) => setPostForm(prev => ({ ...prev, status: value as 'draft' | 'published' }))}
                    options={[
                      { value: 'draft', label: 'Draft', icon: '📝' },
                      { value: 'published', label: 'Published', icon: '✅' }
                    ]}
                  />
                </div>
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image
                </label>
                <div className="space-y-3">
                  {postForm.featuredImage && (
                    <div className="relative">
                      <img
                        src={postForm.featuredImage}
                        alt="Featured"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setPostForm(prev => ({ ...prev, featuredImage: '' }))}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="featured-image-upload"
                    />
                    <label
                      htmlFor="featured-image-upload"
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </label>
                    <input
                      type="url"
                      value={postForm.featuredImage}
                      onChange={(e) => setPostForm(prev => ({ ...prev, featuredImage: e.target.value }))}
                      placeholder="Or paste image URL..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="space-y-2">
                  {postForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {postForm.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    onKeyDown={handleTagInput}
                    placeholder="Type tags and press Enter (supports: 'tag' or 'tag1, tag2')..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={postForm.featured}
                  onChange={(e) => setPostForm(prev => ({ ...prev, featured: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                  Featured post (appears prominently on blog homepage)
                </label>
              </div>

              {/* SEO Section */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={postForm.seoTitle}
                      onChange={(e) => setPostForm(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder={postForm.title || "Will use post title if empty"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Description
                    </label>
                    <textarea
                      value={postForm.seoDescription}
                      onChange={(e) => setPostForm(prev => ({ ...prev, seoDescription: e.target.value }))}
                      rows={2}
                      placeholder={postForm.excerpt || "Will use excerpt if empty"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePost}
                disabled={saving || !postForm.title || !postForm.excerpt || !postForm.content || !postForm.category}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && postToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Blog Post
                </h3>
                <p className="text-gray-600 mb-2">
                  Are you sure you want to delete this blog post? This action cannot be undone.
                </p>
                <div className="bg-gray-50 rounded-lg p-3 mb-6">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    "{postToDelete.title}"
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {postToDelete.status === 'published' ? 'Published' : 'Draft'} • {postToDelete.category}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rich Text Editor Modal */}
      {showRichEditor && (
        <EnhancedRichTextEditor
          content={postForm.content}
          onSave={(content) => {
            setPostForm(prev => ({ ...prev, content }));
            setShowRichEditor(false);
          }}
          onCancel={() => setShowRichEditor(false)}
          onPreview={handlePreview}
        />
      )}

      {/* Post Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Blog Post Preview</h3>
                <p className="text-sm text-gray-600 mt-1">How your post will appear on the blog</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <article className="max-w-3xl mx-auto">
                {/* Post Header */}
                <header className="mb-8">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full">
                      {postForm.category}
                    </span>
                    {postForm.featured && (
                      <span className="inline-block ml-2 px-3 py-1 text-sm font-medium text-yellow-600 bg-yellow-100 rounded-full">
                        <Star className="w-3 h-3 inline mr-1" />
                        Featured
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {postForm.title || 'Untitled Post'}
                  </h1>

                  {postForm.excerpt && (
                    <p className="text-xl text-gray-600 leading-relaxed mb-6">
                      {postForm.excerpt}
                    </p>
                  )}

                  <div className="flex items-center text-sm text-gray-500 mb-6">
                    <Calendar className="w-4 h-4 mr-2" />
                    <time dateTime={new Date().toISOString()}>
                      {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                    <span className="mx-2">·</span>
                    <span>{postForm.status === 'published' ? 'Published' : 'Draft'}</span>
                  </div>

                  {postForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {postForm.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {postForm.featuredImage && (
                    <div className="mb-8">
                      <img
                        src={postForm.featuredImage}
                        alt={postForm.title}
                        className="w-full h-64 md:h-80 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </header>

                {/* Post Content */}
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      postForm.content || '<p>No content yet. Start writing in the editor!</p>',
                      {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'],
                        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class']
                      }
                    )
                  }}
                />
              </article>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};