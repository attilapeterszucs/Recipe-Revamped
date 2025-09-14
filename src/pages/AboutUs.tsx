import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Target, Heart, Lightbulb, Globe, Award, Zap, Shield } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { SEOHead } from '../components/SEOHead';

export const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <SEOHead pageKey="about" />
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-16">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 text-white mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight">
              About Recipe Revamped
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-green-100 max-w-3xl mx-auto leading-relaxed">
              Transforming the way you cook with AI-powered recipe conversion and dietary adaptation
            </p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
            <div className="flex items-start sm:items-center mb-4 sm:mb-6">
              <div className="bg-green-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">Our Mission</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              To make healthy, personalized cooking accessible to everyone by leveraging AI technology to adapt recipes 
              to individual dietary needs, preferences, and restrictions. We believe everyone deserves to enjoy delicious 
              meals that fit their lifestyle.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
            <div className="flex items-start sm:items-center mb-4 sm:mb-6">
              <div className="bg-blue-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">Our Vision</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              A world where dietary restrictions never limit culinary creativity. We envision a future where AI seamlessly 
              bridges the gap between traditional recipes and modern dietary needs, making cooking inclusive and enjoyable for all.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 lg:mb-16">
          <div className="flex items-start sm:items-center mb-4 sm:mb-6">
            <div className="bg-purple-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">Our Story</h2>
          </div>
          <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700 leading-relaxed">
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
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 text-center mb-6 sm:mb-8 lg:mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center">
              <div className="bg-green-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">Pushing the boundaries of AI to solve real cooking challenges</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center">
              <div className="bg-blue-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Inclusivity</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">Making great food accessible regardless of dietary restrictions</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center">
              <div className="bg-purple-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Transparency</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">Clear communication about data practices and AI processes</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center">
              <div className="bg-orange-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Excellence</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">Delivering high-quality recipe adaptations that actually work</p>
            </div>
          </div>
        </div>

        {/* Technology */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 lg:mb-16">
          <div className="flex items-start sm:items-center mb-4 sm:mb-6">
            <div className="bg-indigo-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
              <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">Our Technology</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">AI-Powered Recipe Intelligence</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                Our platform uses advanced AI models to understand recipe structures, ingredient interactions, and 
                nutritional requirements, enabling intelligent adaptations that preserve flavor while meeting dietary needs.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Secure & Transparent Processing</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                We process recipe data through secure cloud infrastructure with clear data practices. Users are fully 
                informed about data usage and maintain control over their recipe information.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 sm:p-8 text-white">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">Ready to Transform Your Cooking?</h2>
          <p className="text-sm sm:text-base text-green-100 mb-4 sm:mb-6 leading-relaxed">Join thousands of home cooks who have discovered the freedom of AI-adapted recipes</p>
          <Link 
            to="/signup" 
            className="bg-white text-green-600 px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block text-sm sm:text-base"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;