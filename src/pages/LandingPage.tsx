import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Check, Star, Menu, X, Brain, Lock, Utensils, Globe } from 'lucide-react';
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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
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
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-8 w-8 mr-2" />
              <span className="text-xl font-bold text-foreground">Recipe Revamped</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Button
                variant="ghost"
                onClick={() => scrollToSection('features')}
                className="text-muted-foreground hover:text-primary"
              >
                Features
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection('pricing')}
                className="text-muted-foreground hover:text-primary"
              >
                Pricing
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection('testimonials')}
                className="text-muted-foreground hover:text-primary"
              >
                Testimonials
              </Button>
              <Button asChild>
                <Link to={user ? "/app" : "/signin"}>
                  {user ? "Go to App" : "Get Started"}
                </Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Button
                variant="ghost"
                onClick={() => scrollToSection('features')}
                className="w-full justify-start"
              >
                Features
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection('pricing')}
                className="w-full justify-start"
              >
                Pricing
              </Button>
              <Button
                variant="ghost"
                onClick={() => scrollToSection('testimonials')}
                className="w-full justify-start"
              >
                Testimonials
              </Button>
              <Button asChild className="w-full">
                <Link to={user ? "/app" : "/signin"}>
                  {user ? "Go to App" : "Get Started"}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
              Transform Any Recipe to Match
              <span className="text-primary"> Your Diet</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              AI-powered recipe conversion that runs entirely in your browser.
              No data leaves your device. Convert recipes to Vegan, Gluten-Free, Keto, and more instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link to={user ? "/app" : "/signin"}>
                  {user ? "Go to App" : "Get Started"}
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection('features')}
                className="text-lg"
              >
                Learn More
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">No credit card required • Start cooking today</p>
          </div>

          {/* Hero Image/Demo */}
          <Card className="mt-12 max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Original Recipe</h3>
                  <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                    <p className="font-medium mb-2">Classic Beef Lasagna</p>
                    <p>• 1 lb ground beef</p>
                    <p>• Ricotta cheese</p>
                    <p>• Mozzarella cheese</p>
                    <p>• Traditional pasta sheets</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Converted to Vegan & Gluten-Free</h3>
                  <div className="bg-primary/10 p-4 rounded-lg text-sm text-muted-foreground">
                    <p className="font-medium mb-2 text-primary">Plant-Based Lasagna</p>
                    <p>• 1 lb plant-based ground</p>
                    <p>• Cashew ricotta</p>
                    <p>• Vegan mozzarella</p>
                    <p>• Gluten-free lasagna sheets</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-foreground">100%</div>
              <div className="text-sm text-muted-foreground">Privacy Guaranteed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">50K+</div>
              <div className="text-sm text-muted-foreground">Recipes Converted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">4.9★</div>
              <div className="text-sm text-muted-foreground">User Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">24+</div>
              <div className="text-sm text-muted-foreground">Diet Filters</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose Recipe Revamped?</h2>
            <p className="text-xl text-muted-foreground">The most secure and intelligent recipe converter available</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">AI-Powered Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Convert any recipe to match your dietary needs and health conditions with intelligent ingredient substitutions powered by OpenAI.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Utensils className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Recipe Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Save, organize, and manage your converted recipes with a beautiful recipe book. Export recipes and plan meals with calendar integration.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Multiple Diet Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Support for 24+ dietary preferences including vegan, gluten-free, keto, paleo, and specific health conditions like diabetes and heart disease.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Secure & Private</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your data is protected with Firebase authentication and secure cloud storage. Only you have access to your saved recipes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Fast Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get perfectly formatted, structured recipes with ingredients, instructions, and nutrition information in seconds - not minutes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Multi-Format Input</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Convert recipes from text, URLs, images, or paste directly from websites. Works with any format you have.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground mb-8">Choose the plan that works for you</p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-8">
              <span className={cn("text-sm font-medium mr-3",
                !isYearly ? 'text-foreground' : 'text-muted-foreground'
              )}>
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={handleBillingToggle}
                aria-label="Toggle between monthly and yearly billing"
              />
              <span className={cn("text-sm font-medium ml-3",
                isYearly ? 'text-foreground' : 'text-muted-foreground'
              )}>
                Yearly
              </span>
            </div>
          </div>

          <div className="px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {/* Free Plan */}
              <Card className="relative border-2 border-blue-500 bg-blue-50/50 hover:shadow-lg transition-all duration-300 hover:scale-105 flex flex-col h-full">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">Current Plan</Badge>
                </div>
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">Free</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-foreground">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">5 recipes in Recipe Book</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">3 recipe conversions per day</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Basic diet filters (Vegan, Gluten-Free, Vegetarian, Dairy-Free)</span>
                    </li>
                    <li className="flex items-start">
                      <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">No meal planning</span>
                    </li>
                    <li className="flex items-start">
                      <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">No default preferences</span>
                    </li>
                    <li className="flex items-start">
                      <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">No backup/restore</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Chef Plan */}
              <Card className="relative hover:shadow-lg transition-all duration-300 hover:scale-105 flex flex-col h-full">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg text-blue-900">Chef</CardTitle>
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
                    <span className="text-muted-foreground"> (20% off)</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Everything in Free</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">100 recipes in Recipe Book</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">100 conversions per day</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">All diet filters (12+ options)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Meal planning calendar</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Default recipe preferences</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Custom profile pictures</span>
                    </li>
                    <li className="flex items-start">
                      <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Backup & restore recipes</span>
                    </li>
                    <li className="flex items-start">
                      <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Health Conditions</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link to="/signin">
                      Upgrade to Chef
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Master Chef Plan - Most Popular */}
              <Card className="relative shadow-xl ring-4 ring-primary/30 bg-gradient-to-b from-primary/5 to-background hover:ring-primary/40 hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col h-full">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground shadow-lg border-2 border-background whitespace-nowrap">
                    Most Popular
                  </Badge>
                </div>
                <CardHeader className="text-center">
                  <CardTitle className="text-lg text-primary">Master Chef</CardTitle>
                  <div className="mt-4">
                    <AnimatedPrice
                      planIndex={2}
                      spanClassName="text-primary"
                    />
                  </div>
                  <div className={`mt-2 text-sm transition-all duration-300 overflow-hidden ${
                    isYearly ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <span className="text-green-600 font-medium">
                      Save ${(basePlans[2].basePrice * 12 * 0.2).toFixed(0)}
                    </span>
                    <span className="text-muted-foreground"> (20% off)</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Everything in Chef plan</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">1,000 recipes in Recipe Book</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Advanced nutrition analysis</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Recipe collections & tags</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Health Conditions</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Backup & restore recipes</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Priority support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link to="/signin">
                      Upgrade to Master Chef
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Enterprise Plan */}
              <Card className="relative hover:shadow-lg transition-all duration-300 hover:scale-105 flex flex-col h-full">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">Enterprise</CardTitle>
                  <div className="mt-4">
                    <div className="text-xl font-bold text-foreground">Custom Pricing</div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">2,500 recipes per user</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Everything in Master Chef</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Team meal planning</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Organization-wide preferences</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Enterprise backup/restore</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Unlimited cloud storage</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Team collaboration</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">API access</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">24/7 phone support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button disabled className="w-full">
                    Coming Soon
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Loved by Home Cooks & Professionals</h2>
            <p className="text-xl text-muted-foreground">See what our users have to say</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Recipe Revamped has been a game-changer for my vegan journey. I can finally enjoy all my family's traditional recipes!"
                </p>
                <div className="flex items-center">
                  <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-primary font-semibold">SM</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Sarah Mitchell</div>
                    <div className="text-sm text-muted-foreground">Home Cook</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "As a chef with celiac disease, this tool helps me quickly adapt recipes for my dietary needs. The AI is impressively accurate!"
                </p>
                <div className="flex items-center">
                  <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">JR</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">James Rodriguez</div>
                    <div className="text-sm text-muted-foreground">Professional Chef</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The AI-powered recipe conversion is amazing! I love how it adapts my family recipes to my dietary needs perfectly."
                </p>
                <div className="flex items-center">
                  <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-semibold">EC</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Emily Chen</div>
                    <div className="text-sm text-muted-foreground">Food Blogger</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Cooking?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join thousands of users who've revolutionized their meal planning
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg">
            <Link to={user ? "/app" : "/signin"}>
              {user ? "Go to App" : "Get Started Free"}
            </Link>
          </Button>
          <p className="mt-4 text-primary-foreground/80">No credit card required • Start instantly</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-muted-foreground py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src="/logo/logo.png" alt="Recipe Revamped Logo" className="h-6 w-6 mr-2" />
                <span className="text-lg font-semibold text-foreground">Recipe Revamped</span>
              </div>
              <p className="text-sm">
                The AI-powered recipe converter with transparent data practices.
              </p>
            </div>

            <div>
              <h4 className="text-foreground font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-foreground">
                    <Link to={user ? "/app" : "/signin"}>{user ? "Go to App" : "Get Started"}</Link>
                  </Button>
                </li>
                <li>
                  <Button variant="link" onClick={() => scrollToSection('features')} className="p-0 h-auto text-muted-foreground hover:text-foreground">
                    Features
                  </Button>
                </li>
                <li>
                  <Button variant="link" onClick={() => scrollToSection('pricing')} className="p-0 h-auto text-muted-foreground hover:text-foreground">
                    Pricing
                  </Button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-foreground font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-foreground">
                    <Link to="/about">About Us</Link>
                  </Button>
                </li>
                <li>
                  <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-foreground">
                    <Link to="/blog">Blog</Link>
                  </Button>
                </li>
                <li>
                  <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-foreground">
                    <Link to="/contact">Contact</Link>
                  </Button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-foreground font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-foreground">
                    <Link to="/privacy">Privacy Policy</Link>
                  </Button>
                </li>
                <li>
                  <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-foreground">
                    <Link to="/terms">Terms of Use</Link>
                  </Button>
                </li>
                <li>
                  <Button variant="link" asChild className="p-0 h-auto text-muted-foreground hover:text-foreground">
                    <Link to="/cookies">Cookie Policy</Link>
                  </Button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 Recipe Revamped. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
