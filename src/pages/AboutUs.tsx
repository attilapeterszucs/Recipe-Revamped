import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Target, Heart, Lightbulb, Globe, Award, Zap, Shield } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';

export const AboutUs: React.FC = () => {
  // SEO optimization
  useEffect(() => {
    document.title = 'About Recipe Revamped | AI-Powered Recipe Conversion Platform';
    
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    if (!metaDescription.getAttribute('name')) {
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Learn about Recipe Revamped, the revolutionary AI-powered platform that transforms recipes to meet your dietary needs. Discover our mission to make healthy, personalized cooking accessible to everyone.');
    
    const metaKeywords = document.querySelector('meta[name="keywords"]') || document.createElement('meta');
    if (!metaKeywords.getAttribute('name')) {
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', 'Recipe Revamped, AI recipe conversion, dietary adaptation, healthy cooking, recipe transformation, food allergies, keto recipes, nutrition technology, personalized meals');
    
    // Open Graph tags
    const ogTags = [
      { property: 'og:title', content: 'About Recipe Revamped | AI-Powered Recipe Conversion Platform' },
      { property: 'og:description', content: 'Revolutionary AI-powered platform that transforms recipes to meet your dietary needs. Making healthy, personalized cooking accessible to everyone.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://reciperevamped.com/about' },
      { property: 'og:site_name', content: 'Recipe Revamped' }
    ];
    
    ogTags.forEach(tag => {
      let meta = document.querySelector(`meta[property="${tag.property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', tag.property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', tag.content);
    });
    
    // Structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Recipe Revamped",
      "description": "AI-powered recipe conversion platform that transforms recipes to meet dietary needs and restrictions",
      "url": "https://reciperevamped.com",
      "logo": "https://reciperevamped.com/logo.png",
      "foundingDate": "2024",
      "sameAs": [
        "https://facebook.com/reciperevamped",
        "https://twitter.com/reciperevamped",
        "https://instagram.com/reciperevamped"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-555-RECIPE",
        "contactType": "customer service",
        "email": "support@reciperevamped.com"
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "US"
      },
      "makesOffer": {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "AI Recipe Conversion Service",
          "description": "Transform any recipe to meet your dietary needs using artificial intelligence"
        }
      }
    };
    
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) existingScript.remove();
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-white mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Recipe Revamped</h1>
            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
              Transforming the way you cook with AI-powered recipe conversion and dietary adaptation
            </p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              To make healthy, personalized cooking accessible to everyone by leveraging AI technology to adapt recipes 
              to individual dietary needs, preferences, and restrictions. We believe everyone deserves to enjoy delicious 
              meals that fit their lifestyle.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <Lightbulb className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              A world where dietary restrictions never limit culinary creativity. We envision a future where AI seamlessly 
              bridges the gap between traditional recipes and modern dietary needs, making cooking inclusive and enjoyable for all.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Our Story</h2>
          </div>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Recipe Revamped was born from a simple frustration: finding delicious recipes that actually fit your dietary needs. 
              Whether you're managing diabetes, following a keto lifestyle, dealing with allergies, or simply trying to eat healthier, 
              traditional recipe websites often left you on your own to figure out substitutions and adaptations.
            </p>
            <p>
              Our team of food enthusiasts, nutritionists, and AI experts came together with a shared vision: to create an 
              intelligent system that doesn't just convert recipes, but truly understands the science behind cooking and nutrition. 
              Using advanced AI technology, we've built a platform that can adapt any recipe while maintaining its soul and flavor.
            </p>
            <p>
              Today, Recipe Revamped helps thousands of home cooks discover new possibilities in their kitchens, proving that 
              dietary restrictions don't mean sacrificing taste or variety.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600 text-sm">Pushing the boundaries of AI to solve real cooking challenges</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inclusivity</h3>
              <p className="text-gray-600 text-sm">Making great food accessible regardless of dietary restrictions</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transparency</h3>
              <p className="text-gray-600 text-sm">Clear communication about data practices and AI processes</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Award className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Excellence</h3>
              <p className="text-gray-600 text-sm">Delivering high-quality recipe adaptations that actually work</p>
            </div>
          </div>
        </div>

        {/* Technology */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <div className="flex items-center mb-6">
            <div className="bg-indigo-100 rounded-full p-3 mr-4">
              <Globe className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Our Technology</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AI-Powered Recipe Intelligence</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our platform uses advanced AI models to understand recipe structures, ingredient interactions, and 
                nutritional requirements, enabling intelligent adaptations that preserve flavor while meeting dietary needs.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Secure & Transparent Processing</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We process recipe data through secure cloud infrastructure with clear data practices. Users are fully 
                informed about data usage and maintain control over their recipe information.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Cooking?</h2>
          <p className="text-green-100 mb-6">Join thousands of home cooks who have discovered the freedom of AI-adapted recipes</p>
          <Link 
            to="/signup" 
            className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;