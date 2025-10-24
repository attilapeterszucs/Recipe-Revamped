import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';

export const TermsOfService: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Terms of Service | Recipe Revamped';

    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Read our terms of service for Recipe Revamped. Understand your rights, responsibilities, and service conditions for our AI recipe conversion platform.');
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
            TERMS OF SERVICE
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. ACCEPTANCE OF TERMS</h2>
            <p className="mb-4 text-justify">
              By accessing or using Recipe Revamped ("the Service", "we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service. These Terms constitute a legally binding agreement between you and Recipe Revamped.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. DESCRIPTION OF SERVICE</h2>
            <p className="mb-4 text-justify">
              Recipe Revamped is an AI-powered recipe conversion tool that helps users adapt recipes to meet various dietary requirements, health conditions, and personal preferences. The Service utilizes OpenAI's ChatGPT 4o mini model for all users across all plans (Free, Chef, and Master Chef) to generate personalized recipe modifications and conversions.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.1 Service Plans</h3>

            <div className="ml-6 mb-4">
              <p className="font-semibold mb-2">Free Plan:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Three (3) recipe conversions per day</li>
                <li>Five (5) recipes in Recipe Book storage</li>
                <li>Basic diet filters (four options)</li>
                <li>Cloud-based processing via Firebase and Google Cloud</li>
              </ul>
            </div>

            <div className="ml-6 mb-4">
              <p className="font-semibold mb-2">Chef Plan ($14.99/month or $143.90/year):</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>One hundred (100) recipe conversions per day</li>
                <li>One hundred (100) recipes in Recipe Book storage</li>
                <li>Twelve (12) dietary filters</li>
                <li>Meal planning calendar</li>
                <li>Default recipe preferences</li>
                <li>Custom profile pictures</li>
                <li>Health Goals tracking</li>
              </ul>
            </div>

            <div className="ml-6 mb-4">
              <p className="font-semibold mb-2">Master Chef Plan ($19.99/month or $191.90/year):</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>All Chef Plan features</li>
                <li>All dietary filters (24+ options)</li>
                <li>One thousand (1,000) recipes in Recipe Book storage</li>
                <li>Two hundred (200) conversions per day</li>
                <li>Advanced nutrition analysis</li>
                <li>Recipe collections and tags</li>
                <li>Health Conditions support</li>
                <li>Backup and restore recipes</li>
                <li>Priority customer support</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. AI DATA SHARING AND CONSENT</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">3.1 OpenAI ChatGPT 4o Mini Usage</h3>
            <p className="mb-4 text-justify">
              Recipe Revamped utilizes OpenAI's ChatGPT 4o mini model to power recipe generation and conversion features for all users across all subscription plans (Free, Chef, and Master Chef). By using the Service, you automatically and explicitly consent to the sharing of your recipe-related data with OpenAI for AI-powered recipe generation services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.2 Data Shared with OpenAI</h3>
            <p className="mb-2">The following recipe-related data is transmitted to OpenAI's ChatGPT 4o mini model for all users:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Complete recipe content, including ingredients, cooking instructions, and dish names</li>
              <li>Dietary preferences and dietary restrictions</li>
              <li>Health conditions and medical dietary requirements</li>
              <li>Recipe conversion and modification preferences</li>
              <li>Personal health goals and nutritional targets</li>
              <li>Medical restrictions related to food and nutrition</li>
            </ul>

            <p className="mb-4 text-justify font-semibold">
              IMPORTANT: Personal identifying information such as your name, physical address, email address, account credentials, and payment information is NOT shared with OpenAI under any circumstances.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.3 Google Analytics Data Collection</h3>
            <p className="mb-4 text-justify">
              We use Google Analytics 4 (GA4) to collect usage data and analytics. <strong>This tracking is consent-based and only occurs after you explicitly accept analytics cookies.</strong> When you consent, we share the following data with Google:
            </p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Page views, navigation patterns, and feature interactions</li>
              <li>Geographic location (country, region, city - derived from IP address)</li>
              <li>Demographic estimates (age range, gender, interests via Google Signals)</li>
              <li>Device and browser information (type, version, operating system)</li>
              <li>Traffic sources and marketing campaign attribution</li>
              <li>User engagement metrics and conversion events</li>
            </ul>
            <p className="mb-4 text-justify">
              <strong>Ad Personalization:</strong> We have DISABLED ad personalization in our Google Analytics configuration. Your data is NOT used for personalized advertising, remarketing, or individual audience targeting. Google Signals is enabled solely for demographic reporting, not for ad personalization.
            </p>
            <p className="mb-4 text-justify">
              You may opt-out of Google Analytics tracking at any time through our cookie settings or by using browser extensions. See our <Link to="/cookie-policy" className="underline text-blue-600 hover:text-blue-800">Cookie Policy</Link> for detailed information about analytics data collection.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.4 Data Processing by Third Parties</h3>
            <p className="mb-4 text-justify">
              OpenAI may use submitted data to improve their AI models and services in accordance with their own data use policies. Users acknowledge that data shared with OpenAI is subject to OpenAI's Terms of Use and Privacy Policy. By using Recipe Revamped, you agree to OpenAI's processing of your recipe-related data as described in Section 3.2.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. USER ACCOUNTS AND RESPONSIBILITIES</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">4.1 Account Creation</h3>
            <p className="mb-4 text-justify">
              To access certain features of the Service, you must create an account. You must be at least thirteen (13) years of age to create an account. Users between thirteen (13) and eighteen (18) years of age must have parental or guardian consent.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.2 Account Security</h3>
            <p className="mb-2">You are responsible for:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Providing accurate, current, and complete information during registration</li>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Immediately notifying us of any unauthorized access or security breach</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.3 Account Termination</h3>
            <p className="mb-4 text-justify">
              We reserve the right to suspend or terminate your account at our sole discretion if you violate these Terms, engage in fraudulent activity, or for any other reason we deem appropriate. You may terminate your account at any time through the account settings page.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. SUBSCRIPTION PLANS AND BILLING</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">5.1 Payment Terms</h3>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Subscriptions are billed monthly or yearly in advance via Stripe payment processing</li>
              <li>All fees are stated in United States Dollars (USD) unless otherwise specified</li>
              <li>Prices include applicable VAT/sales tax where required by law</li>
              <li>Yearly plans offer twenty percent (20%) savings for Chef and Master Chef plans, and twenty-five percent (25%) savings for Enterprise plans</li>
              <li>Yearly subscriptions are billed as a single payment at the beginning of the subscription period</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.2 Automatic Renewal</h3>
            <p className="mb-4 text-justify">
              Unless you cancel your subscription before the end of the current billing period, your subscription will automatically renew for an equivalent period at the then-current subscription rate. You authorize us to charge your payment method for the renewal fee.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.3 Cancellation and Refunds</h3>
            <p className="mb-4 text-justify">
              You may cancel your subscription at any time through the customer portal or account settings. Upon cancellation, you will retain access to paid features until the end of your current billing period. No refunds will be provided for partial subscription periods except as required by applicable law. Refund requests must be submitted within fourteen (14) days of the original purchase for consideration.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.4 Plan Changes</h3>
            <p className="mb-4 text-justify">
              You may upgrade or downgrade your subscription plan at any time. Upgrades take effect immediately with pro-rated charges. Downgrades take effect at the end of the current billing period. When changing plans, any existing active subscription will be cancelled and pro-rated as appropriate.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.5 Price Changes</h3>
            <p className="mb-4 text-justify">
              We reserve the right to modify subscription pricing with thirty (30) days' written notice to active subscribers. Price changes will not affect your current subscription period but will apply upon renewal unless you cancel before the renewal date.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.6 Payment Failures</h3>
            <p className="mb-4 text-justify">
              If a payment fails, we will attempt to process the payment up to three (3) times. If payment continues to fail, your account may be suspended or downgraded to the Free plan. You remain responsible for any uncollected amounts.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. ACCEPTABLE USE POLICY</h2>

            <p className="mb-4 text-justify">You agree not to:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law</li>
              <li>Violate or infringe upon the rights of others, including intellectual property rights</li>
              <li>Transmit any harmful, threatening, abusive, harassing, defamatory, or obscene material</li>
              <li>Attempt to gain unauthorized access to the Service, other user accounts, or computer systems</li>
              <li>Interfere with or disrupt the Service, servers, or networks connected to the Service</li>
              <li>Use automated systems (bots, scrapers, crawlers) to access the Service without permission</li>
              <li>Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code of the Service</li>
              <li>Remove, circumvent, disable, damage, or otherwise interfere with security-related features</li>
              <li>Resell, redistribute, or commercially exploit the Service without written permission</li>
              <li>Impersonate any person or entity or falsely state or misrepresent your affiliation</li>
              <li>Upload or transmit viruses, malware, or any other malicious code</li>
              <li>Collect or store personal data about other users without their consent</li>
            </ul>

            <p className="mb-4 text-justify">
              Violation of this Acceptable Use Policy may result in immediate suspension or termination of your account without refund.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. INTELLECTUAL PROPERTY RIGHTS</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">7.1 Service Ownership</h3>
            <p className="mb-4 text-justify">
              The Service, including all content, features, functionality, software, and technology ("Service Content"), is owned by Recipe Revamped and is protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">7.2 User Content License</h3>
            <p className="mb-4 text-justify">
              You retain all ownership rights to recipes, modifications, and other content you create using the Service ("User Content"). By using the Service, you grant Recipe Revamped a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, and display your User Content solely for the purposes of operating, providing, and improving the Service.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">7.3 Restrictions</h3>
            <p className="mb-4 text-justify">
              You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any Service Content except as expressly permitted by these Terms or with our prior written consent.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">7.4 Trademarks</h3>
            <p className="mb-4 text-justify">
              "Recipe Revamped" and related logos, graphics, and service names are trademarks of Recipe Revamped. You may not use these trademarks without our prior written permission.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. PRIVACY AND DATA PROTECTION</h2>

            <p className="mb-4 text-justify">
              Your privacy is important to us. Our collection, use, and disclosure of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to our Privacy Policy and agree that we may process your information in accordance with it.
            </p>

            <p className="mb-4 text-justify">
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure cloud storage via Firebase and Google Cloud Platform</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Compliance with GDPR, CCPA, and other applicable privacy regulations</li>
            </ul>

            <p className="mb-4 text-justify">
              For detailed information about how we collect, use, and protect your data, please review our <Link to="/privacy-policy" className="underline text-blue-600 hover:text-blue-800">Privacy Policy</Link>.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. DISCLAIMERS AND LIMITATIONS OF LIABILITY</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">9.1 Medical Disclaimer</h3>
            <p className="mb-4 text-justify font-semibold">
              RECIPE REVAMPED IS NOT A MEDICAL SERVICE. THE SERVICE PROVIDES RECIPE SUGGESTIONS ONLY AND SHOULD NOT BE USED AS A SUBSTITUTE FOR PROFESSIONAL MEDICAL OR NUTRITIONAL ADVICE, DIAGNOSIS, OR TREATMENT.
            </p>
            <p className="mb-4 text-justify">
              Always consult with a qualified healthcare provider, registered dietitian, or nutritionist regarding dietary restrictions, allergies, medical conditions, or health-related questions. Recipe modifications generated by our AI should be reviewed carefully, especially for users with severe allergies, medical conditions, or specific dietary requirements.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">9.2 Service Disclaimer</h3>
            <p className="mb-4 text-justify">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p className="mb-4 text-justify">
              We do not warrant that:
            </p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>The Service will be uninterrupted, timely, secure, or error-free</li>
              <li>The results obtained from using the Service will be accurate or reliable</li>
              <li>The quality of any products, services, information, or other material obtained through the Service will meet your expectations</li>
              <li>Any errors in the Service will be corrected</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">9.3 Limitation of Liability</h3>
            <p className="mb-4 text-justify">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL RECIPE REVAMPED, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Your access to or use of or inability to access or use the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>

            <p className="mb-4 text-justify">
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES, AND CAUSES OF ACTION EXCEED THE AMOUNT YOU HAVE PAID TO US IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">9.4 Indemnification</h3>
            <p className="mb-4 text-justify">
              You agree to defend, indemnify, and hold harmless Recipe Revamped and its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees and costs, arising out of or in any way connected with your access to or use of the Service, your User Content, or your violation of these Terms.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. MODIFICATIONS TO SERVICE AND TERMS</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">10.1 Service Modifications</h3>
            <p className="mb-4 text-justify">
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice, for any reason. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">10.2 Terms Modifications</h3>
            <p className="mb-4 text-justify">
              We may revise and update these Terms from time to time at our sole discretion. Material changes will be notified to users via email or through a prominent notice on the Service at least thirty (30) days before the changes take effect. Your continued use of the Service following the posting of revised Terms constitutes your acceptance of the changes.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">11. GOVERNING LAW AND DISPUTE RESOLUTION</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">11.1 Governing Law</h3>
            <p className="mb-4 text-justify">
              These Terms shall be governed by and construed in accordance with the laws of Hungary and the European Union, without regard to conflict of law principles. For users in the United States, these Terms are also subject to applicable federal and state laws.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">11.2 Dispute Resolution</h3>
            <p className="mb-4 text-justify">
              Any dispute, controversy, or claim arising out of or relating to these Terms or the Service shall first be attempted to be resolved through good faith negotiation between the parties. If negotiation fails, disputes may be resolved through binding arbitration or, where permitted, small claims court proceedings.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">11.3 Jurisdiction</h3>
            <p className="mb-4 text-justify">
              Subject to the arbitration provisions above, you agree to submit to the personal and exclusive jurisdiction of the courts located in Budapest, Hungary for the resolution of any disputes. For users in the United States, disputes may also be brought in federal or state courts having jurisdiction over the user's location.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">11.4 Class Action Waiver</h3>
            <p className="mb-4 text-justify">
              Where permitted by law, you agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action. You waive your right to participate in a class action lawsuit or class-wide arbitration.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">12. US LEGAL COMPLIANCE</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">12.1 State Privacy Laws</h3>
            <p className="mb-4 text-justify">
              For residents of California, Virginia, Colorado, Connecticut, and other states with comprehensive privacy laws, you have specific rights regarding your personal information as detailed in our Privacy Policy. These include rights to access, correct, delete, and opt-out of the sale or sharing of personal information for advertising purposes.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">12.2 COPPA Compliance</h3>
            <p className="mb-4 text-justify">
              The Service is not directed to children under the age of thirteen (13). We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">12.3 CAN-SPAM Act</h3>
            <p className="mb-4 text-justify">
              All marketing emails sent by Recipe Revamped comply with the CAN-SPAM Act, including clear sender identification, honest subject lines, easy unsubscribe mechanisms, and disclosure of our physical address.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">13. GENERAL PROVISIONS</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">13.1 Entire Agreement</h3>
            <p className="mb-4 text-justify">
              These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and Recipe Revamped regarding the use of the Service and supersede all prior agreements and understandings.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">13.2 Severability</h3>
            <p className="mb-4 text-justify">
              If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">13.3 Waiver</h3>
            <p className="mb-4 text-justify">
              No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term, and our failure to assert any right or provision under these Terms shall not constitute a waiver of such right or provision.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">13.4 Assignment</h3>
            <p className="mb-4 text-justify">
              You may not assign or transfer these Terms or your account without our prior written consent. We may assign or transfer these Terms at our sole discretion without restriction.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">13.5 Force Majeure</h3>
            <p className="mb-4 text-justify">
              We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, network infrastructure failures, strikes, or shortages of transportation facilities, fuel, energy, labor, or materials.
            </p>
          </section>

          {/* Section 14 - Contact */}
          <section className="border-t-2 border-gray-300 pt-12 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">14. CONTACT INFORMATION</h2>

            <p className="mb-6 text-justify">
              For questions, concerns, or notices regarding these Terms of Service, please contact us at:
            </p>

            <div className="ml-6 space-y-3">
              <p>
                <strong>Recipe Revamped</strong><br />
                Besnyő, Akácfa utca 8<br />
                2456 Hungary
              </p>

              <p>
                <strong>Email:</strong> legal@reciperevamped.com
              </p>

              <p>
                <strong>Website:</strong> <Link to="/" className="underline text-blue-600 hover:text-blue-800">https://reciperevamped.com</Link>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-300">
              <p className="text-sm text-gray-600">
                <strong>Related Legal Documents:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• <Link to="/privacy-policy" className="underline text-blue-600 hover:text-blue-800">Privacy Policy</Link></li>
                <li>• <Link to="/cookie-policy" className="underline text-blue-600 hover:text-blue-800">Cookie Policy</Link></li>
              </ul>
            </div>
          </section>

          {/* Document Footer */}
          <div className="border-t-2 border-gray-900 pt-8 mt-16 text-center">
            <p className="text-sm text-gray-600 mb-2">
              <strong>END OF TERMS OF SERVICE</strong>
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
