import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Check, Star, Menu, X, Brain, Lock, Utensils, Globe, Crown, ChevronDown, Upload, Settings, Sparkles, Download, AlertCircle, FileText } from 'lucide-react';
import { basePlans } from '../lib/pricing';
import { SEOHead } from '../components/SEOHead';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { cn } from '../lib/utils';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isYearly, setIsYearly] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [showScrollArrow, setShowScrollArrow] = React.useState(true);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Hide scroll arrow when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollArrow(false);
      } else {
        setShowScrollArrow(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enhanced Intersection Observer for smooth scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add a small delay before triggering animation for smoothness
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, 50);
        }
      });
    }, observerOptions);

    // Observe all elements with scroll-animate class
    const elements = document.querySelectorAll('.scroll-animate, .scroll-animate-scale, .scroll-animate-slide-left, .scroll-animate-slide-right');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleBillingToggle = (checked: boolean) => {
    setIsTransitioning(true);
    setIsYearly(checked);

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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <SEOHead pageKey="home" />
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-green-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-3 group"
              aria-label="Return to top of page - Recipe Revamped home"
            >
              <img
                src="/logo/logo.png"
                alt="Recipe Revamped - AI Recipe Converter Logo"
                className="h-10 w-10 transition-transform duration-300 group-hover:scale-110"
                width="40"
                height="40"
              />
              <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Recipe Revamped</span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
              <Button
                variant="ghost"
                onClick={() => scrollToSection('features')}
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 font-semibold transition-colors px-4"
                aria-label="Scroll to Features section"
              >
                Features
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 font-semibold transition-colors px-4"
                aria-label="Scroll to How It Works section"
              >
                How It Works
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection('pricing')}
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 font-semibold transition-colors px-4"
                aria-label="Scroll to Pricing section"
              >
                Pricing
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 font-semibold transition-colors px-4"
                aria-label="Scroll to Testimonials section"
              >
                Testimonials
              </Button>
              <Button asChild className="ml-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105">
                <Link to={user ? "/app" : "/signin"}>
                  {user ? "Go to App" : "Get Started Free"}
                </Link>
              </Button>
            </nav>

            {/* Mobile menu button with animated hamburger icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden relative w-10 h-10 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {/* Animated hamburger icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-4 flex flex-col justify-between">
                  {/* Top line */}
                  <span
                    className={`block h-0.5 w-full bg-current transform transition-all duration-300 ease-in-out ${
                      mobileMenuOpen ? 'rotate-45 translate-y-1.5' : 'rotate-0 translate-y-0'
                    }`}
                  />
                  {/* Middle line */}
                  <span
                    className={`block h-0.5 w-full bg-current transition-all duration-300 ease-in-out ${
                      mobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                    }`}
                  />
                  {/* Bottom line */}
                  <span
                    className={`block h-0.5 w-full bg-current transform transition-all duration-300 ease-in-out ${
                      mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : 'rotate-0 translate-y-0'
                    }`}
                  />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation with smooth animations */}
        <div
          id="mobile-navigation"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {/* Redesigned mobile menu with gradient background */}
          <div className="relative bg-gradient-to-b from-white via-green-50/30 to-emerald-50/50 border-t-2 border-green-200 shadow-lg">
            {/* Decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500" />

            <nav className="px-4 pt-3 pb-4 space-y-1.5" aria-label="Mobile navigation menu">
              {/* Menu items with staggered animation and improved styling */}
              <Button
                variant="ghost"
                onClick={() => scrollToSection('features')}
                className={`w-full justify-start text-gray-700 hover:text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 font-semibold rounded-xl border-2 border-transparent hover:border-green-200 hover:shadow-md transform transition-all duration-300 ${
                  mobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: mobileMenuOpen ? '50ms' : '0ms' }}
                aria-label="Scroll to Features section"
              >
                Features
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection('how-it-works')}
                className={`w-full justify-start text-gray-700 hover:text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 font-semibold rounded-xl border-2 border-transparent hover:border-green-200 hover:shadow-md transform transition-all duration-300 ${
                  mobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: mobileMenuOpen ? '75ms' : '0ms' }}
                aria-label="Scroll to How It Works section"
              >
                How It Works
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection('pricing')}
                className={`w-full justify-start text-gray-700 hover:text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 font-semibold rounded-xl border-2 border-transparent hover:border-green-200 hover:shadow-md transform transition-all duration-300 ${
                  mobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: mobileMenuOpen ? '100ms' : '0ms' }}
                aria-label="Scroll to Pricing section"
              >
                Pricing
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection('testimonials')}
                className={`w-full justify-start text-gray-700 hover:text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 font-semibold rounded-xl border-2 border-transparent hover:border-green-200 hover:shadow-md transform transition-all duration-300 ${
                  mobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: mobileMenuOpen ? '150ms' : '0ms' }}
                aria-label="Scroll to Testimonials section"
              >
                Testimonials
              </Button>

              {/* Divider */}
              <div className="py-1.5">
                <div className="h-px bg-gradient-to-r from-transparent via-green-300 to-transparent" />
              </div>

              {/* CTA Button with enhanced styling */}
              <Button
                asChild
                className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-xl shadow-green-500/40 rounded-xl border-2 border-green-400/20 hover:border-green-400/40 transform transition-all duration-300 hover:scale-[1.02] ${
                  mobileMenuOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'
                }`}
                style={{ transitionDelay: mobileMenuOpen ? '200ms' : '0ms' }}
              >
                <Link to={user ? "/app" : "/signin"} className="flex items-center justify-center">
                  <Zap className="w-4 h-4 mr-2" />
                  {user ? "Go to App" : "Get Started Free"}
                </Link>
              </Button>
            </nav>

            {/* Bottom decorative gradient */}
            <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 opacity-30" />
          </div>
        </div>

      </nav>

      {/* Hero Section */}
      <main id="main-content">
      <section className="relative pt-20 pb-12 sm:pt-24 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50/30 to-white -z-10" />
        <div className="absolute inset-0 opacity-30 -z-10">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-7xl mx-auto relative mt-6">
          <div className="text-center scroll-animate">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm">
              <Zap className="w-4 h-4" />
              AI-Powered Recipe Conversion
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
              Transform Any Recipe to
              <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Match Your Diet
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
              Convert recipes instantly for 24+ dietary needs with AI-powered intelligence.
              <span className="block mt-2 font-semibold text-gray-900">Vegan • Gluten-Free • Keto • Low-Carb & More</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full sm:w-auto px-4 sm:px-0">
              <Button asChild size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105 min-h-[44px]">
                <Link to={user ? "/app" : "/signin"}>
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {user ? "Go to App" : "Get Started Free"}
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection('how-it-works')}
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all duration-300 min-h-[44px]"
              >
                See How It Works
              </Button>
            </div>
            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500 flex items-center justify-center gap-2">
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              No credit card required • Free plan available forever
            </p>
          </div>

          {/* Hero Demo Card */}
          <div className="mt-12 sm:mt-16 max-w-5xl mx-auto scroll-animate-scale">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2">
                <div className="flex gap-1 sm:gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/30" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/30" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/30" />
                </div>
                <div className="flex-1 text-center text-white text-xs sm:text-sm font-semibold">Recipe Converter</div>
              </div>
              <div className="p-5 sm:p-8 md:p-10">
                <div className="grid md:grid-cols-2 gap-5 sm:gap-8">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400" />
                      Original Recipe
                    </div>
                    <div className="bg-gray-50 border-2 border-gray-200 p-4 sm:p-6 rounded-xl sm:rounded-2xl">
                      <p className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">Classic Beef Lasagna</p>
                      <div className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
                        <p className="flex items-start"><span className="text-gray-400 mr-2">•</span>1 lb ground beef</p>
                        <p className="flex items-start"><span className="text-gray-400 mr-2">•</span>Ricotta cheese</p>
                        <p className="flex items-start"><span className="text-gray-400 mr-2">•</span>Mozzarella cheese</p>
                        <p className="flex items-start"><span className="text-gray-400 mr-2">•</span>Traditional pasta sheets</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 text-green-600 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-600 animate-pulse" />
                      Converted Recipe
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 p-4 sm:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden">
                      <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
                        <div className="bg-green-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">Vegan • GF</div>
                      </div>
                      <p className="font-bold text-base sm:text-lg text-green-700 mb-3 sm:mb-4">Plant-Based Lasagna</p>
                      <div className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
                        <p className="flex items-start"><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 mr-2 mt-0.5" />1 lb plant-based ground</p>
                        <p className="flex items-start"><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 mr-2 mt-0.5" />Cashew ricotta</p>
                        <p className="flex items-start"><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 mr-2 mt-0.5" />Vegan mozzarella</p>
                        <p className="flex items-start"><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 mr-2 mt-0.5" />Gluten-free lasagna sheets</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Scroll Arrow */}
          <div className={`flex justify-center mt-12 transition-opacity duration-500 ${showScrollArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="animate-bounce">
              <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => scrollToSection('features')}>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Scroll to explore</span>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group">
                  <ChevronDown className="w-6 h-6 text-green-600 group-hover:text-green-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 sm:py-16 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center group scroll-animate" style={{ transitionDelay: '0ms' }}>
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-green-100 text-green-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 mb-1.5 sm:mb-2">100%</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-600">Privacy Guaranteed</div>
            </div>
            <div className="text-center group scroll-animate" style={{ transitionDelay: '100ms' }}>
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-blue-100 text-blue-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Utensils className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 mb-1.5 sm:mb-2">50K+</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-600">Recipes Converted</div>
            </div>
            <div className="text-center group scroll-animate" style={{ transitionDelay: '200ms' }}>
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-yellow-100 text-yellow-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Star className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 mb-1.5 sm:mb-2">4.9★</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-600">User Rating</div>
            </div>
            <div className="text-center group scroll-animate" style={{ transitionDelay: '300ms' }}>
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-100 text-purple-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 mb-1.5 sm:mb-2">24+</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-600">Diet Filters</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 scroll-animate">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
              Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 sm:mb-4">Why Choose Recipe Revamped?</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">The most secure and intelligent recipe converter for your dietary needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="group relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-green-300 transition-all duration-500 hover:shadow-2xl hover:shadow-green-100 hover:-translate-y-1 scroll-animate" style={{ transitionDelay: '0ms' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Conversion</h3>
              <p className="text-gray-600 leading-relaxed">
                Convert any recipe to match your dietary needs and health conditions with intelligent ingredient substitutions powered by OpenAI.
              </p>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-300 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-1 scroll-animate" style={{ transitionDelay: '100ms' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                <Utensils className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Recipe Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Save, organize, and manage your converted recipes with a beautiful recipe book. Export recipes and plan meals with calendar integration.
              </p>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-purple-300 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-100 hover:-translate-y-1 scroll-animate" style={{ transitionDelay: '200ms' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">12+ Diet Filters</h3>
              <p className="text-gray-600 leading-relaxed">
                Support for 12+ dietary preferences including vegan, gluten-free, keto, paleo, and specific health conditions like diabetes and heart disease.
              </p>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-red-300 transition-all duration-500 hover:shadow-2xl hover:shadow-red-100 hover:-translate-y-1 scroll-animate" style={{ transitionDelay: '300ms' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                <Lock className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">100% Private & Secure</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                Your data is protected with enterprise-grade security. Free users enjoy local processing—your recipes never leave your device.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>No data selling, ever</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Encrypted cloud storage for paid plans</span>
                </div>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-yellow-300 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-100 hover:-translate-y-1 scroll-animate" style={{ transitionDelay: '400ms' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Conversion</h3>
              <p className="text-gray-600 leading-relaxed">
                Get perfectly formatted, structured recipes with ingredients, instructions, and nutrition information in seconds - not minutes.
              </p>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-indigo-300 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1 scroll-animate" style={{ transitionDelay: '500ms' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Simple Text Input</h3>
              <p className="text-gray-600 leading-relaxed">
                Paste recipe text directly into the app—our AI automatically understands and formats it. Image and URL support coming soon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 scroll-animate">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
              <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 sm:mb-4">AI-Powered Recipe Conversion</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">Simple, fast, and accurate recipe transformation in 3 easy steps</p>
          </div>

          {/* Process Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Step 1 */}
            <div className="relative scroll-animate" style={{ transitionDelay: '0ms' }}>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border-2 border-blue-200 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xl">1</div>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                    <Upload className="h-7 w-7" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">Input Your Recipe</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Paste recipe text directly into the app. Our AI understands natural recipe formats and extracts ingredients and instructions automatically.
                </p>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <FileText className="w-3 h-3" />
                    Text input supported
                  </div>
                  <div className="text-xs text-gray-600 italic">
                    Image & URL support coming soon
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative scroll-animate" style={{ transitionDelay: '150ms' }}>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-black text-xl">2</div>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                    <Sparkles className="h-7 w-7" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">AI Analyzes & Converts</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our GPT-4 powered AI understands your dietary needs and intelligently substitutes ingredients while maintaining flavor and nutrition.
                </p>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-xs font-semibold mr-2">
                    <Check className="w-3 h-3" />
                    Smart substitutions
                  </div>
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <Check className="w-3 h-3" />
                    Nutrition preserved
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative scroll-animate" style={{ transitionDelay: '300ms' }}>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-black text-xl">3</div>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white">
                    <Download className="h-7 w-7" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">Get Your Converted Recipe</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Receive a perfectly formatted recipe with adjusted ingredients, updated instructions, and accurate nutrition information.
                </p>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <Zap className="w-3 h-3" />
                  Ready in seconds
                </div>
              </div>
            </div>
          </div>

          {/* Quality & Accuracy Info */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border-2 border-gray-200 scroll-animate">
            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900 mb-2">Advanced AI Technology</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Powered by GPT-4, our AI understands complex dietary restrictions, ingredient relationships, and cooking techniques to provide accurate conversions.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900 mb-2">Quality Assurance</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Every conversion is validated for dietary compliance and nutritional accuracy. Our system learns from thousands of successful conversions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nutrition Accuracy Disclaimer */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-yellow-900 mb-1">Nutrition Information Notice</h5>
                  <p className="text-xs text-yellow-800 leading-relaxed">
                    Nutritional data is calculated using AI analysis and USDA databases. While we strive for accuracy, values are estimates and may vary based on specific ingredients and preparation methods.
                    <span className="font-semibold"> If you have medical conditions or strict dietary requirements, please verify nutritional information with your healthcare provider or a registered dietitian.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Simple Header */}
          <div className="text-center mb-10 sm:mb-12 scroll-animate">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
              Pricing Plans
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 sm:mb-4">Simple, Transparent Pricing</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-4">Choose the plan that works for you</p>

            {/* Free Plan Highlight */}
            <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 sm:mb-8">
              <Check className="w-4 h-4" />
              Free plan available forever • No credit card required • Upgrade anytime
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center">
              <div className="bg-white border-2 border-gray-200 p-1 sm:p-1.5 rounded-full flex items-center gap-2 sm:gap-3 shadow-md">
                <span className={cn("text-xs sm:text-sm font-medium px-2 sm:px-3 transition-colors",
                  !isYearly ? 'text-gray-900' : 'text-gray-500'
                )}>
                  Monthly
                </span>
                <button
                  onClick={() => handleBillingToggle(!isYearly)}
                  className={`relative inline-flex h-7 w-14 sm:h-8 sm:w-16 items-center rounded-full transition-all duration-300 ${
                    isYearly ? 'bg-green-600 shadow-lg shadow-green-500/50' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    isYearly ? 'translate-x-8 sm:translate-x-9' : 'translate-x-1'
                  }`} />
                </button>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={cn("text-xs sm:text-sm font-medium transition-colors",
                    isYearly ? 'text-gray-900' : 'text-gray-500'
                  )}>
                    Yearly
                  </span>
                  <span className="bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md">
                    Save 20%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {/* Free Plan */}
              <Card className="relative rounded-2xl border-2 border-gray-200 hover:border-green-300 bg-white hover:shadow-green-100 transition-all duration-500 hover:scale-105 hover:shadow-2xl flex flex-col h-full group p-6 scroll-animate-scale" style={{ transitionDelay: '0ms' }}>
                <CardHeader className="text-center p-0 mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-600 mb-4 mx-auto">
                    <Star className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2">Free</CardTitle>
                  <div className="mb-4">
                    <div className="text-4xl font-black text-gray-900 animate-price-change" key={isYearly ? 'yearly' : 'monthly'}>
                      $0
                    </div>
                    <div className="text-xs font-semibold text-gray-500 mt-1">per month</div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow p-0">
                  <ul className="space-y-2.5">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">5 recipes in Recipe Book</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">3 recipe conversions per day</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Basic diet filters</span>
                    </li>
                    <li className="flex items-start">
                      <Lock className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Local processing (100% private)</span>
                    </li>
                    <li className="flex items-start">
                      <X className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-500 line-through">Meal planning</span>
                    </li>
                    <li className="flex items-start">
                      <X className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-500 line-through">Default preferences</span>
                    </li>
                    <li className="flex items-start">
                      <X className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-500 line-through">Cloud backup/restore</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Chef Plan - Most Popular */}
              <Card className="relative rounded-2xl border-2 border-green-400 bg-gradient-to-b from-green-50 via-emerald-50 to-white shadow-xl ring-4 ring-green-300 hover:ring-green-400 hover:shadow-2xl transition-all duration-500 transform scale-105 flex flex-col h-full p-6 scroll-animate-scale" style={{ transitionDelay: '150ms' }}>
                {/* Most Popular Badge */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-xl border-2 border-white flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>

                <CardHeader className="text-center p-0 mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-4 mx-auto">
                    <Zap className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2">Chef</CardTitle>
                  <div className="mb-4">
                    <div className="text-4xl font-black text-green-600 animate-price-change" key={isYearly ? 'yearly' : 'monthly'}>
                      {isYearly && basePlans[1].yearlyDiscount > 0 ?
                        `$${(basePlans[1].basePrice * 12 * (1 - basePlans[1].yearlyDiscount / 100)).toFixed(0)}` :
                        `$${basePlans[1].basePrice.toFixed(2)}`
                      }
                    </div>
                    <div className="text-xs font-semibold text-gray-500 mt-1">
                      {isYearly ? 'per year' : 'per month'}
                    </div>
                    {isYearly && getSavingsInfo(1) && (
                      <div className="mt-3 animate-fade-in">
                        <div className="inline-flex items-center gap-1 bg-yellow-100 border-2 border-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                          <Check className="w-3 h-3" />
                          Save {getSavingsInfo(1)?.savingsAmount} ({getSavingsInfo(1)?.savingsPercentage}%)
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow p-0">
                  <ul className="space-y-2.5 mb-6">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Everything in Free</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">100 recipes in Recipe Book</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">100 conversions per day</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Unlock up to 12 dietary filters</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Meal planning calendar</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Default recipe preferences</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Custom profile pictures</span>
                    </li>
                    <li className="flex items-start">
                      <X className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-500 line-through">Backup & restore recipes</span>
                    </li>
                    <li className="flex items-start">
                      <X className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-500 line-through">Health Conditions</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="p-0">
                  <Button asChild className="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30">
                    <Link to="/signin">
                      Upgrade Now
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Master Chef Plan */}
              <Card className="relative rounded-2xl border-2 border-gray-200 hover:border-green-300 bg-white hover:shadow-green-100 transition-all duration-500 hover:scale-105 hover:shadow-2xl flex flex-col h-full group p-6 scroll-animate-scale" style={{ transitionDelay: '300ms' }}>
                <CardHeader className="text-center p-0 mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 text-purple-600 mb-4 mx-auto">
                    <Crown className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2">Master Chef</CardTitle>
                  <div className="mb-4">
                    <div className="text-4xl font-black text-gray-900 animate-price-change" key={isYearly ? 'yearly' : 'monthly'}>
                      {isYearly && basePlans[2].yearlyDiscount > 0 ?
                        `$${(basePlans[2].basePrice * 12 * (1 - basePlans[2].yearlyDiscount / 100)).toFixed(0)}` :
                        `$${basePlans[2].basePrice.toFixed(2)}`
                      }
                    </div>
                    <div className="text-xs font-semibold text-gray-500 mt-1">
                      {isYearly ? 'per year' : 'per month'}
                    </div>
                    {isYearly && getSavingsInfo(2) && (
                      <div className="mt-3 animate-fade-in">
                        <div className="inline-flex items-center gap-1 bg-yellow-100 border-2 border-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                          <Check className="w-3 h-3" />
                          Save {getSavingsInfo(2)?.savingsAmount} ({getSavingsInfo(2)?.savingsPercentage}%)
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow p-0">
                  <ul className="space-y-2.5 mb-6">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Everything in Chef plan</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">1,000 recipes in Recipe Book</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Advanced nutrition analysis</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Recipe collections & tags</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Health Conditions</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Backup & restore recipes</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">Priority support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="p-0">
                  <Button asChild className="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-gray-900 text-white hover:bg-gray-800">
                    <Link to="/signin">
                      Upgrade Now
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 scroll-animate">
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
              Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 sm:mb-4">Loved by Home Cooks & Professionals</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">Join thousands of happy users transforming their cooking</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="group bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-green-300 transition-all duration-500 hover:shadow-2xl hover:shadow-green-100 hover:-translate-y-1 scroll-animate-scale" style={{ transitionDelay: '0ms' }}>
              <div className="flex gap-0.5 sm:gap-1 mb-4 sm:mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 text-base sm:text-lg mb-5 sm:mb-6 leading-relaxed italic">
                "Recipe Revamped has been a game-changer for my vegan journey. I can finally enjoy all my family's traditional recipes!"
              </p>
              <div className="flex items-center pt-5 sm:pt-6 border-t border-gray-200">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-white font-bold text-base sm:text-lg">SM</span>
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base text-gray-900">Sarah Mitchell</div>
                  <div className="text-xs sm:text-sm text-gray-500">Home Cook</div>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-blue-300 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-1 scroll-animate-scale" style={{ transitionDelay: '150ms' }}>
              <div className="flex gap-0.5 sm:gap-1 mb-4 sm:mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 text-base sm:text-lg mb-5 sm:mb-6 leading-relaxed italic">
                "As a chef with celiac disease, this tool helps me quickly adapt recipes for my dietary needs. The AI is impressively accurate!"
              </p>
              <div className="flex items-center pt-5 sm:pt-6 border-t border-gray-200">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-white font-bold text-base sm:text-lg">JR</span>
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base text-gray-900">James Rodriguez</div>
                  <div className="text-xs sm:text-sm text-gray-500">Professional Chef</div>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-purple-300 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-100 hover:-translate-y-1 scroll-animate-scale" style={{ transitionDelay: '300ms' }}>
              <div className="flex gap-0.5 sm:gap-1 mb-4 sm:mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 text-base sm:text-lg mb-5 sm:mb-6 leading-relaxed italic">
                "The AI-powered recipe conversion is amazing! I love how it adapts my family recipes to my dietary needs perfectly."
              </p>
              <div className="flex items-center pt-5 sm:pt-6 border-t border-gray-200">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mr-3 sm:mr-4">
                  <span className="text-white font-bold text-base sm:text-lg">EC</span>
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base text-gray-900">Emily Chen</div>
                  <div className="text-xs sm:text-sm text-gray-500">Food Blogger</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative scroll-animate">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-5 sm:mb-6">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
            Join 50,000+ Happy Users
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-5 sm:mb-6 leading-tight">
            Ready to Transform Your Cooking?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Start converting recipes for free today. No credit card required, cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full sm:w-auto px-0">
            <Button asChild size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-white text-green-600 hover:bg-gray-50 shadow-2xl transition-all duration-300 hover:scale-105 font-bold min-h-[44px]">
              <Link to={user ? "/app" : "/signin"}>
                {user ? "Go to App" : "Get Started Free"}
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => scrollToSection('pricing')} className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-white bg-transparent text-white hover:bg-white hover:text-green-600 transition-all duration-300 min-h-[44px]">
              View Pricing
            </Button>
          </div>
          <p className="mt-5 sm:mt-6 text-white/80 text-xs sm:text-sm flex items-center justify-center gap-2">
            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
            Free forever plan • Upgrade anytime
          </p>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 mb-4 group"
                aria-label="Return to top of page - Recipe Revamped home"
              >
                <img
                  src="/logo/logo.png"
                  alt="Recipe Revamped - AI Recipe Converter Logo"
                  className="h-10 w-10 transition-transform duration-300 group-hover:scale-110"
                  width="40"
                  height="40"
                />
                <span className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Recipe Revamped</span>
              </button>
              <p className="text-sm text-gray-600 leading-relaxed">
                AI-powered recipe conversion for 24+ dietary needs. Transform any recipe instantly.
              </p>
            </div>

            <div>
              <h4 className="text-gray-900 font-bold mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <Link to={user ? "/app" : "/signin"} className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                    {user ? "Go to App" : "Get Started Free"}
                  </Link>
                </li>
                <li>
                  <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                    Pricing
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-900 font-bold mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/about" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/contact" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                    Contact & FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-900 font-bold mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/privacy" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">&copy; 2025 Recipe Revamped. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm text-gray-600 hover:text-green-600 transition-colors font-medium">
                  Back to Top ↑
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
