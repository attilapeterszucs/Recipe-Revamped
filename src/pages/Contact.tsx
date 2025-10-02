import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { SEOHead } from '../components/SEOHead';
import { useAuth } from '../hooks/useAuth';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

export const Contact: React.FC = () => {
  const { user, getIdToken } = useAuth();

  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<ContactForm>>({});

  // SEO optimization
  useEffect(() => {
    document.title = 'Contact Recipe Revamped | Get Support for AI Recipe Conversion';
    
    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    if (!metaDescription.getAttribute('name')) {
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Contact Recipe Revamped for support with AI-powered recipe conversion, dietary adaptation, and cooking assistance. Get help with keto recipes, food allergies, and personalized meal planning.');
    
    const metaKeywords = document.querySelector('meta[name="keywords"]') || document.createElement('meta');
    if (!metaKeywords.getAttribute('name')) {
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', 'Recipe Revamped contact, customer support, AI recipe help, dietary adaptation support, cooking assistance, recipe conversion help, technical support');
    
    // Open Graph tags
    const ogTags = [
      { property: 'og:title', content: 'Contact Recipe Revamped | Get Support for AI Recipe Conversion' },
      { property: 'og:description', content: 'Get expert support for AI-powered recipe conversion, dietary adaptation, and personalized cooking assistance.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://reciperevamped.com/contact' },
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
    
    // Structured data for contact page
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Recipe Revamped",
      "description": "Get support for AI-powered recipe conversion and dietary adaptation",
      "url": "https://reciperevamped.com/contact",
      "mainEntity": {
        "@type": "Organization",
        "name": "Recipe Revamped",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "email": "support@reciperevamped.com",
            "telephone": "+1-555-RECIPE",
            "areaServed": "US",
            "availableLanguage": "English"
          },
          {
            "@type": "ContactPoint",
            "contactType": "technical support",
            "email": "tech@reciperevamped.com",
            "areaServed": "US",
            "availableLanguage": "English"
          }
        ]
      }
    };
    
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) existingScript.remove();
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactForm> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ContactForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Get auth token if user is logged in (optional for contact form)
      let authToken = null;
      try {
        if (user) {
          authToken = await getIdToken();
        }
      } catch (authError) {
        console.warn('Could not get auth token, proceeding anonymously:', authError);
      }

      const EMAIL_SERVICE_URL = 'https://emailservice-428797186446.us-central1.run.app/contact';

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth header if available
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      // Submit form to email service
      const response = await fetch(EMAIL_SERVICE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          category: formData.category
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      });
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50/30 to-white">
      <SEOHead pageKey="contact" />
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-500 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-white mb-6 sm:mb-8 relative overflow-hidden shadow-2xl shadow-green-200/50 border-4 border-white/20">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 animate-pulse animation-delay-2000" />
            <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full animate-pulse animation-delay-4000" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight relative z-10 drop-shadow-lg">Contact Us</h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/95 max-w-4xl mx-auto leading-relaxed relative z-10 font-semibold drop-shadow-md">
              We'd love to hear from you. Get in touch with our team for support, feedback, or partnership inquiries.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {/* Contact Information */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-2xl shadow-green-200/50 border-2 border-green-100 p-6 sm:p-8 lg:p-10 h-fit">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-6 sm:mb-8">Get In Touch</h2>

              <div className="space-y-5 sm:space-y-7">
                <div className="flex items-start sm:items-center">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3 sm:p-4 mr-4 sm:mr-5 flex-shrink-0 shadow-lg shadow-green-500/30">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base sm:text-lg">Email Us</h3>
                    <p className="text-gray-700 text-sm sm:text-base break-all font-medium">info@reciperevamped.com</p>
                  </div>
                </div>

                <div className="flex items-start sm:items-center">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3 sm:p-4 mr-4 sm:mr-5 flex-shrink-0 shadow-lg shadow-green-500/30">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base sm:text-lg">Office</h3>
                    <p className="text-gray-700 text-sm sm:text-base font-medium">Besnyő, Akácfa utca 8<br />2456 Hungary</p>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-md">
                <h4 className="font-black text-green-800 mb-2 sm:mb-3 text-base sm:text-lg">Response Time</h4>
                <p className="text-sm sm:text-base text-green-700 leading-relaxed font-medium">
                  We typically respond to all inquiries within 24 hours during business days.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div id="contact-form" className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-2xl shadow-green-200/50 border-2 border-green-100 p-6 sm:p-8 lg:p-10">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-6 sm:mb-8">Send us a message</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl flex items-start sm:items-center shadow-md">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-green-800 text-base sm:text-lg font-bold">Thank you! Your message has been sent successfully.</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl flex items-start sm:items-center shadow-md">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-red-800 text-base sm:text-lg font-bold">Sorry, there was an error sending your message. Please try again.</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label htmlFor="name" className="block text-base font-bold text-gray-900 mb-2 sm:mb-3">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 sm:px-5 sm:py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 text-base sm:text-lg font-medium transition-all duration-300 ${
                        errors.name ? 'border-red-300' : 'border-gray-300 hover:border-green-300'
                      }`}
                      placeholder="Your full name"
                    />
                    {errors.name && <p className="mt-2 text-sm sm:text-base text-red-600 font-medium">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-base font-bold text-gray-900 mb-2 sm:mb-3">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 sm:px-5 sm:py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 text-base sm:text-lg font-medium transition-all duration-300 ${
                        errors.email ? 'border-red-300' : 'border-gray-300 hover:border-green-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="mt-2 text-sm sm:text-base text-red-600 font-medium">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-base font-bold text-gray-900 mb-2 sm:mb-3">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 sm:px-5 sm:py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 text-base sm:text-lg font-medium hover:border-green-300 transition-all duration-300"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="business">Business Partnership</option>
                    <option value="legal">Legal Matters</option>
                    <option value="privacy">Privacy Policy Questions</option>
                    <option value="cookies">Cookie Questions</option>
                    <option value="dpo">Data Protection Officer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-base font-bold text-gray-900 mb-2 sm:mb-3">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 sm:px-5 sm:py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 text-base sm:text-lg font-medium transition-all duration-300 ${
                      errors.subject ? 'border-red-300' : 'border-gray-300 hover:border-green-300'
                    }`}
                    placeholder="Brief description of your inquiry"
                  />
                  {errors.subject && <p className="mt-2 text-sm sm:text-base text-red-600 font-medium">{errors.subject}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="block text-base font-bold text-gray-900 mb-2 sm:mb-3">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className={`w-full px-4 py-3 sm:px-5 sm:py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 text-base sm:text-lg font-medium transition-all duration-300 ${
                      errors.message ? 'border-red-300' : 'border-gray-300 hover:border-green-300'
                    }`}
                    placeholder="Please provide details about your inquiry..."
                  />
                  {errors.message && <p className="mt-2 text-sm sm:text-base text-red-600 font-medium">{errors.message}</p>}
                  <p className="mt-2 text-base text-gray-600 font-medium">
                    {formData.message.length}/500 characters
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 sm:py-5 sm:px-8 rounded-xl text-base sm:text-lg font-black focus:outline-none focus:ring-4 focus:ring-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-105"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 sm:mt-20 bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-2xl shadow-green-200/50 border-2 border-green-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-500 p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white text-center relative z-10 drop-shadow-lg">Frequently Asked Questions</h2>
            <p className="text-white/95 text-center mt-3 text-base sm:text-lg relative z-10 font-semibold drop-shadow-md">Everything you need to know about Recipe Revamped</p>
          </div>

          <div className="p-8 sm:p-10 lg:p-12 space-y-6">
            {/* Getting Started */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-2xl p-6 sm:p-8 border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl sm:text-2xl font-black text-green-700 mb-6 flex items-center">
                <span className="text-3xl mr-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-2">🚀</span>
                Getting Started
              </h3>
              <div className="space-y-5">
                <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3">How does the AI recipe conversion work?</h4>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    Our AI analyzes recipe ingredients and instructions, then intelligently substitutes ingredients
                    based on your dietary requirements while maintaining flavor and texture. Simply paste any recipe
                    on the Convert page and select your dietary filters.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3">Where do I convert recipes?</h4>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    Go to the "Convert" page using the navigation menu. You can paste any recipe text or URL,
                    select your dietary filters (keto, gluten-free, etc.), and click "Generate Recipe" to get
                    your personalized version.
                  </p>
                </div>
              </div>
            </div>

            {/* Settings & Personalization */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 rounded-2xl p-6 sm:p-8 border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl sm:text-2xl font-black text-blue-700 mb-6 flex items-center">
                <span className="text-3xl mr-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-2">⚙️</span>
                Settings & Personalization
              </h3>
              <div className="space-y-5">
                <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3">Where can I set my health goals?</h4>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    Visit the "Settings" page to configure your health goals, dietary preferences, and personal profile.
                    You can set weight goals, activity levels, food allergies, and dietary restrictions to get
                    personalized recipe recommendations.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3">How do I save my favorite recipes?</h4>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    After converting a recipe, click the "Save Recipe" button. All your saved recipes can be
                    accessed from the "Saved Recipes" section in the navigation menu for easy reference.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3">Can I customize dietary filters?</h4>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    Yes! On the Convert page, you can select multiple dietary filters like Keto, Gluten-Free,
                    Vegan, Low-Carb, and many more. The AI will adapt recipes to meet all your selected requirements.
                  </p>
                </div>
              </div>
            </div>

            {/* Features & Plans */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50/50 rounded-2xl p-6 sm:p-8 border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl sm:text-2xl font-black text-purple-700 mb-6 flex items-center">
                <span className="text-3xl mr-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-2">💎</span>
                Features & Plans
              </h3>
              <div className="space-y-5">
                <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3">What is the Meal Planner feature?</h4>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    The Meal Planner helps you organize your weekly meals using a calendar interface.
                    You can drag and drop saved recipes to specific days and meals, making meal prep
                    and grocery shopping much easier.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3">Do you offer different subscription plans?</h4>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    Yes, we offer multiple plans including Free, Pro, and Enterprise options. Each plan provides
                    different limits on recipe conversions, storage, and advanced features. Check our pricing
                    page for detailed comparisons.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3">Can I cancel my subscription anytime?</h4>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    Absolutely! You can cancel your subscription at any time from your account settings.
                    You'll retain access to all features until the end of your current billing period.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy & Technical */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50/50 rounded-2xl p-6 sm:p-8 border-2 border-orange-200 shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl sm:text-2xl font-black text-orange-700 mb-6 flex items-center">
                <span className="text-3xl mr-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-2">🔒</span>
                Privacy & Technical
              </h3>
              <div className="space-y-5">
                <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3">Is my recipe data kept private?</h4>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    We use your recipe data only for AI processing and service improvement. All data is
                    encrypted and stored securely. See our Privacy Policy for detailed information about
                    data handling and your rights.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3">What browsers are supported?</h4>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    Recipe Revamped works on all modern browsers including Chrome, Firefox, Safari, and Edge.
                    For the best experience, we recommend using the latest version of your preferred browser.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3">Do you offer enterprise solutions?</h4>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    Yes, we offer custom enterprise solutions for restaurants, meal planning services,
                    and nutrition companies. Enterprise plans include API access, bulk processing,
                    and dedicated support. Contact us to discuss your needs.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Support Button */}
            <div className="text-center pt-8 border-t-2 border-green-200">
              <p className="text-gray-700 mb-5 text-base sm:text-lg font-bold">Still have questions? We're here to help!</p>
              <button
                onClick={() => document.querySelector('#contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-black text-base sm:text-lg transition-all duration-300 shadow-lg shadow-green-500/30 hover:scale-105 hover:shadow-xl"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

