export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: Record<string, unknown>;
  noindex?: boolean;
}

export const SEO_CONFIGS: Record<string, SEOConfig> = {
  home: {
    title: 'Recipe Revamped - #1 AI Recipe Converter for Dietary Restrictions & Meal Planning',
    description: 'Transform any recipe instantly for gluten-free, vegan, keto, low-carb & 24+ dietary needs. Free AI recipe converter with meal planning, nutrition analysis & recipe storage. Start converting recipes today!',
    keywords: 'recipe converter, AI recipe converter, dietary restrictions, gluten-free recipes, vegan recipes, keto recipes, paleo recipes, low carb recipes, dairy-free recipes, nut-free recipes, meal planning app, nutrition analysis, recipe book, recipe storage, healthy recipes, diet meal planner, food allergy recipes, diabetes recipes, weight loss recipes, recipe modification, cooking app, recipe organizer',
    canonical: 'https://reciperevamped.com',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Recipe Revamped',
      description: 'AI-powered recipe converter that transforms any recipe to match your dietary restrictions and preferences.',
      url: 'https://reciperevamped.com',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
      }
    }
  },

  app: {
    title: 'Recipe Converter App - Transform Recipes for Your Diet | Recipe Revamped',
    description: 'Convert recipes instantly with our AI-powered app. Transform any recipe for gluten-free, vegan, keto, paleo & more dietary needs. Free recipe converter with meal planning tools.',
    keywords: 'recipe converter app, AI recipe conversion, dietary recipe modification, gluten free recipe converter, vegan recipe converter, keto recipe app, meal planning app, recipe organizer',
    canonical: 'https://reciperevamped.com/app',
    ogType: 'webapp'
  },

  about: {
    title: 'About Recipe Revamped - AI Recipe Converter for Dietary Needs',
    description: 'Learn about Recipe Revamped, the leading AI-powered recipe converter helping millions transform recipes for dietary restrictions. Meet our team and discover our mission.',
    keywords: 'about recipe revamped, AI recipe converter company, dietary restrictions solution, recipe conversion technology, food allergy recipes, healthy eating app',
    canonical: 'https://reciperevamped.com/about',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Recipe Revamped',
      description: 'Learn about Recipe Revamped and our mission to make cooking accessible for everyone with dietary restrictions.',
      url: 'https://reciperevamped.com/about'
    }
  },

  contact: {
    title: 'Contact Recipe Revamped - Support for AI Recipe Converter',
    description: 'Get help with Recipe Revamped! Contact our support team for questions about recipe conversion, dietary filters, meal planning, or technical issues. We\'re here to help!',
    keywords: 'contact recipe revamped, recipe converter support, customer service, technical help, recipe conversion assistance, dietary restrictions help',
    canonical: 'https://reciperevamped.com/contact',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Recipe Revamped',
      description: 'Contact Recipe Revamped for support with our AI recipe converter.',
      url: 'https://reciperevamped.com/contact'
    }
  },

  blog: {
    title: 'Recipe Conversion Tips & Dietary Cooking Blog | Recipe Revamped',
    description: 'Expert tips for converting recipes, dietary cooking guides, nutrition advice, and meal planning strategies. Learn how to adapt any recipe for your dietary needs.',
    keywords: 'recipe conversion tips, dietary cooking blog, gluten free cooking tips, vegan recipe conversion, keto recipe modification, healthy cooking blog, food allergy recipes, nutrition tips',
    canonical: 'https://reciperevamped.com/blog',
    ogType: 'blog',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Recipe Revamped Blog',
      description: 'Tips and guides for recipe conversion and dietary cooking.',
      url: 'https://reciperevamped.com/blog'
    }
  },

  signin: {
    title: 'Sign In to Recipe Revamped - Access Your Recipe Collection',
    description: 'Sign in to Recipe Revamped to access your converted recipes, meal plans, and dietary preferences. Join thousands using AI to transform recipes for their needs.',
    keywords: 'sign in recipe revamped, login recipe converter, access recipe collection, recipe app login, meal planning login',
    canonical: 'https://reciperevamped.com/signin',
    ogType: 'website',
    noindex: false
  },

  signup: {
    title: 'Sign Up for Recipe Revamped - Free AI Recipe Converter Account',
    description: 'Create your free Recipe Revamped account to start converting recipes for your dietary needs. Get AI-powered recipe conversion, meal planning, and more!',
    keywords: 'sign up recipe revamped, create account recipe converter, free recipe converter account, join recipe revamped, recipe app registration',
    canonical: 'https://reciperevamped.com/signup',
    ogType: 'website',
    noindex: false
  },

  privacy: {
    title: 'Privacy Policy - Recipe Revamped Data Protection & Security',
    description: 'Recipe Revamped privacy policy. Learn how we protect your data, recipe information, and personal details. GDPR compliant with transparent data practices.',
    keywords: 'recipe revamped privacy policy, data protection, GDPR compliance, recipe data security, privacy policy',
    canonical: 'https://reciperevamped.com/privacy-policy',
    ogType: 'website',
    noindex: false
  },

  terms: {
    title: 'Terms of Service - Recipe Revamped Service Agreement',
    description: 'Recipe Revamped terms of service and service agreement. Understand your rights and responsibilities when using our AI recipe converter platform.',
    keywords: 'recipe revamped terms of service, service agreement, terms and conditions, recipe converter terms',
    canonical: 'https://reciperevamped.com/terms-of-service',
    ogType: 'website',
    noindex: false
  },

  cookies: {
    title: 'Cookie Policy - Recipe Revamped Cookie Usage & Preferences',
    description: 'Learn about Recipe Revamped\'s cookie usage, manage your preferences, and understand how we use cookies to improve your recipe conversion experience.',
    keywords: 'recipe revamped cookie policy, cookie preferences, website cookies, tracking preferences',
    canonical: 'https://reciperevamped.com/cookie-policy',
    ogType: 'website',
    noindex: false
  }
};

