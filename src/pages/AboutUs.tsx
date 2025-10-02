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
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50/30 to-white">
      <SEOHead pageKey="about" />
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-20">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-500 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-white mb-6 sm:mb-8 relative overflow-hidden shadow-2xl shadow-green-200/50 border-4 border-white/20">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 animate-pulse animation-delay-2000" />
            <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full animate-pulse animation-delay-4000" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight relative z-10 drop-shadow-lg">
              About Recipe Revamped
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/95 max-w-4xl mx-auto leading-relaxed relative z-10 font-semibold drop-shadow-md">
              Transforming the way you cook with AI-powered recipe conversion and dietary adaptation
            </p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mb-12 sm:mb-16 lg:mb-20">
          <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-2xl shadow-green-200/50 border-2 border-green-100 p-6 sm:p-8 lg:p-10 transition-all duration-300 hover:shadow-green-300/50 hover:scale-105 hover:border-green-200">
            <div className="flex items-start sm:items-center mb-5 sm:mb-7">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3 sm:p-4 mr-4 sm:mr-5 flex-shrink-0 shadow-lg shadow-green-500/30">
                <Target className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 leading-tight">Our Mission</h2>
            </div>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-medium">
              To make healthy, personalized cooking accessible to everyone by leveraging AI technology to adapt recipes
              to individual dietary needs, preferences, and restrictions. We believe everyone deserves to enjoy delicious
              meals that fit their lifestyle.
            </p>
          </div>

          <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-2xl shadow-green-200/50 border-2 border-green-100 p-6 sm:p-8 lg:p-10 transition-all duration-300 hover:shadow-green-300/50 hover:scale-105 hover:border-green-200">
            <div className="flex items-start sm:items-center mb-5 sm:mb-7">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3 sm:p-4 mr-4 sm:mr-5 flex-shrink-0 shadow-lg shadow-green-500/30">
                <Lightbulb className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 leading-tight">Our Vision</h2>
            </div>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-medium">
              A world where dietary restrictions never limit culinary creativity. We envision a future where AI seamlessly
              bridges the gap between traditional recipes and modern dietary needs, making cooking inclusive and enjoyable for all.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-2xl shadow-green-200/50 border-2 border-green-100 p-6 sm:p-8 lg:p-12 mb-12 sm:mb-16 lg:mb-20">
          <div className="flex items-start sm:items-center mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3 sm:p-4 mr-4 sm:mr-5 flex-shrink-0 shadow-lg shadow-green-500/30">
              <Heart className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 leading-tight">Our Story</h2>
          </div>
          <div className="space-y-4 sm:space-y-5 text-base sm:text-lg text-gray-700 leading-relaxed font-medium">
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
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 text-center mb-8 sm:mb-12 lg:mb-16">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-7">
            <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-2xl shadow-green-200/50 border-2 border-green-100 p-5 sm:p-7 text-center transition-all duration-300 hover:shadow-green-300/50 hover:scale-105 hover:border-green-200">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 sm:p-5 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-3">Innovation</h3>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed font-medium">Pushing the boundaries of AI to solve real cooking challenges</p>
            </div>

            <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-2xl shadow-green-200/50 border-2 border-green-100 p-5 sm:p-7 text-center transition-all duration-300 hover:shadow-green-300/50 hover:scale-105 hover:border-green-200">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 sm:p-5 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-3">Inclusivity</h3>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed font-medium">Making great food accessible regardless of dietary restrictions</p>
            </div>

            <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-2xl shadow-green-200/50 border-2 border-green-100 p-5 sm:p-7 text-center transition-all duration-300 hover:shadow-green-300/50 hover:scale-105 hover:border-green-200">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 sm:p-5 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-3">Transparency</h3>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed font-medium">Clear communication about data practices and AI processes</p>
            </div>

            <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-2xl shadow-green-200/50 border-2 border-green-100 p-5 sm:p-7 text-center transition-all duration-300 hover:shadow-green-300/50 hover:scale-105 hover:border-green-200">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 sm:p-5 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-3">Excellence</h3>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed font-medium">Delivering high-quality recipe adaptations that actually work</p>
            </div>
          </div>
        </div>

        {/* Technology */}
        <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-2xl shadow-green-200/50 border-2 border-green-100 p-6 sm:p-8 lg:p-12 mb-12 sm:mb-16 lg:mb-20">
          <div className="flex items-start sm:items-center mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3 sm:p-4 mr-4 sm:mr-5 flex-shrink-0 shadow-lg shadow-green-500/30">
              <Globe className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 leading-tight">Our Technology</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-3 sm:mb-4">AI-Powered Recipe Intelligence</h3>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-medium">
                Our platform uses advanced AI models to understand recipe structures, ingredient interactions, and
                nutritional requirements, enabling intelligent adaptations that preserve flavor while meeting dietary needs.
              </p>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-3 sm:mb-4">Secure & Transparent Processing</h3>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-medium">
                We process recipe data through secure cloud infrastructure with clear data practices. Users are fully
                informed about data usage and maintain control over their recipe information.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-green-600 via-emerald-600 to-green-500 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-2xl shadow-green-200/50 relative overflow-hidden border-4 border-white/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 animate-pulse animation-delay-2000" />
          <div className="absolute top-1/3 left-1/4 w-24 h-24 bg-white/5 rounded-full animate-pulse animation-delay-4000" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 sm:mb-6 relative z-10 drop-shadow-lg">Ready to Transform Your Cooking?</h2>
          <p className="text-base sm:text-lg lg:text-xl text-white/95 mb-6 sm:mb-8 leading-relaxed relative z-10 font-semibold drop-shadow-md max-w-2xl mx-auto">Join thousands of home cooks who have discovered the freedom of AI-adapted recipes</p>
          <Link
            to="/signup"
            className="bg-white text-green-600 px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-black hover:bg-gray-100 transition-all duration-300 hover:scale-110 shadow-2xl inline-block text-base sm:text-lg relative z-10"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;