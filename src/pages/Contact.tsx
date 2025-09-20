import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { SEOHead } from '../components/SEOHead';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

export const Contact: React.FC = () => {
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Implement actual form submission to info@reciperevamped.com
      // The form data should be sent to a backend endpoint that forwards to info@reciperevamped.com
      console.log('Form data to be sent to info@reciperevamped.com:', formData);
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      });
    } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <SEOHead pageKey="contact" />
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 text-white mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight">Contact Us</h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-green-100 max-w-3xl mx-auto leading-relaxed">
              We'd love to hear from you. Get in touch with our team for support, feedback, or partnership inquiries.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 h-fit">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Get In Touch</h2>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start sm:items-center">
                  <div className="bg-green-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Email Us</h3>
                    <p className="text-gray-600 text-sm sm:text-base break-all">info@reciperevamped.com</p>
                  </div>
                </div>
                
                <div className="flex items-start sm:items-center">
                  <div className="bg-orange-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Office</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Besnyő, Akácfa utca 8<br />2456 Hungary</p>
                  </div>
                </div>
              </div>
              
              {/* Response Time */}
              <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-1 sm:mb-2 text-sm sm:text-base">Response Time</h4>
                <p className="text-xs sm:text-sm text-green-700 leading-relaxed">
                  We typically respond to all inquiries within 24 hours during business days.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div id="contact-form" className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Send us a message</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-start sm:items-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-green-800 text-sm sm:text-base">Thank you! Your message has been sent successfully.</p>
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start sm:items-center">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-red-800 text-sm sm:text-base">Sorry, there was an error sending your message. Please try again.</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Your full name"
                    />
                    {errors.name && <p className="mt-1 text-xs sm:text-xs sm:text-sm text-red-600">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.email}</p>}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="partnership">Partnership</option>
                    <option value="billing">Billing</option>
                    <option value="bug">Bug Report</option>
                    <option value="enterprise">Enterprise Plan</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base ${
                      errors.subject ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Brief description of your inquiry"
                  />
                  {errors.subject && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.subject}</p>}
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base ${
                      errors.message ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Please provide details about your inquiry..."
                  />
                  {errors.message && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.message}</p>}
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.message.length}/500 characters
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-2 px-4 sm:py-3 sm:px-6 rounded-lg text-sm sm:text-base font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center">Frequently Asked Questions</h2>
            <p className="text-green-100 text-center mt-2">Everything you need to know about Recipe Revamped</p>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Getting Started */}
            <div className="border-l-4 border-green-500 pl-6">
              <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center">
                <span className="text-2xl mr-2">🚀</span>
                Getting Started
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">How does the AI recipe conversion work?</h4>
                  <p className="text-gray-600">
                    Our AI analyzes recipe ingredients and instructions, then intelligently substitutes ingredients
                    based on your dietary requirements while maintaining flavor and texture. Simply paste any recipe
                    on the Convert page and select your dietary filters.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Where do I convert recipes?</h4>
                  <p className="text-gray-600">
                    Go to the "Convert" page using the navigation menu. You can paste any recipe text or URL,
                    select your dietary filters (keto, gluten-free, etc.), and click "Generate Recipe" to get
                    your personalized version.
                  </p>
                </div>
              </div>
            </div>

            {/* Settings & Personalization */}
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center">
                <span className="text-2xl mr-2">⚙️</span>
                Settings & Personalization
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Where can I set my health goals?</h4>
                  <p className="text-gray-600">
                    Visit the "Settings" page to configure your health goals, dietary preferences, and personal profile.
                    You can set weight goals, activity levels, food allergies, and dietary restrictions to get
                    personalized recipe recommendations.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">How do I save my favorite recipes?</h4>
                  <p className="text-gray-600">
                    After converting a recipe, click the "Save Recipe" button. All your saved recipes can be
                    accessed from the "Saved Recipes" section in the navigation menu for easy reference.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Can I customize dietary filters?</h4>
                  <p className="text-gray-600">
                    Yes! On the Convert page, you can select multiple dietary filters like Keto, Gluten-Free,
                    Vegan, Low-Carb, and many more. The AI will adapt recipes to meet all your selected requirements.
                  </p>
                </div>
              </div>
            </div>

            {/* Features & Plans */}
            <div className="border-l-4 border-purple-500 pl-6">
              <h3 className="text-xl font-bold text-purple-600 mb-4 flex items-center">
                <span className="text-2xl mr-2">💎</span>
                Features & Plans
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">What is the Meal Planner feature?</h4>
                  <p className="text-gray-600">
                    The Meal Planner helps you organize your weekly meals using a calendar interface.
                    You can drag and drop saved recipes to specific days and meals, making meal prep
                    and grocery shopping much easier.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Do you offer different subscription plans?</h4>
                  <p className="text-gray-600">
                    Yes, we offer multiple plans including Free, Pro, and Enterprise options. Each plan provides
                    different limits on recipe conversions, storage, and advanced features. Check our pricing
                    page for detailed comparisons.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Can I cancel my subscription anytime?</h4>
                  <p className="text-gray-600">
                    Absolutely! You can cancel your subscription at any time from your account settings.
                    You'll retain access to all features until the end of your current billing period.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy & Technical */}
            <div className="border-l-4 border-orange-500 pl-6">
              <h3 className="text-xl font-bold text-orange-600 mb-4 flex items-center">
                <span className="text-2xl mr-2">🔒</span>
                Privacy & Technical
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Is my recipe data kept private?</h4>
                  <p className="text-gray-600">
                    We use your recipe data only for AI processing and service improvement. All data is
                    encrypted and stored securely. See our Privacy Policy for detailed information about
                    data handling and your rights.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">What browsers are supported?</h4>
                  <p className="text-gray-600">
                    Recipe Revamped works on all modern browsers including Chrome, Firefox, Safari, and Edge.
                    For the best experience, we recommend using the latest version of your preferred browser.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Do you offer enterprise solutions?</h4>
                  <p className="text-gray-600">
                    Yes, we offer custom enterprise solutions for restaurants, meal planning services,
                    and nutrition companies. Enterprise plans include API access, bulk processing,
                    and dedicated support. Contact us to discuss your needs.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Support Button */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600 mb-4">Still have questions? We're here to help!</p>
              <button
                onClick={() => document.querySelector('#contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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

export default Contact;