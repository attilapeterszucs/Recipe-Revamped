import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Target, Heart, Lightbulb, Globe, Award, Zap, Shield } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { SEOHead } from '../components/SEOHead';

export const AboutUs: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SEOHead pageKey="about" />
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6">
            About Recipe Revamped
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transforming the way you cook with AI-powered recipe conversion and dietary adaptation
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              To make healthy, personalized cooking accessible to everyone by leveraging AI technology to adapt recipes
              to individual dietary needs, preferences, and restrictions. We believe everyone deserves to enjoy delicious
              meals that fit their lifestyle.
            </p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Our Vision</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              A world where dietary restrictions never limit culinary creativity. We envision a future where AI seamlessly
              bridges the gap between traditional recipes and modern dietary needs, making cooking inclusive and enjoyable for all.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 lg:p-12 mb-20 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900">Our Story</h2>
          </div>
          <div className="space-y-5 text-gray-700 leading-relaxed">
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
        <div className="mb-20">
          <h2 className="text-4xl font-black text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 text-center shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Innovation</h3>
              <p className="text-gray-700 leading-relaxed">Pushing the boundaries of AI to solve real cooking challenges</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 text-center shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Inclusivity</h3>
              <p className="text-gray-700 leading-relaxed">Making great food accessible regardless of dietary restrictions</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 text-center shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Transparency</h3>
              <p className="text-gray-700 leading-relaxed">Clear communication about data practices and AI processes</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 text-center shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Excellence</h3>
              <p className="text-gray-700 leading-relaxed">Delivering high-quality recipe adaptations that actually work</p>
            </div>
          </div>
        </div>

        {/* Technology */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 lg:p-12 mb-20 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900">Our Technology</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-black text-gray-900 mb-3">AI-Powered Recipe Intelligence</h3>
              <p className="text-gray-700 leading-relaxed">
                Our platform uses advanced AI models to understand recipe structures, ingredient interactions, and
                nutritional requirements, enabling intelligent adaptations that preserve flavor while meeting dietary needs.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Secure & Transparent Processing</h3>
              <p className="text-gray-700 leading-relaxed">
                We process recipe data through secure cloud infrastructure with clear data practices. Users are fully
                informed about data usage and maintain control over their recipe information.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-12 text-white text-center shadow-xl">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to Transform Your Cooking?</h2>
          <p className="text-lg text-white/95 mb-8 max-w-2xl mx-auto">
            Join thousands of home cooks who have discovered the freedom of AI-adapted recipes
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-green-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;