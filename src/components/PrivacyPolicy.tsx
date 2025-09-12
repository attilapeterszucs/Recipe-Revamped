import React from 'react';
import { Shield, Eye, Database, Share2, Lock, AlertCircle } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Introduction */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-6 h-6 mr-2 text-blue-600" />
          Introduction
        </h2>
        <p className="text-gray-700 leading-relaxed">
          RecipeRevamp ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered recipe conversion service.
        </p>
      </section>

      {/* OpenAI Data Sharing */}
      <section className="mb-8 bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Share2 className="w-6 h-6 mr-2 text-blue-600" />
          AI Service Data Sharing (OpenAI)
        </h2>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Important Notice</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            To provide AI-powered recipe generation, we use OpenAI's ChatGPT-4o-mini service. <strong>By creating an account or signing in to Recipe Revamped, you automatically consent</strong> to the data sharing described below with OpenAI for AI recipe generation services.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">What Data is Shared</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Recipe input text (ingredients, cooking instructions, dish names)</li>
            <li>Your dietary preferences and restrictions</li>
            <li>Recipe conversion and modification requests</li>
            <li><strong>NOT shared:</strong> Personal information, email addresses, account details, or any other identifying information</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">How OpenAI Uses This Data</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>To generate personalized recipe responses</li>
            <li>To improve their AI models and services (only with your consent)</li>
            <li>For research, development, evaluation, and testing purposes</li>
            <li>OpenAI processes this data as an independent Data Controller</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-800">Your Rights & Control</h4>
              <ul className="text-sm text-amber-700 mt-2 space-y-1">
                <li>• Consent is automatically granted when you create an account or sign in</li>
                <li>• You control what recipe information you provide to our service</li>
                <li>• We recommend not including sensitive or personal information in recipes</li>
                <li>• If you do not consent to data sharing, please do not use Recipe Revamped</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Information We Collect */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Database className="w-6 h-6 mr-2 text-blue-600" />
          Information We Collect
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Email address (for authentication)</li>
              <li>Display name (optional)</li>
              <li>Profile preferences and settings</li>
              <li>Subscription and usage information</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Recipe Data</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Recipes you create, convert, or save</li>
              <li>Dietary preferences and restrictions</li>
              <li>Recipe rating and feedback</li>
              <li>Meal planning data</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Feature usage analytics</li>
              <li>Service performance metrics</li>
              <li>Error logs and diagnostics</li>
              <li>Website analytics via Google Analytics (page views, user interactions, session duration)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How We Use Your Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Eye className="w-6 h-6 mr-2 text-blue-600" />
          How We Use Your Information
        </h2>
        
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Provide and maintain our recipe conversion services</li>
          <li>Process your recipe requests and generate AI responses</li>
          <li>Manage your account and subscription</li>
          <li>Send important service updates and notifications</li>
          <li>Improve our services and develop new features</li>
          <li>Provide customer support</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      {/* Data Security */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Lock className="w-6 h-6 mr-2 text-blue-600" />
          Data Security
        </h2>
        
        <p className="text-gray-700 leading-relaxed mb-4">
          We implement appropriate technical and organizational security measures to protect your personal information:
        </p>
        
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>End-to-end encryption for data transmission</li>
          <li>Secure Firebase Authentication and Firestore database</li>
          <li>Regular security audits and updates</li>
          <li>Restricted access to personal data</li>
          <li>API keys and sensitive data stored securely on backend servers</li>
        </ul>
      </section>

      {/* Data Retention */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
        <p className="text-gray-700 leading-relaxed">
          We retain your personal information only for as long as necessary to provide our services and comply with legal obligations. Recipe data is retained while your account is active. You can request deletion of your data at any time.
        </p>
      </section>

      {/* Your Rights */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
        <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Access your personal information</li>
          <li>Correct inaccurate or incomplete information</li>
          <li>Delete your account and associated data</li>
          <li>Export your recipe data</li>
          <li>Discontinue use of the service if you do not consent to OpenAI data sharing</li>
          <li>Object to processing of your personal information</li>
        </ul>
      </section>

      {/* Third-Party Services */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Firebase (Google)</h3>
            <p className="text-gray-700">Authentication, database, and hosting services. See Google's Privacy Policy.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Google Analytics</h3>
            <p className="text-gray-700">Website analytics and usage tracking to improve our service. Collects anonymized data about page views, user interactions, and performance metrics. See Google's Privacy Policy for details.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">OpenAI</h3>
            <p className="text-gray-700">AI-powered recipe generation (with your consent). See OpenAI's Privacy Policy and Business Terms.</p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
        <p className="text-gray-700 leading-relaxed">
          If you have questions about this Privacy Policy or our data practices, please contact us through the app's support section or by email at privacy@reciperevamped.com.
        </p>
      </section>

      {/* Changes to Privacy Policy */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
        <p className="text-gray-700 leading-relaxed">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Continued use of the service after changes constitutes acceptance of the updated policy.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;