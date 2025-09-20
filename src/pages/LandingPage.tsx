import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Check, Star, Menu, X, Brain, Lock, Utensils, Globe } from 'lucide-react';
import { basePlans } from '../lib/pricing';
import { SEOHead } from '../components/SEOHead';

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isYearly, setIsYearly] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleBillingToggle = () => {
    setIsTransitioning(true);
    setIsYearly(!isYearly);

    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  // Helper function to get simple USD price
  const getPrice = (planIndex: number): string => {
    const plan = basePlans[planIndex];
    if (!plan || plan.basePrice === 0) return 'Free';
    
    if (isYearly) {
      const yearlyPrice = plan.basePrice * 12 * (1 - plan.yearlyDiscount / 100);
      return `$${yearlyPrice.toFixed(0)}/year`;
    } else {
      return `$${plan.basePrice}/month`;
    }
  };

  // Helper function to get savings info for a plan
  const getSavingsInfo = (planIndex: number) => {
    if (!isYearly || planIndex === 0) {
      return null; // No savings for free plan or monthly billing
    }

    const plan = basePlans[planIndex];
    if (!plan || plan.yearlyDiscount === 0) {
      return null;
    }

    const monthlyTotal = plan.basePrice * 12;
    const yearlyPrice = plan.basePrice * 12 * (1 - plan.yearlyDiscount / 100);
    const savingsAmount = monthlyTotal - yearlyPrice;

    return {
      savingsAmount: `$${savingsAmount.toFixed(0)}`,
      savingsPercentage: plan.yearlyDiscount
    };
  };

  // Animated Price Component with number counting
  const AnimatedPrice: React.FC<{
    planIndex: number;
    className?: string;
    spanClassName?: string;
  }> = ({ planIndex, className = "", spanClassName = "" }) => {
    const plan = basePlans[planIndex];
    const initialPrice = plan?.basePrice || 0;
    const [animatedPrice, setAnimatedPrice] = useState(initialPrice);
    const [displayPeriod, setDisplayPeriod] = useState("/month");
    const [targetPrice, setTargetPrice] = useState(initialPrice);

    useEffect(() => {
      const plan = basePlans[planIndex];
      if (!plan || plan.basePrice === 0) {
        setTargetPrice(0);
        setDisplayPeriod("/month");
        return;
      }

      let newTargetPrice: number;
      let newPeriod: string;

      if (isYearly) {
        newTargetPrice = plan.basePrice * 12 * 0.8;
        newPeriod = "/year";
      } else {
        newTargetPrice = plan.basePrice;
        newPeriod = "/month";
      }

      setTargetPrice(newTargetPrice);
      setDisplayPeriod(newPeriod);
    }, [isYearly, planIndex]);

    // Animate the number counting
    useEffect(() => {
      if (Math.abs(targetPrice - animatedPrice) < 0.01) return; // Use small threshold for floating point comparison

      const duration = 300; // Animation duration in ms
      const startTime = Date.now();
      const startPrice = animatedPrice;
      const priceDiff = targetPrice - startPrice;
      let animationFrame: number;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use easeOutCubic for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentPrice = startPrice + (priceDiff * easeOutCubic);

        setAnimatedPrice(currentPrice);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          // Ensure we end exactly at target price
          setAnimatedPrice(targetPrice);
        }
      };

      animationFrame = requestAnimationFrame(animate);

      // Cleanup function to cancel animation if component unmounts or effect re-runs
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }, [targetPrice]); // Remove animatedPrice from dependencies to prevent infinite loops

    const formatPrice = (price: number): string => {
      if (price === 0) return "$0";

      // For larger numbers (yearly prices), use no decimals
      // For smaller numbers (monthly prices), use 2 decimals
      if (price >= 100) {
        return `$${Math.round(price)}`;
      } else {
        return `$${price.toFixed(2)}`;
      }
    };

    return (
      <div className={`transition-all duration-300 ${isTransitioning ? 'scale-110 opacity-70' : 'scale-100 opacity-100'} ${className}`}>
        <span className={`text-3xl font-bold ${spanClassName}`}>
          {formatPrice(animatedPrice)}
        </span>
        <span className={spanClassName.replace('text-gray-900', 'text-gray-600').replace('text-blue-900', 'text-blue-600').replace('text-green-900', 'text-green-600')}>
          {displayPeriod}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <SEOHead pageKey="home" />
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-8 w-8 mr-2" />
              <span className="text-xl font-bold text-gray-900">Recipe Revamped</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-green-600 transition">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-700 hover:text-green-600 transition">
                Pricing
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="text-gray-700 hover:text-green-600 transition">
                Testimonials
              </button>
              <Link to="/signin" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Pricing
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Testimonials
              </button>
              <Link to="/signin" className="block w-full text-center bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Any Recipe to Match
              <span className="text-green-600"> Your Diet</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AI-powered recipe conversion that runs entirely in your browser. 
              No data leaves your device. Convert recipes to Vegan, Gluten-Free, Keto, and more instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signin" className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition">
                Get Started
              </Link>
              <button onClick={() => scrollToSection('features')} className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-50 transition">
                Learn More
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">No credit card required • Start cooking today</p>
          </div>

          {/* Hero Image/Demo */}
          <div className="mt-12 bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Original Recipe</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                  <p className="font-medium mb-2">Classic Beef Lasagna</p>
                  <p>• 1 lb ground beef</p>
                  <p>• Ricotta cheese</p>
                  <p>• Mozzarella cheese</p>
                  <p>• Traditional pasta sheets</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Converted to Vegan & Gluten-Free</h3>
                <div className="bg-green-50 p-4 rounded-lg text-sm text-gray-600">
                  <p className="font-medium mb-2 text-green-700">Plant-Based Lasagna</p>
                  <p>• 1 lb plant-based ground</p>
                  <p>• Cashew ricotta</p>
                  <p>• Vegan mozzarella</p>
                  <p>• Gluten-free lasagna sheets</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">100%</div>
              <div className="text-sm text-gray-600">Privacy Guaranteed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">50K+</div>
              <div className="text-sm text-gray-600">Recipes Converted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">4.9★</div>
              <div className="text-sm text-gray-600">User Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">24+</div>
              <div className="text-sm text-gray-600">Diet Filters</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Recipe Revamped?</h2>
            <p className="text-xl text-gray-600">The most secure and intelligent recipe converter available</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Conversion</h3>
              <p className="text-gray-600">
                Convert any recipe to match your dietary needs and health conditions with intelligent ingredient substitutions powered by OpenAI.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Utensils className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Recipe Management</h3>
              <p className="text-gray-600">
                Save, organize, and manage your converted recipes with a beautiful recipe book. Export recipes and plan meals with calendar integration.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Multiple Diet Filters</h3>
              <p className="text-gray-600">
                Support for 24+ dietary preferences including vegan, gluten-free, keto, paleo, and specific health conditions like diabetes and heart disease.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Your data is protected with Firebase authentication and secure cloud storage. Only you have access to your saved recipes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Conversion</h3>
              <p className="text-gray-600">
                Get perfectly formatted, structured recipes with ingredients, instructions, and nutrition information in seconds - not minutes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Format Input</h3>
              <p className="text-gray-600">
                Convert recipes from text, URLs, images, or paste directly from websites. Works with any format you have.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 mb-8">Choose the plan that works for you</p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-8">
              <span className={`text-sm font-medium mr-3 ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={handleBillingToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  isYearly ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ml-3 ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                Yearly
              </span>
            </div>
          </div>

          <div className="px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {/* Free Plan */}
              <div className="relative rounded-lg border-2 p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg flex flex-col h-full border-blue-500 bg-blue-50">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Free</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">$0</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-sm font-medium text-white bg-gray-500">Current Plan</span>
                </div>
                <ul className="mt-6 space-y-3 flex-grow">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">5 recipes in Recipe Book</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">3 recipe conversions per day</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Basic diet filters (Vegan, Gluten-Free, Vegetarian, Dairy-Free)</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">No meal planning</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">No default preferences</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">No backup/restore</span>
                  </li>
                </ul>
              </div>

              {/* Chef Plan */}
              <div className="relative rounded-lg border-2 p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg flex flex-col h-full border-gray-200 hover:border-gray-300">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-900">Chef</h3>
                  <div className="mt-4">
                    <AnimatedPrice
                      planIndex={1}
                      spanClassName="text-blue-900"
                    />
                  </div>
                  <div className={`mt-2 text-sm transition-all duration-300 overflow-hidden ${
                    isYearly ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <span className="text-green-600 font-medium">
                      Save ${(basePlans[1].basePrice * 12 * 0.2).toFixed(0)}
                    </span>
                    <span className="text-gray-500"> (20% off)</span>
                  </div>
                </div>
                <ul className="mt-6 space-y-3 flex-grow">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Everything in Free</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">100 recipes in Recipe Book</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">100 conversions per day</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">All diet filters (12+ options)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Meal planning calendar</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Default recipe preferences</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Custom profile pictures</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Backup & restore recipes</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Health Conditions</span>
                  </li>
                </ul>
                <Link to="/signin" className="w-full mt-6 py-3 px-4 rounded-lg transition-colors font-semibold bg-blue-600 hover:bg-blue-700 text-white text-center block">
                  Upgrade to Chef
                </Link>
              </div>

              {/* Master Chef Plan - Most Popular */}
              <div className="relative rounded-lg border-2 p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg flex flex-col h-full border-gray-200 hover:border-gray-300 shadow-xl ring-4 ring-green-300 bg-gradient-to-b from-green-50 to-white hover:ring-green-400">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-green-900">Master Chef</h3>
                  <div className="mt-4">
                    <AnimatedPrice
                      planIndex={2}
                      spanClassName="text-green-900"
                    />
                  </div>
                  <div className={`mt-2 text-sm transition-all duration-300 overflow-hidden ${
                    isYearly ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <span className="text-green-600 font-medium">
                      Save ${(basePlans[2].basePrice * 12 * 0.2).toFixed(0)}
                    </span>
                    <span className="text-gray-500"> (20% off)</span>
                  </div>
                </div>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg border-2 border-white whitespace-nowrap">Most Popular</span>
                </div>
                <ul className="mt-6 space-y-3 flex-grow">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Everything in Chef plan</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">1,000 recipes in Recipe Book</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Advanced nutrition analysis</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Recipe collections & tags</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Health Conditions</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Backup & restore recipes</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Priority support</span>
                  </li>
                </ul>
                <Link to="/signin" className="w-full mt-6 py-3 px-4 rounded-lg transition-colors font-semibold bg-green-600 hover:bg-green-700 text-white text-center block">
                  Upgrade to Master Chef
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="relative rounded-lg border-2 p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg flex flex-col h-full border-gray-200 hover:border-gray-300">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Enterprise</h3>
                  <div className="mt-4">
                    <div className="text-xl font-bold text-gray-900">Custom Pricing</div>
                  </div>
                </div>
                <ul className="mt-6 space-y-3 flex-grow">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">2,500 recipes per user</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Everything in Master Chef</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Team meal planning</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Organization-wide preferences</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Enterprise backup/restore</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Unlimited cloud storage</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Team collaboration</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">API access</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">24/7 phone support</span>
                  </li>
                </ul>
                <button disabled className="w-full mt-6 py-3 px-4 rounded-lg transition-colors font-semibold bg-gray-400 text-gray-600 text-center cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Loved by Home Cooks & Professionals</h2>
            <p className="text-xl text-gray-600">See what our users have to say</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Recipe Revamped has been a game-changer for my vegan journey. I can finally enjoy all my family's traditional recipes!"
              </p>
              <div className="flex items-center">
                <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold">SM</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah Mitchell</div>
                  <div className="text-sm text-gray-600">Home Cook</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "As a chef with celiac disease, this tool helps me quickly adapt recipes for my dietary needs. The AI is impressively accurate!"
              </p>
              <div className="flex items-center">
                <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold">JR</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">James Rodriguez</div>
                  <div className="text-sm text-gray-600">Professional Chef</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "The AI-powered recipe conversion is amazing! I love how it adapts my family recipes to my dietary needs perfectly."
              </p>
              <div className="flex items-center">
                <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-semibold">EC</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Emily Chen</div>
                  <div className="text-sm text-gray-600">Food Blogger</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Cooking?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of users who've revolutionized their meal planning
          </p>
          <Link to="/signin" className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-50 transition">
            Get Started Free
          </Link>
          <p className="mt-4 text-green-100">No credit card required • Start instantly</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-6 w-6 mr-2" />
                <span className="text-lg font-semibold text-white">Recipe Revamped</span>
              </div>
              <p className="text-sm">
                The AI-powered recipe converter with transparent data practices.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/signin" className="hover:text-white transition">Get Started</Link></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition">Features</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition">Pricing</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link to="/blog" className="hover:text-white transition">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition">Terms of Use</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 Recipe Revamped. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
