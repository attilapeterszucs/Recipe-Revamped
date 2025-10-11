# Recipe Revamped - Complete UI/UX Design System Documentation

> **Last Updated:** January 2025
> **Version:** 1.0
> **Project:** Recipe Revamped - AI-Powered Recipe Conversion Platform

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Animation System](#animation-system)
5. [Component Library](#component-library)
6. [Page-by-Page Design Breakdown](#page-by-page-design-breakdown)
7. [Responsive Design Patterns](#responsive-design-patterns)
8. [Accessibility Features](#accessibility-features)
9. [Design Tokens](#design-tokens)

---

## Design Philosophy

Recipe Revamped follows a **modern, gradient-driven design philosophy** inspired by contemporary landing pages and Apple's design principles. The design emphasizes:

- **Vibrant Gradients**: Extensive use of green-to-emerald gradients for primary actions
- **Bold Typography**: Black font weights (900) for headlines with tight tracking
- **Smooth Animations**: Scroll-triggered animations and hover effects throughout
- **White Space**: Generous spacing for clarity and focus
- **Progressive Disclosure**: Collapsible sections and paginated interfaces
- **3D Card Effects**: Transform and shadow effects for depth
- **Mobile-First**: All components optimized for touch interfaces

---

## Color System

### Primary Colors

```css
/* Primary Green Palette */
--primary: 142.1 76.2% 36.3%;        /* #10b981 - Primary Green */
--green-50: #f0fdf4;
--green-100: #dcfce7;
--green-200: #bbf7d0;
--green-300: #86efac;
--green-400: #4ade80;
--green-500: #22c55e;
--green-600: #10b981;  /* Primary */
--green-700: #059669;
--green-800: #047857;
--green-900: #064e3b;
```

### Secondary Colors

```css
/* Emerald Palette (Used in gradients) */
--emerald-50: #ecfdf5;
--emerald-400: #34d399;
--emerald-500: #10b981;
--emerald-600: #059669;

/* Blue Palette (Accent) */
--blue-50: #eff6ff;
--blue-500: #3b82f6;
--blue-600: #2563eb;
--blue-700: #1d4ed8;

/* Purple Palette (Premium features) */
--purple-50: #faf5ff;
--purple-600: #9333ea;

/* Orange Palette (Alerts and tips) */
--orange-50: #fff7ed;
--orange-600: #ea580c;
```

### Semantic Colors

```css
/* Success */
--success: var(--green-600);

/* Error/Destructive */
--destructive: #ef4444;  /* Red-500 */

/* Warning */
--warning: #f59e0b;  /* Amber-500 */

/* Neutral Grays */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

### Gradient Patterns

```css
/* Primary Gradient (Most common) */
.gradient-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* Hero Gradient */
.gradient-hero {
  background: linear-gradient(to bottom, #f0fdf4, rgba(236, 253, 245, 0.3), white);
}

/* Card Gradient (Backgrounds) */
.gradient-card {
  background: linear-gradient(to bottom right, #f0fdf4, #eff6ff);
}

/* Image Placeholder Gradient */
.gradient-image {
  background: linear-gradient(135deg, #4ade80 0%, #34d399 50%, #3b82f6 100%);
}
```

---

## Typography

### Font Stack

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes (Tailwind Scale)

```
text-xs:    0.75rem  (12px)
text-sm:    0.875rem (14px)
text-base:  1rem     (16px)
text-lg:    1.125rem (18px)
text-xl:    1.25rem  (20px)
text-2xl:   1.5rem   (24px)
text-3xl:   1.875rem (30px)
text-4xl:   2.25rem  (36px)
text-5xl:   3rem     (48px)
text-6xl:   3.75rem  (60px)
text-7xl:   4.5rem   (72px)
```

### Font Weights

```
font-normal:  400
font-medium:  500
font-semibold: 600
font-bold:    700
font-black:   900  /* Used extensively for headlines */
```

### Typography Patterns

#### Hero Headlines
```tsx
<h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
  Cook Smarter
  <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
    Not Harder
  </span>
</h1>
```

#### Section Headers
```tsx
<h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6 tracking-tight">
  Features
</h2>
```

#### Body Text
```tsx
<p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
  Your recipe conversion text
</p>
```

---

## Animation System

### Keyframe Animations

#### Scroll Animations (src/index.css:84-110)

```css
/* Base scroll animation */
.scroll-animate {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1),
              transform 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.scroll-animate.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Scale variant */
.scroll-animate-scale {
  opacity: 0;
  transform: scale(0.92) translateY(30px);
  transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

.scroll-animate-scale.is-visible {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Slide from left */
.scroll-animate-slide-left {
  opacity: 0;
  transform: translateX(-50px);
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.scroll-animate-slide-left.is-visible {
  opacity: 1;
  transform: translateX(0);
}
```

#### Recipe Card Animations (src/index.css:112-142)

```css
@keyframes recipe-card-enter {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.92);
  }
  60% {
    opacity: 0.8;
    transform: translateY(-4px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.recipe-card-enter {
  animation: recipe-card-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* 3D Card Hover Effect */
.recipe-card-3d {
  transform-style: preserve-3d;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.recipe-card-3d:hover {
  transform: translateY(-12px) translateZ(20px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

#### Blob Animations (src/index.css:231-253)

```css
@keyframes blob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(20px, -30px) scale(1.05);
  }
  50% {
    transform: translate(-20px, 20px) scale(0.95);
  }
  75% {
    transform: translate(30px, 10px) scale(1.02);
  }
}

.animate-blob {
  animation: blob 12s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}
```

#### Pricing Animations (src/index.css:274-303)

```css
@keyframes priceChange {
  0% {
    opacity: 0.5;
    transform: translateY(10px);
  }
  50% {
    opacity: 1;
    transform: translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.price-change {
  animation: priceChange 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Transition Patterns

```css
/* Standard hover transitions */
.transition-all-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Button hover scale */
.hover-scale {
  transition: transform 0.3s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}

/* Card hover */
.card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

---

## Component Library

### Button Variants

#### Primary Button
```tsx
<button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105">
  Get Started Free
</button>
```

#### Secondary Button
```tsx
<button className="bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-8 rounded-xl hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all duration-300 hover:scale-105">
  Learn More
</button>
```

#### Outline Button
```tsx
<button className="border-2 border-green-600 text-green-600 font-bold py-3 px-8 rounded-xl hover:bg-green-600 hover:text-white transition-all duration-300">
  View Pricing
</button>
```

### Card Components

#### Feature Card
```tsx
<div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-green-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
    {/* Icon */}
  </div>
  <h3 className="text-2xl font-black text-gray-900 mb-4">Feature Title</h3>
  <p className="text-gray-600 leading-relaxed">Feature description</p>
</div>
```

#### Recipe Card (3D Effect)
```tsx
<div className="bg-white rounded-xl shadow-md border-2 border-gray-200 group recipe-card-3d overflow-hidden">
  <div className="relative h-48 bg-gradient-to-br from-green-400 via-emerald-400 to-blue-500">
    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
      <h3 className="text-lg font-bold text-white">{recipe.title}</h3>
    </div>
  </div>
  <div className="p-4">
    {/* Card content */}
  </div>
</div>
```

### Badge Components

```tsx
/* Primary Badge */
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200">
  Badge Text
</span>

/* Status Badge */
<span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
  Active
</span>

/* Popular Badge */
<span className="bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-full">
  Most Popular
</span>
```

### Input Components

#### Text Input
```tsx
<input
  type="text"
  className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-400 focus:outline-none transition-colors"
  placeholder="Enter text..."
/>
```

#### Icon Input
```tsx
<div className="relative">
  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
  <input
    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
    placeholder="Search recipes..."
  />
</div>
```

### Modal Components

#### Standard Modal Pattern
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
  <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
    {/* Header */}
    <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-900">Modal Title</h2>
      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
        <X className="w-6 h-6" />
      </button>
    </div>

    {/* Content */}
    <div className="p-6">
      {/* Modal content */}
    </div>

    {/* Footer */}
    <div className="border-t border-gray-200 p-6 flex justify-end space-x-3">
      <button className="px-6 py-2 border border-gray-300 rounded-lg">Cancel</button>
      <button className="px-6 py-2 bg-green-600 text-white rounded-lg">Save</button>
    </div>
  </div>
</div>
```

---

## Page-by-Page Design Breakdown

### 1. Landing Page (src/pages/LandingPage.tsx)

**Design Characteristics:**
- Animated gradient blob backgrounds
- Scroll-triggered animations on every section
- Bold, black typography (font-black)
- Generous white space between sections
- Staggered card animations

**Hero Section:**
```tsx
<div className="relative overflow-hidden">
  {/* Animated blobs */}
  <div className="absolute inset-0 opacity-30 -z-10">
    <div className="absolute top-0 -left-4 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
    <div className="absolute top-0 -right-4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
  </div>

  {/* Hero content */}
  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black">
    Transform Any Recipe
    <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
      With AI Magic
    </span>
  </h1>
</div>
```

**Key Patterns:**
- Badge with icon: `<ChefHat className="w-4 h-4" /> Recipe Revamped`
- CTA buttons with shadow: `shadow-lg shadow-green-500/30`
- Card hover effects: `hover:scale-105 hover:-translate-y-2`

---

### 2. Recipe Conversion Page (src/components/RecipeInput.tsx)

**Design Characteristics:**
- 26 dietary filters across 8 categories
- Mode toggle with gradient background
- Daily usage meter with color-coded progress
- Paginated filter display (8 per page)
- Collapsible sections for organization

**Mode Toggle Pattern:**
```tsx
<div className="relative bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-1.5 shadow-inner">
  <button className={mode === 'convert'
    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
    : 'bg-transparent text-gray-600 hover:bg-white/50'}>
    Convert Recipe
  </button>
</div>
```

**Daily Usage Meter:**
```tsx
<div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
  <div className={`h-full ${
    percentage < 60 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
    percentage < 85 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
    'bg-gradient-to-r from-red-500 to-rose-500'
  }`} style={{ width: `${percentage}%` }} />
</div>
```

**Dietary Filter Categories:**
1. 🌱 Plant-Based (green)
2. 🛡️ Allergen-Free (yellow)
3. 🥑 Low-Carb (purple)
4. 🥕 Whole Foods (orange)
5. 💪 Fitness (blue)
6. 🌍 Regional (teal)
7. 🩺 Health (pink)
8. 🙏 Religious (indigo)

---

### 3. Recipe Book (src/components/SavedRecipes.tsx)

**Design Characteristics:**
- Grid/List view toggle
- Enhanced search with icon
- Custom dropdown filters
- 3D hover effects on cards
- Pagination with animations
- Skeleton loading states

**Search Bar:**
```tsx
<div className="relative flex-1">
  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
  <input className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" />
</div>
```

**Recipe Card with 3D Effect:**
```tsx
<div className="bg-white rounded-xl shadow-md border-2 border-gray-200 group recipe-card-3d">
  <div className="relative h-48 bg-gradient-to-br from-green-400 via-emerald-400 to-blue-500">
    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
    <div className="absolute bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
      <h3 className="text-lg font-bold text-white">{recipe.title}</h3>
    </div>
  </div>
</div>
```

**Pagination:**
```tsx
<button className={currentPage === page
  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
  : 'bg-white hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50'
}>
  {page}
</button>
```

---

### 4. Authentication Pages

#### SignIn (src/components/Auth/SignIn.tsx)

**Design Characteristics:**
- Centered card with backdrop blur
- Password visibility toggle
- Google sign-in with icon
- Email verification helper
- Password reset flow
- Consent statement at bottom

**Auth Card Pattern:**
```tsx
<Card className="w-full max-w-lg shadow-2xl shadow-green-100 border-2 border-green-100 backdrop-blur-sm bg-white/95">
  <CardHeader className="text-center pb-4">
    <Link to="/" className="flex items-center justify-center mb-6 group">
      <img src="/logo/logo.png" className="h-10 w-10 mr-3 transition-transform duration-300 group-hover:scale-110" />
      <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
        Recipe Revamped
      </span>
    </Link>
  </CardHeader>
</Card>
```

**Password Input with Toggle:**
```tsx
<div className="relative">
  <Input type={showPassword ? 'text' : 'password'} />
  <Button variant="ghost" onClick={() => setShowPassword(!showPassword)}>
    {showPassword ? <EyeOff /> : <Eye />}
  </Button>
</div>
```

#### SignUp (src/components/Auth/SignUp.tsx)

**Additional Features:**
- Password requirements checklist
- Real-time validation indicators
- Email verification success screen

**Password Requirements:**
```tsx
<Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100">
  <CardContent className="p-4">
    <h4 className="text-sm font-bold text-gray-900 mb-3">Password Requirements</h4>
    {passwordRequirements.map((req) => (
      <div className="flex items-center text-sm">
        <CheckCircle className={req.test(password) ? 'text-green-600' : 'text-gray-400'} />
        <span className={req.test(password) ? 'text-green-700 font-semibold' : 'text-gray-600'}>
          {req.text}
        </span>
      </div>
    ))}
  </CardContent>
</Card>
```

---

### 5. Settings Page (src/pages/Settings.tsx)

**Design Characteristics:**
- Multi-section layout with navigation
- Profile picture with anagram fallback
- Password change with validation
- Account deletion with confirmation
- Subscription management
- Admin controls (for admin users)
- Real-time settings sync

**Section Navigation:**
```tsx
<button
  onClick={() => setActiveSection('profile')}
  className={`flex items-center px-4 py-3 rounded-lg ${
    activeSection === 'profile'
      ? 'bg-green-100 text-green-700 font-semibold'
      : 'text-gray-600 hover:bg-gray-100'
  }`}
>
  <UserIcon className="w-5 h-5 mr-3" />
  Profile Settings
</button>
```

**Profile Picture Display:**
```tsx
{settings?.profilePictureUrl ? (
  <img src={settings.profilePictureUrl} className="w-24 h-24 rounded-full object-cover" />
) : (
  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
    {getUserInitials(user.displayName || user.email)}
  </div>
)}
```

---

### 6. Meal Planner Calendar (src/components/MealPlannerCalendar.tsx)

**Design Characteristics:**
- Weekly grid layout (Monday-Sunday)
- Drag-and-drop recipe placement
- Multiple recipes per meal (limits: Breakfast 3, Lunch 5, Dinner 3, Snacks 5)
- Shopping list generation with categories
- Nutrition tracking per day
- Skeleton loading states

**Week Navigation:**
```tsx
<div className="flex items-center justify-between mb-6">
  <button
    onClick={() => navigateWeek('prev')}
    className="p-2 rounded-lg hover:bg-gray-100"
  >
    <ChevronLeft className="w-6 h-6" />
  </button>

  <h2 className="text-2xl font-bold">
    Week of {formatDate(weekDates[0])}
  </h2>

  <button
    onClick={() => navigateWeek('next')}
    className="p-2 rounded-lg hover:bg-gray-100"
  >
    <ChevronRight className="w-6 h-6" />
  </button>
</div>
```

**Shopping List Categories:**
```tsx
const categoryColors = {
  'Produce': 'bg-green-100 text-green-800',
  'Meat & Seafood': 'bg-red-100 text-red-800',
  'Dairy & Eggs': 'bg-blue-100 text-blue-800',
  'Pantry & Dry Goods': 'bg-yellow-100 text-yellow-800',
  'Frozen': 'bg-cyan-100 text-cyan-800',
  'Beverages': 'bg-purple-100 text-purple-800',
  'Other': 'bg-gray-100 text-gray-800'
};
```

---

### 7. Blog Page (src/pages/Blog.tsx)

**Design Characteristics:**
- Hero header with gradient blobs
- Tag filtering with animations
- Grid layout (3 columns on desktop)
- Featured images with fallback
- Read time estimates
- SEO-optimized structure
- Share functionality

**Blog Card:**
```tsx
<div className="bg-white rounded-2xl border-2 border-gray-200 hover:border-green-400 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 h-full flex flex-col">
  <div className="relative h-48 lg:h-56 bg-gradient-to-br from-green-400 via-emerald-400 to-blue-500 overflow-hidden">
    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
  </div>
</div>
```

**Individual Blog Post:**
- Apple-style prose formatting
- DOMPurify for content sanitization
- Related articles section
- Share button with native API fallback

---

### 8. Modal Components

#### Recipe Viewer (src/components/RecipeViewer.tsx)

**Design Characteristics:**
- Image header with blur overlay
- Structured recipe display
- Copy to clipboard function
- Edit button (if available)
- Fixed footer for actions

```tsx
<div className="fixed inset-0 z-50 overflow-y-auto">
  <div className="flex items-center justify-center min-h-screen p-4">
    <div className="relative bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
      {/* Image header */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="absolute bottom-3 left-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
            {recipe.title}
          </h2>
        </div>
      </div>

      {/* Content (scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <StructuredRecipeDisplay recipeJson={recipe.convertedRecipe} hideHeader={true} />
      </div>

      {/* Footer (fixed) */}
      <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
        <button className="px-6 py-2 bg-green-600 text-white rounded-lg">
          Copy Recipe
        </button>
      </div>
    </div>
  </div>
</div>
```

#### Recipe Editor (src/components/RecipeEditor.tsx)

**Design Characteristics:**
- Gradient header (green to blue)
- Inline editing of all fields
- Dynamic add/remove for ingredients, instructions, tips
- Image upload with preview
- Time inputs with unit selection
- Nutrition info grid (6 columns)
- Real-time validation

```tsx
/* Time Input Pattern */
<div className="flex space-x-2">
  <input
    type="number"
    value={prepTime.value || ''}
    onChange={(e) => setPrepTime(prev => ({...prev, value: parseInt(e.target.value) || 0}))}
    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
  />
  <select
    value={prepTime.unit}
    onChange={(e) => setPrepTime(prev => ({...prev, unit: e.target.value}))}
    className="px-2 py-2 border border-gray-300 rounded-lg"
  >
    <option value="minutes">min</option>
    <option value="hours">hrs</option>
  </select>
</div>
```

#### Payment Success Popup (src/components/PaymentSuccessPopup.tsx)

**Design Characteristics:**
- Centered modal with animation
- Success icon with sparkles
- Auto-redirect countdown
- Processing timeline
- Touch-friendly buttons (44px min-height)

```tsx
<div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
  <CheckCircle className="w-12 h-12 text-white" />
</div>

{/* Sparkle effects */}
<div className="absolute -top-2 -right-2 text-yellow-400 animate-bounce">
  <Sparkles className="w-6 h-6" />
</div>
```

#### Pricing Modal (src/components/PricingModal.tsx)

**Design Characteristics:**
- Side-by-side plan comparison
- Billing period toggle (monthly/yearly)
- Localized pricing with currency conversion
- Popular badge on recommended plan
- Stripe payment link integration
- Feature comparison checklist

```tsx
/* Billing Toggle */
<div className="bg-gray-100 p-1 rounded-lg flex">
  <button className={billingPeriod === 'yearly'
    ? 'bg-white text-blue-600 shadow-sm'
    : 'text-gray-600 hover:text-gray-900'
  }>
    Yearly
    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
      Save 20%
    </span>
  </button>
</div>
```

---

## Responsive Design Patterns

### Breakpoints (Tailwind defaults)

```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

### Mobile Optimizations

#### Touch-Friendly Elements (src/index.css:567-575)

```css
.touch-friendly {
  min-height: 44px;
  min-width: 44px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
}

/* Remove tap highlight on mobile */
* {
  -webkit-tap-highlight-color: transparent;
}
```

#### Responsive Typography

```tsx
/* Hero text scales from mobile to desktop */
<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black">
  Headline
</h1>

/* Body text scales */
<p className="text-base sm:text-lg md:text-xl">
  Body text
</p>
```

#### Responsive Grids

```tsx
/* Feature grid: 1 column mobile, 2 tablet, 3 desktop */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
  {features.map(...)}
</div>

/* Recipe grid: 1, 2, or 3 columns */
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {recipes.map(...)}
</div>
```

#### Mobile Navigation

- Hamburger menu for mobile
- Full navigation on desktop
- Sticky header on scroll
- Smooth scroll to sections

---

## Accessibility Features

### Keyboard Navigation

```tsx
/* Focus visible states */
.focus-visible:focus {
  outline: 2px solid var(--green-600);
  outline-offset: 2px;
}

/* Skip to main content */
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### ARIA Labels

```tsx
<button aria-label="Close modal">
  <X className="w-6 h-6" />
</button>

<input
  aria-describedby="email-error"
  aria-invalid={errors.email ? "true" : "false"}
/>
```

### Screen Reader Support

```css
/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### Color Contrast

All text meets WCAG AA standards:
- Primary text (gray-900) on white: 15.3:1 ratio
- Secondary text (gray-600) on white: 7.2:1 ratio
- Green-600 on white: 4.6:1 ratio (large text only)

---

## Design Tokens

### Spacing Scale

```
0.5: 0.125rem (2px)
1:   0.25rem  (4px)
2:   0.5rem   (8px)
3:   0.75rem  (12px)
4:   1rem     (16px)
6:   1.5rem   (24px)
8:   2rem     (32px)
12:  3rem     (48px)
16:  4rem     (64px)
```

### Border Radius

```
rounded-sm:  0.125rem (2px)
rounded:     0.25rem  (4px)
rounded-md:  0.375rem (6px)
rounded-lg:  0.5rem   (8px)
rounded-xl:  0.75rem  (12px)
rounded-2xl: 1rem     (16px)
rounded-full: 9999px
```

### Shadows

```css
/* Card shadow */
shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* Hover shadow */
shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Elevated shadow */
shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Green glow */
shadow-green-500/30: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
```

### Z-Index Scale

```
z-0:   0
z-10:  10   (Dropdowns)
z-20:  20   (Sticky headers)
z-30:  30   (Modals backdrop)
z-40:  40   (Tooltips)
z-50:  50   (Modals content)
```

---

## Cross-Browser Compatibility

### Dropdown Styling (src/index.css:604-822)

Extensive custom styling for `<select>` elements to ensure consistency across browsers:

```css
/* Remove default appearance */
select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,...");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.25em 1.25em;
  padding-right: 2.5rem;
}

/* Styled option (checked) */
select option:checked {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: #ffffff !important;
  font-weight: 800 !important;
}
```

### Safari-Specific Fixes

```css
/* Fix for Safari backdrop-filter */
@supports (-webkit-backdrop-filter: none) or (backdrop-filter: none) {
  .backdrop-blur-sm {
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
  }
}
```

### Firefox-Specific Fixes

```css
/* Fix for Firefox select dropdown */
@-moz-document url-prefix() {
  select option {
    background-color: white;
  }

  select option:checked {
    background-color: #10b981;
    color: white;
  }
}
```

---

## Performance Optimizations

### Lazy Loading

```tsx
/* Lazy load route components */
const Settings = lazy(() => import('./pages/Settings'));
const Blog = lazy(() => import('./pages/Blog'));

/* Lazy load images */
<img loading="lazy" src={recipe.imageUrl} />
```

### Animation Performance

```css
/* Use transform and opacity for animations (GPU-accelerated) */
.animated-element {
  transform: translateY(0);
  opacity: 1;
  will-change: transform, opacity;
}

/* Avoid animating layout properties */
/* ❌ Bad: */
.bad-animation {
  animation: move 1s;
}
@keyframes move {
  from { top: 0; }
  to { top: 100px; }
}

/* ✅ Good: */
.good-animation {
  animation: move 1s;
}
@keyframes move {
  from { transform: translateY(0); }
  to { transform: translateY(100px); }
}
```

### Skeleton Loading States

Used throughout for perceived performance:

```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4" />
  <div className="h-4 bg-gray-200 rounded w-full" />
  <div className="h-4 bg-gray-200 rounded w-5/6" />
</div>
```

---

## Design Best Practices

### Do's ✅

1. **Always use gradient backgrounds for primary CTAs**
   ```tsx
   <button className="bg-gradient-to-r from-green-600 to-emerald-600">
   ```

2. **Use font-black (900) for headlines**
   ```tsx
   <h1 className="text-4xl font-black">
   ```

3. **Add hover animations to interactive elements**
   ```tsx
   className="transition-all duration-300 hover:scale-105"
   ```

4. **Use rounded-xl or rounded-2xl for modern look**
   ```tsx
   className="rounded-xl" // or rounded-2xl
   ```

5. **Always include loading states**
   ```tsx
   {loading ? <Skeleton /> : <Content />}
   ```

6. **Use consistent spacing (multiples of 4)**
   ```tsx
   className="p-4 mb-8 space-y-6"
   ```

### Don'ts ❌

1. **Don't use flat colors for primary buttons**
   ```tsx
   ❌ className="bg-green-600"
   ✅ className="bg-gradient-to-r from-green-600 to-emerald-600"
   ```

2. **Don't use sharp corners on large cards**
   ```tsx
   ❌ className="rounded"
   ✅ className="rounded-xl"
   ```

3. **Don't forget mobile optimizations**
   ```tsx
   ❌ className="text-6xl"
   ✅ className="text-4xl sm:text-5xl lg:text-6xl"
   ```

4. **Don't use heavy box-shadows without hover states**
   ```tsx
   ❌ className="shadow-2xl"
   ✅ className="shadow-md hover:shadow-2xl transition-shadow"
   ```

5. **Don't forget touch-friendly sizes on mobile**
   ```tsx
   ❌ className="h-8 w-8"
   ✅ className="h-8 w-8 sm:h-8 sm:w-8 touch-friendly" // min 44px on mobile
   ```

---

## Future Design Considerations

### Potential Enhancements

1. **Dark Mode**
   - Use CSS custom properties for easy theme switching
   - Consider user preference with `prefers-color-scheme`
   - Adjust gradient intensities for dark backgrounds

2. **Animation Preferences**
   - Respect `prefers-reduced-motion`
   - Disable or reduce animations for accessibility

3. **Custom Themes**
   - Allow users to choose accent colors
   - Save preferences in user settings

4. **Micro-interactions**
   - Add haptic feedback on mobile
   - Confetti animations for achievements
   - Progress indicators for long operations

---

## Conclusion

Recipe Revamped's design system is built on a foundation of:
- **Modern aesthetics** with gradient-driven interfaces
- **Smooth animations** that enhance rather than distract
- **Responsive layouts** that adapt seamlessly across devices
- **Accessibility** baked into every component
- **Consistency** through reusable patterns and tokens

This documentation serves as the source of truth for all design decisions and should be updated as the system evolves.

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Maintained by:** Recipe Revamped Development Team