export const updatePageSEO = (pageKey: string) => {
  const config = SEO_CONFIGS[pageKey];
  if (!config) return;

  // Update title
  document.title = config.title;

  // Update or create meta tags
  updateMetaTag('description', config.description);

  if (config.keywords) {
    updateMetaTag('keywords', config.keywords);
  }

  if (config.canonical) {
    updateLinkTag('canonical', config.canonical);
  }

  // Open Graph tags
  updateMetaTag('og:title', config.ogTitle || config.title, 'property');
  updateMetaTag('og:description', config.ogDescription || config.description, 'property');
  updateMetaTag('og:url', config.canonical || window.location.href, 'property');

  if (config.ogType) {
    updateMetaTag('og:type', config.ogType, 'property');
  }

  if (config.ogImage) {
    updateMetaTag('og:image', config.ogImage, 'property');
  }

  // Twitter tags
  updateMetaTag('twitter:title', config.twitterTitle || config.title);
  updateMetaTag('twitter:description', config.twitterDescription || config.description);

  if (config.twitterImage) {
    updateMetaTag('twitter:image', config.twitterImage);
  }

  // Robots tag
  if (config.noindex) {
    updateMetaTag('robots', 'noindex, nofollow');
  } else {
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  }

  // Structured data
  if (config.structuredData) {
    updateStructuredData(config.structuredData);
  }
};

const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
  let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }

  tag.content = content;
};

const updateLinkTag = (rel: string, href: string) => {
  let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

  if (!tag) {
    tag = document.createElement('link');
    tag.rel = rel;
    document.head.appendChild(tag);
  }

  tag.href = href;
};

const updateStructuredData = (data: Record<string, unknown>) => {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"][data-dynamic="true"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-dynamic', 'true');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

// Breadcrumb schema generator
export const generateBreadcrumbSchema = (breadcrumbs: Array<{name: string, url: string}>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };
};