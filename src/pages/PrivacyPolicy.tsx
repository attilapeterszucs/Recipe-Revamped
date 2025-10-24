import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';

export const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Privacy Policy | Recipe Revamped';

    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Learn how Recipe Revamped protects your privacy and data. Comprehensive privacy policy covering data collection, usage, storage, and your rights.');
    if (!metaDescription.parentNode) {
      document.head.appendChild(metaDescription);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header>
        <AuthAwareNavigation />
      </header>

      {/* Main Content - Paper-like Document */}
      <main className="max-w-4xl mx-auto px-6 py-24">
        {/* Document Header */}
        <div className="text-center mb-16 pb-8 border-b-2 border-gray-900">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            PRIVACY POLICY
          </h1>
          <p className="text-lg text-gray-700" style={{ fontFamily: 'Georgia, serif' }}>
            Recipe Revamped
          </p>
          <div className="mt-6 text-sm text-gray-600">
            <p><strong>Effective Date:</strong> November 21, 2025</p>
            <p><strong>Last Updated:</strong> October 21, 2025</p>
          </div>
        </div>

        {/* Document Body */}
        <div className="space-y-12 text-gray-800" style={{ fontFamily: 'Georgia, serif', lineHeight: '1.8' }}>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. INTRODUCTION</h2>
            <p className="mb-4 text-justify">
              Recipe Revamped ("we", "us", or "our") is committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered recipe conversion service ("the Service"). By using the Service, you consent to the data practices described in this policy.
            </p>
            <p className="mb-4 text-justify">
              This Privacy Policy applies to all users of Recipe Revamped, regardless of their subscription plan (Free, Chef, or Master Chef), and covers both our website and application services.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. INFORMATION WE COLLECT</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">2.1 Account Information</h3>
            <p className="mb-2">When you create an account, we collect:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Email address (required for authentication and communication)</li>
              <li>Password (encrypted and hashed using industry-standard security)</li>
              <li>Display name (optional)</li>
              <li>Profile picture (optional, for paid plan users)</li>
              <li>Subscription plan information and payment status</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.2 Recipe and Dietary Information</h3>
            <p className="mb-2">To provide our AI-powered recipe conversion service, we collect and process:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Recipe content you input (ingredients, instructions, dish names)</li>
              <li>Dietary preferences and restrictions you select</li>
              <li>Health conditions and medical dietary requirements</li>
              <li>Personal health goals and nutritional targets</li>
              <li>Medical restrictions related to food and nutrition</li>
              <li>Recipe conversion requests and modification preferences</li>
              <li>Saved recipes in your Recipe Book (paid plans only)</li>
              <li>Meal planning data and calendar information (paid plans only)</li>
              <li>User-added notes and custom recipe tags</li>
            </ul>

            <p className="mb-4 text-justify font-semibold">
              IMPORTANT: All users (Free, Chef, and Master Chef) who use our recipe conversion service automatically consent to sharing recipe-related data with OpenAI's ChatGPT 4o mini model for AI-powered recipe generation. Personal identifying information (name, address, email, payment details) is NEVER shared with OpenAI.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.3 Analytics and Usage Information</h3>
            <p className="mb-4 text-justify font-semibold bg-yellow-50 border-l-4 border-yellow-400 p-4">
              CONSENT REQUIRED: We use Google Analytics 4 (GA4) to collect analytics data. <strong>NO analytics tracking occurs unless you explicitly accept analytics cookies</strong> by either (1) clicking "Accept All" in our cookie banner, or (2) enabling "Analytics Cookies" in the customize cookie settings. Google Analytics will NOT load or track your activity until you provide consent.
            </p>
            <p className="mb-2">When you consent to analytics cookies, the following data is collected:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li><strong>Page View Data:</strong> Page URLs, page titles, referring URLs, and time spent on pages</li>
              <li><strong>User Engagement:</strong> Navigation patterns, button clicks, feature interactions, and conversion events</li>
              <li><strong>Geographic Information:</strong> Country, region, and city (derived from IP address, not precise GPS location)</li>
              <li><strong>Demographic Data:</strong> Estimated age range, gender, and interests (provided by Google Signals when enabled)</li>
              <li><strong>Device Information:</strong> Browser type and version, operating system, screen resolution, and device category (mobile/desktop/tablet)</li>
              <li><strong>Traffic Sources:</strong> Referral websites, search engines, campaign parameters, and marketing attribution</li>
              <li><strong>Usage Statistics:</strong> Daily recipe conversion counts, feature usage frequency, and session duration</li>
              <li><strong>Custom Dimensions:</strong> User type (free/paid), subscription status, and user segment (when applicable)</li>
            </ul>

            <p className="mb-4 text-justify">
              <strong>Google Analytics Configuration:</strong> We have configured GA4 with the following settings: (1) Automatic page view tracking enabled for all route changes, (2) Google Signals enabled to collect demographics and interests data, (3) Ad personalization disabled - we do NOT use your data for personalized advertising, (4) Geographic data collection enabled (non-anonymized IP) to provide location-based insights, and (5) Secure cookie handling with SameSite=None and Secure flags.
            </p>

            <p className="mb-4 text-justify">
              <strong>Data Sharing with Google:</strong> When you consent to analytics cookies, your usage data is transmitted to Google Analytics servers. Google processes this data according to their Privacy Policy and our Data Processing Agreement. You can opt-out of Google Analytics tracking at any time through our cookie settings or by using browser extensions like Google Analytics Opt-out Add-on.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.4 Technical and Security Information</h3>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>IP address (for security, fraud prevention, and geographic compliance)</li>
              <li>Browser type, version, and language preferences</li>
              <li>Operating system and device characteristics</li>
              <li>Performance data and error logs</li>
              <li>Authentication tokens and session identifiers</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.5 Payment Information</h3>
            <p className="mb-4 text-justify">
              Payment processing is handled securely by Stripe. We do not store your complete credit card information on our servers. We receive and store only transaction confirmations, subscription status, and billing history necessary for account management.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. HOW WE USE YOUR INFORMATION</h2>
            <p className="mb-2">We use collected information for the following purposes:</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.1 Service Provision and Improvement</h3>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Providing AI-powered recipe conversion using OpenAI's ChatGPT 4o mini model</li>
              <li>Storing and managing your saved recipes and meal plans</li>
              <li>Maintaining your account and authentication</li>
              <li>Processing payments and managing subscriptions via Stripe</li>
              <li>Improving our AI algorithms and service quality (using aggregated, anonymized data)</li>
              <li>Developing new features and optimizing user experience</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.2 Communication</h3>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Sending service-related notifications (account verification, password resets)</li>
              <li>Providing customer support and responding to inquiries</li>
              <li>Sending subscription and billing notifications</li>
              <li>Notifying you of important service updates or changes</li>
              <li>Sending marketing communications (only with your consent, with easy opt-out)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.3 Analytics and Advertising</h3>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Analyzing user behavior and service usage patterns</li>
              <li>Measuring advertising campaign effectiveness</li>
              <li>Creating audience segments for targeted advertising</li>
              <li>Personalizing ad delivery across Google's advertising network</li>
              <li>Conducting A/B testing and feature experimentation</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.4 Security and Legal Compliance</h3>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Preventing fraud, abuse, and unauthorized access</li>
              <li>Ensuring platform security and data integrity</li>
              <li>Complying with legal obligations and regulatory requirements</li>
              <li>Responding to law enforcement requests when legally required</li>
              <li>Enforcing our Terms of Service and protecting our legal rights</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. INFORMATION SHARING AND DISCLOSURE</h2>
            <p className="mb-4 text-justify font-bold">
              We do NOT sell your personal information for monetary consideration. However, we share certain data with third parties as described below.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">4.1 OpenAI (ChatGPT 4o Mini)</h3>
            <p className="mb-2">We share the following recipe-related data with OpenAI for all users:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Complete recipe content (ingredients, instructions, dish names)</li>
              <li>Dietary preferences and restrictions</li>
              <li>Health conditions and medical dietary requirements</li>
              <li>Recipe conversion requests and modification preferences</li>
              <li>Personal health goals and nutritional targets</li>
              <li>Medical restrictions related to food and nutrition</li>
            </ul>
            <p className="mb-4 text-justify font-semibold">
              Personal identifying information (name, email address, physical address, payment information, account credentials) is NEVER shared with OpenAI.
            </p>
            <p className="mb-4 text-justify">
              OpenAI processes this data according to their own Terms of Use and Privacy Policy. They may use submitted data to improve their AI models and services. By using Recipe Revamped, you acknowledge and consent to this data sharing with OpenAI.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.2 Google Analytics and Google Ads</h3>
            <p className="mb-2">We share analytics and behavioral data with Google for advertising and analytics purposes:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Website usage patterns and user behavior</li>
              <li>Demographics and interest data</li>
              <li>Conversion events and engagement metrics</li>
              <li>Device and browser characteristics</li>
              <li>Geographic location (city/region level)</li>
              <li>Marketing campaign effectiveness data</li>
            </ul>
            <p className="mb-4 text-justify">
              This data sharing enables advertising measurement, audience creation for targeted ads, and personalized ad delivery across Google's advertising network. You can opt-out of this sharing through our cookie settings.
            </p>
            <p className="mb-4 text-justify font-semibold">
              Note for US Residents: Under certain state privacy laws (CCPA, VCDPA, etc.), sharing data with Google Ads may be considered a "sale" or "sharing" of personal information. You have the right to opt-out.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.3 Service Providers</h3>
            <p className="mb-2">We share information with trusted third-party service providers:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li><strong>Firebase (Google):</strong> Authentication, cloud storage, and database services</li>
              <li><strong>Google Cloud Platform:</strong> Serverless computing and API hosting (Cloud Run)</li>
              <li><strong>Stripe:</strong> Payment processing and subscription management</li>
              <li><strong>Email Service Provider:</strong> Transactional and marketing email delivery</li>
            </ul>
            <p className="mb-4 text-justify">
              These service providers are contractually bound to protect your information and use it only for the purposes we specify.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.4 Legal Requirements and Safety</h3>
            <p className="mb-2">We may disclose your information when required by law or to protect rights and safety:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Compliance with legal obligations, court orders, or government requests</li>
              <li>Enforcement of our Terms of Service and other agreements</li>
              <li>Protection of our legal rights and property</li>
              <li>Prevention of fraud, security threats, or illegal activity</li>
              <li>Protection of the safety of our users or the public</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.5 Business Transfers</h3>
            <p className="mb-4 text-justify">
              In the event of a merger, acquisition, reorganization, or sale of assets, your information may be transferred to the acquiring entity. We will notify you via email and/or a prominent notice on our website before your information is transferred and becomes subject to a different privacy policy.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. DATA SECURITY</h2>
            <p className="mb-4 text-justify">
              We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the Internet or electronic storage is one hundred percent (100%) secure.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">5.1 Security Measures</h3>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>End-to-end encryption for saved recipes and sensitive data</li>
              <li>TLS/SSL encryption for all data transmission (HTTPS)</li>
              <li>Firebase Authentication with two-factor authentication (2FA) support</li>
              <li>Encrypted password storage using bcrypt hashing</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Content Security Policy (CSP) headers to prevent XSS attacks</li>
              <li>OWASP compliance and security best practices</li>
              <li>Secure API endpoints with authentication and rate limiting</li>
              <li>Regular backups with encrypted storage</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.2 Data Retention</h3>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Account data: Retained until you delete your account</li>
              <li>Saved recipes: Retained until you manually delete them</li>
              <li>Analytics data: Anonymized after ninety (90) days</li>
              <li>Server logs: Deleted after thirty (30) days</li>
              <li>Payment records: Retained for seven (7) years for tax and legal compliance</li>
              <li>Deleted account data: Permanently removed within thirty (30) days</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.3 Data Breach Notification</h3>
            <p className="mb-4 text-justify">
              In the event of a data breach that may compromise your personal information, we will notify affected users within seventy-two (72) hours via email and provide details about the breach, data affected, and steps being taken to address the situation.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. YOUR PRIVACY RIGHTS</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">6.1 General Rights (All Users)</h3>
            <p className="mb-2">You have the following rights regarding your personal information:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li><strong>Right to Access:</strong> Request a copy of your personal information</li>
              <li><strong>Right to Correction:</strong> Update or correct inaccurate data</li>
              <li><strong>Right to Deletion:</strong> Request deletion of your account and personal data</li>
              <li><strong>Right to Data Portability:</strong> Export your saved recipes in JSON or PDF format</li>
              <li><strong>Right to Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Right to Object:</strong> Object to certain data processing activities</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">6.2 US State Privacy Rights</h3>

            <div className="ml-6 mb-4">
              <p className="font-semibold mb-2">California (CCPA/CPRA):</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Right to know what personal information is collected</li>
                <li>Right to delete personal information</li>
                <li>Right to correct inaccurate information</li>
                <li>Right to opt-out of sale/sharing for advertising purposes</li>
                <li>Right to limit use of sensitive personal information</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
              </ul>
            </div>

            <div className="ml-6 mb-4">
              <p className="font-semibold mb-2">Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah, Oregon, Montana, Texas, Florida:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Right to access, correct, and delete personal information</li>
                <li>Right to data portability</li>
                <li>Right to opt-out of targeted advertising</li>
                <li>Right to opt-out of sale of personal information</li>
                <li>Right to opt-out of profiling for significant decisions</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">6.3 GDPR Rights (European Union & UK)</h3>
            <p className="mb-2">If you are located in the EU or UK, you have additional rights under GDPR:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Right to withdraw consent at any time</li>
              <li>Right to restriction of processing</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
              <li>Right to object to automated decision-making</li>
              <li>Right to erasure ("right to be forgotten")</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">6.4 Exercising Your Rights</h3>
            <p className="mb-4 text-justify">
              To exercise any of these rights, please contact us at <strong>privacy@reciperevamped.com</strong> or through your account settings. We will respond to verified requests within thirty (30) days (forty-five (45) days for complex requests). We may require identity verification before processing requests.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. COOKIES AND TRACKING TECHNOLOGIES</h2>
            <p className="mb-4 text-justify">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage, and enable advertising. For detailed information about our cookie practices, please review our <Link to="/cookie-policy" className="underline text-blue-600 hover:text-blue-800">Cookie Policy</Link>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">7.1 Types of Cookies We Use</h3>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li><strong>Essential Cookies:</strong> Required for authentication and security (cannot be disabled)</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and choices</li>
              <li><strong>Analytics Cookies:</strong> Google Analytics for usage analysis (can be disabled)</li>
              <li><strong>Advertising Cookies:</strong> Google Ads integration for personalized advertising (can be disabled)</li>
            </ul>

            <p className="mb-4 text-justify">
              You can manage your cookie preferences through our cookie consent banner or in your account settings.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. INTERNATIONAL DATA TRANSFERS</h2>
            <p className="mb-4 text-justify">
              Recipe Revamped is operated from Hungary (European Union). Your information may be transferred to, stored, and processed in the United States and other countries where our service providers (OpenAI, Google Cloud, Firebase, Stripe) operate.
            </p>
            <p className="mb-4 text-justify">
              When transferring data internationally, we ensure appropriate safeguards are in place, including:
            </p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Adequacy decisions recognizing equivalent data protection levels</li>
              <li>Data Processing Agreements with third-party service providers</li>
              <li>Compliance with GDPR requirements for international transfers</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. CHILDREN'S PRIVACY</h2>
            <p className="mb-4 text-justify">
              The Service is not directed to children under the age of thirteen (13). We do not knowingly collect personal information from children under 13. If you are under 13, do not use the Service or provide any information to us.
            </p>
            <p className="mb-4 text-justify">
              Users between thirteen (13) and eighteen (18) years of age must have parental or guardian consent before creating an account. If we learn that we have collected personal information from a child under 13 without verified parental consent, we will delete that information immediately.
            </p>
            <p className="mb-4 text-justify">
              Parents or guardians who believe their child has provided personal information to us should contact us at <strong>privacy@reciperevamped.com</strong>.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. CHANGES TO THIS PRIVACY POLICY</h2>
            <p className="mb-4 text-justify">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will notify you by:
            </p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Sending an email to the address associated with your account</li>
              <li>Posting a prominent notice on our website</li>
              <li>Requiring acknowledgment when you next log in</li>
            </ul>
            <p className="mb-4 text-justify">
              Material changes will be effective thirty (30) days after notification. For non-material changes, we will update the "Last Updated" date at the top of this policy. Your continued use of the Service after changes become effective constitutes acceptance of the revised Privacy Policy.
            </p>
          </section>

          {/* Section 11 - Contact */}
          <section className="border-t-2 border-gray-300 pt-12 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">11. CONTACT INFORMATION</h2>

            <p className="mb-6 text-justify">
              For questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>

            <div className="ml-6 space-y-3">
              <p>
                <strong>Recipe Revamped - Privacy Team</strong><br />
                Besnyő, Akácfa utca 8<br />
                2456 Hungary
              </p>

              <p>
                <strong>Email:</strong> privacy@reciperevamped.com
              </p>

              <p>
                <strong>Data Protection Officer:</strong> dpo@reciperevamped.com
              </p>

              <p>
                <strong>Website:</strong> <Link to="/" className="underline text-blue-600 hover:text-blue-800">https://reciperevamped.com</Link>
              </p>

              <p className="text-sm text-gray-600">
                <strong>Response Time:</strong> We respond to all privacy requests within thirty (30) days.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-300">
              <p className="text-sm text-gray-600">
                <strong>Related Legal Documents:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• <Link to="/terms-of-service" className="underline text-blue-600 hover:text-blue-800">Terms of Service</Link></li>
                <li>• <Link to="/cookie-policy" className="underline text-blue-600 hover:text-blue-800">Cookie Policy</Link></li>
              </ul>
            </div>
          </section>

          {/* Document Footer */}
          <div className="border-t-2 border-gray-900 pt-8 mt-16 text-center">
            <p className="text-sm text-gray-600 mb-2">
              <strong>END OF PRIVACY POLICY</strong>
            </p>
            <p className="text-xs text-gray-500">
              © 2025 Recipe Revamped. All rights reserved.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};
