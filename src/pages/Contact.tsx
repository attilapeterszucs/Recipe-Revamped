import React, { useState, useEffect, useRef } from 'react';
import { Mail, MapPin, Send, CheckCircle, AlertCircle, ChevronDown, Star, HelpCircle } from 'lucide-react';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';
import { SEOHead } from '../components/SEOHead';
import { useAuth } from '../hooks/useAuth';
import { CustomDropdown } from '../components/CustomDropdown';
import ReCAPTCHA from 'react-google-recaptcha';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  questions: FAQItem[];
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
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const faqCategories: FAQCategory[] = [
    {
      title: 'Getting Started',
      icon: '🚀',
      color: 'green',
      bgColor: 'from-green-50 to-emerald-50/50',
      borderColor: 'border-green-200',
      questions: [
        {
          question: 'How does the AI recipe conversion work?',
          answer: 'Our AI analyzes recipe ingredients and instructions, then intelligently substitutes ingredients based on your dietary requirements while maintaining flavor and texture. Simply paste any recipe on the Convert page and select your dietary filters.'
        },
        {
          question: 'Where do I convert recipes?',
          answer: 'Go to the "Convert" page using the navigation menu. You can paste any recipe text or URL, select your dietary filters (keto, gluten-free, etc.), and click "Generate Recipe" to get your personalized version.'
        }
      ]
    },
    {
      title: 'Settings & Personalization',
      icon: '⚙️',
      color: 'blue',
      bgColor: 'from-blue-50 to-cyan-50/50',
      borderColor: 'border-blue-200',
      questions: [
        {
          question: 'Where can I set my health goals?',
          answer: 'Visit the "Settings" page to configure your health goals, dietary preferences, and personal profile. You can set weight goals, activity levels, food allergies, and dietary restrictions to get personalized recipe recommendations.'
        },
        {
          question: 'How do I save my favorite recipes?',
          answer: 'After converting a recipe, click the "Save Recipe" button. All your saved recipes can be accessed from the "Saved Recipes" section in the navigation menu for easy reference.'
        },
        {
          question: 'Can I customize dietary filters?',
          answer: 'Yes! On the Convert page, you can select multiple dietary filters like Keto, Gluten-Free, Vegan, Low-Carb, and many more. The AI will adapt recipes to meet all your selected requirements.'
        }
      ]
    },
    {
      title: 'Features & Plans',
      icon: '💎',
      color: 'purple',
      bgColor: 'from-purple-50 to-pink-50/50',
      borderColor: 'border-purple-200',
      questions: [
        {
          question: 'What is the Meal Planner feature?',
          answer: 'The Meal Planner helps you organize your weekly meals using a calendar interface. You can drag and drop saved recipes to specific days and meals, making meal prep and grocery shopping much easier.'
        },
        {
          question: 'Do you offer different subscription plans?',
          answer: 'Yes, we offer multiple plans including Free, Chef, and Master Chef options. Each plan provides different limits on recipe conversions, storage, and advanced features. Check our pricing page for detailed comparisons.'
        },
        {
          question: 'Can I cancel my subscription anytime?',
          answer: 'Absolutely! You can cancel your subscription at any time from your account settings. You\'ll retain access to all features until the end of your current billing period.'
        }
      ]
    },
    {
      title: 'Privacy & Technical',
      icon: '🔒',
      color: 'orange',
      bgColor: 'from-orange-50 to-amber-50/50',
      borderColor: 'border-orange-200',
      questions: [
        {
          question: 'Is my recipe data kept private?',
          answer: 'We use your recipe data only for AI processing and service improvement. All data is encrypted and stored securely. See our Privacy Policy for detailed information about data handling and your rights.'
        },
        {
          question: 'What browsers are supported?',
          answer: 'Recipe Revamped works on all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version of your preferred browser.'
        },
        {
          question: 'Do you offer enterprise solutions?',
          answer: 'Yes, we offer custom enterprise solutions for restaurants, meal planning services, and nutrition companies. Enterprise plans include API access, bulk processing, and dedicated support. Contact us to discuss your needs.'
        }
      ]
    }
  ];

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

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      setSubmitStatus('error');
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
          category: formData.category,
          recaptchaToken: recaptchaToken
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
      // Reset reCAPTCHA
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
      // Reset reCAPTCHA on error
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleFAQ = (questionId: string) => {
    setOpenFAQ(openFAQ === questionId ? null : questionId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SEOHead pageKey="contact" />
      <AuthAwareNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20">
        {/* Hero Section - Landing Page Style */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Mail className="w-4 h-4" />
            Get in Touch
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We'd love to hear from you. Get in touch with our team for support, feedback, or partnership inquiries.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Contact Information */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 h-fit">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Get In Touch</h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 mr-4 flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Email Us</h3>
                    <p className="text-gray-600 text-sm break-all font-medium">info@reciperevamped.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 mr-4 flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Office</h3>
                    <p className="text-gray-600 text-sm font-medium">Besnyő, Akácfa utca 8<br />2456 Hungary</p>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="mt-8 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <h4 className="font-bold text-green-800 mb-2">Response Time</h4>
                <p className="text-sm text-green-700 leading-relaxed">
                  We typically respond to all inquiries within 24 hours during business days.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div id="contact-form" className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Send us a message</h2>

              {submitStatus === 'success' && (
                <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                  <p className="text-green-800 font-bold">Thank you! Your message has been sent successfully.</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl flex items-center">
                  <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
                  <p className="text-red-800 font-bold">Sorry, there was an error sending your message. Please try again.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block font-bold text-gray-900 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-medium transition-all duration-300 ${
                        errors.name ? 'border-red-300' : 'border-gray-300 hover:border-green-300'
                      }`}
                      placeholder="Your full name"
                    />
                    {errors.name && <p className="mt-2 text-sm text-red-600 font-medium">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block font-bold text-gray-900 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-medium transition-all duration-300 ${
                        errors.email ? 'border-red-300' : 'border-gray-300 hover:border-green-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="mt-2 text-sm text-red-600 font-medium">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block font-bold text-gray-900 mb-2">
                    Category
                  </label>
                  <CustomDropdown
                    value={formData.category}
                    onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    options={[
                      { value: 'general', label: 'General Inquiry', icon: '💬' },
                      { value: 'support', label: 'Technical Support', icon: '🛠️' },
                      { value: 'business', label: 'Business Partnership', icon: '🤝' },
                      { value: 'careers', label: 'Careers', icon: '💼' },
                      { value: 'legal', label: 'Legal Matters', icon: '⚖️' },
                      { value: 'privacy', label: 'Privacy Policy Questions', icon: '🔒' },
                      { value: 'cookies', label: 'Cookie Questions', icon: '🍪' },
                      { value: 'dpo', label: 'Data Protection Officer', icon: '🛡️' }
                    ]}
                    icon={<HelpCircle className="h-5 w-5 text-green-500" />}
                    placeholder="Select a category..."
                    ariaLabel="Select inquiry category"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block font-bold text-gray-900 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-medium transition-all duration-300 ${
                      errors.subject ? 'border-red-300' : 'border-gray-300 hover:border-green-300'
                    }`}
                    placeholder="Brief description of your inquiry"
                  />
                  {errors.subject && <p className="mt-2 text-sm text-red-600 font-medium">{errors.subject}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="block font-bold text-gray-900 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-medium transition-all duration-300 ${
                      errors.message ? 'border-red-300' : 'border-gray-300 hover:border-green-300'
                    }`}
                    placeholder="Please provide details about your inquiry..."
                  />
                  {errors.message && <p className="mt-2 text-sm text-red-600 font-medium">{errors.message}</p>}
                  <p className="mt-2 text-sm text-gray-600 font-medium">
                    {formData.message.length}/500 characters
                  </p>
                </div>

                {/* reCAPTCHA */}
                <div className="flex justify-center py-4">
                  <div className="w-full">
                    {import.meta.env.VITE_RECAPTCHA_V2_NOTAROBOT_KEY ? (
                      <div className="flex justify-center">
                        <ReCAPTCHA
                          ref={recaptchaRef}
                          sitekey={import.meta.env.VITE_RECAPTCHA_V2_NOTAROBOT_KEY}
                          onChange={(token) => setRecaptchaToken(token)}
                          onExpired={() => setRecaptchaToken(null)}
                          theme="light"
                        />
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                        <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ reCAPTCHA Not Configured</p>
                        <p className="text-xs text-yellow-700">
                          To enable spam protection, add a reCAPTCHA v2 site key to your .env file as VITE_RECAPTCHA_V2_NOTAROBOT_KEY
                        </p>
                        <p className="text-xs text-yellow-600 mt-2">
                          Get your key at: <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="underline">google.com/recaptcha/admin</a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {!recaptchaToken && submitStatus === 'error' && (
                  <p className="text-sm text-red-600 font-medium text-center">
                    Please complete the reCAPTCHA verification
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !recaptchaToken}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-105"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-5 h-5 ml-3" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section - Landing Page Style */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Star className="w-4 h-4" />
              Support
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to know about Recipe Revamped</p>
          </div>

          <div className="space-y-6">
            {faqCategories.map((category, catIndex) => (
              <div key={catIndex} className={`bg-gradient-to-br ${category.bgColor} rounded-2xl p-6 border-2 ${category.borderColor} shadow-md`}>
                <h3 className={`text-xl font-black text-${category.color}-700 mb-4 flex items-center`}>
                  <span className="text-2xl mr-3">{category.icon}</span>
                  {category.title}
                </h3>
                <div className="space-y-3">
                  {category.questions.map((faq, qIndex) => {
                    const faqId = `${catIndex}-${qIndex}`;
                    const isOpen = openFAQ === faqId;

                    return (
                      <div key={qIndex} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
                        <button
                          onClick={() => toggleFAQ(faqId)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-all duration-200"
                        >
                          <span className="font-bold text-gray-900 pr-4">{faq.question}</span>
                          <ChevronDown className={`w-5 h-5 text-${category.color}-600 flex-shrink-0 transition-transform duration-300 ease-out ${isOpen ? 'transform rotate-180' : ''}`} />
                        </button>
                        <div
                          className={`transition-all duration-500 ease-in-out overflow-hidden ${
                            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="px-5 pb-4 pt-2 border-t-2 border-gray-100">
                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Support Button */}
          <div className="text-center pt-12">
            <p className="text-gray-700 mb-5 text-lg font-bold">Still have questions? We're here to help!</p>
            <button
              onClick={() => document.querySelector('#contact-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-green-500/30 hover:scale-105 hover:shadow-xl"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
