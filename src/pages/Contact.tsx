import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';

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
      
      // In a real application, you would send the form data to your backend
      console.log('Contact form submitted:', formData);
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-white mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
              We'd love to hear from you. Get in touch with our team for support, feedback, or partnership inquiries.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-8 h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-3 mr-4">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Us</h3>
                    <p className="text-gray-600">info@reciperevamp.com</p>
                  </div>
                </div>
                
                
                <div className="flex items-center">
                  <div className="bg-orange-100 rounded-full p-3 mr-4">
                    <MapPin className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Office</h3>
                    <p className="text-gray-600">Besnyő, Akácfa utca 8<br />2456 Hungary</p>
                  </div>
                </div>
              </div>
              
              {/* Response Time */}
              <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Response Time</h4>
                <p className="text-sm text-green-700">
                  We typically respond to all inquiries within 24 hours during business days.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-green-800">Thank you! Your message has been sent successfully.</p>
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-800">Sorry, there was an error sending your message. Please try again.</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Your full name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.subject ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Brief description of your inquiry"
                  />
                  {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.message ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Please provide details about your inquiry..."
                  />
                  {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.message.length}/500 characters
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How does the AI recipe conversion work?</h3>
              <p className="text-gray-600 mb-4">
                Our AI analyzes recipe ingredients and instructions, then intelligently substitutes ingredients 
                based on your dietary requirements while maintaining flavor and texture.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is my recipe data kept private?</h3>
              <p className="text-gray-600 mb-4">
                We use your recipe data only for AI processing and service improvement. See our Privacy Policy 
                for detailed information about data handling and your rights.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-600 mb-4">
                Yes, you can cancel your subscription at any time from your account settings. 
                You'll retain access until the end of your billing period.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer enterprise solutions?</h3>
              <p className="text-gray-600 mb-4">
                Yes, we offer custom enterprise solutions for restaurants, meal planning services, 
                and nutrition companies. Contact us to discuss your needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;