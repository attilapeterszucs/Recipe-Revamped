import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthAwareNavigation } from '../components/AuthAwareNavigation';

export const CookiePolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Cookie Policy | Recipe Revamped';

    const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    metaDescription.setAttribute('content', 'Learn about how Recipe Revamped uses cookies and similar technologies. Understand our cookie practices and manage your preferences.');
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
            COOKIE POLICY
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
              This Cookie Policy explains how Recipe Revamped ("we", "us", or "our") uses cookies and similar tracking technologies when you visit our website and use our AI-powered recipe conversion service ("the Service"). This policy should be read in conjunction with our <Link to="/privacy-policy" className="underline text-blue-600 hover:text-blue-800">Privacy Policy</Link> and <Link to="/terms-of-service" className="underline text-blue-600 hover:text-blue-800">Terms of Service</Link>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">1.1 What Are Cookies?</h3>
            <p className="mb-4 text-justify">
              Cookies are small text files that are placed on your device (computer, tablet, or mobile phone) when you visit a website. Cookies are widely used by website owners to make their websites work more efficiently, provide a better user experience, and gather analytics information.
            </p>
            <p className="mb-4 text-justify">
              Cookies can be "session cookies" (which are deleted when you close your browser) or "persistent cookies" (which remain on your device until deleted or until they reach their expiration date).
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. TYPES OF COOKIES WE USE</h2>
            <p className="mb-4 text-justify">
              Recipe Revamped uses the following categories of cookies:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">2.1 Essential Cookies (Strictly Necessary)</h3>
            <p className="mb-2">These cookies are absolutely necessary for the Service to function properly. They cannot be disabled without severely impacting your ability to use the Service.</p>

            <p className="mb-2 font-semibold mt-4">Purpose:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>User authentication and session management</li>
              <li>Security and fraud prevention (CSRF protection)</li>
              <li>Load balancing and server routing</li>
              <li>Remembering items in your shopping cart or form inputs</li>
              <li>Enabling core features of the Service</li>
            </ul>

            <p className="mb-2 font-semibold">Specific Cookies:</p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Cookie Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">auth_token</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">User authentication via Firebase</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">24 hours</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">session_id</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">Session management</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">Session only</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">csrf_token</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">Cross-site request forgery protection</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">Session only</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">__session</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">Firebase authentication session</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">Persistent</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mb-4 text-justify font-semibold">
              Legal Basis: These cookies are necessary for the legitimate operation of the Service and do not require consent under applicable law.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.2 Preference Cookies (Functionality)</h3>
            <p className="mb-2">These cookies remember your preferences and choices to provide a personalized experience.</p>

            <p className="mb-2 font-semibold mt-4">Purpose:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Remembering your cookie consent choices</li>
              <li>Storing theme preferences (dark mode/light mode)</li>
              <li>Saving language and regional settings</li>
              <li>Remembering UI layout preferences</li>
              <li>Storing notification preferences</li>
            </ul>

            <p className="mb-2 font-semibold">Specific Cookies:</p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Cookie Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">cookie_consent</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">Your cookie preference choices</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">1 year</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">user_preferences</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">UI settings and preferences</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">1 year</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">theme_preference</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">Dark/light mode selection</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.3 Analytics Cookies (Performance)</h3>
            <p className="mb-4 text-justify font-semibold">
              CONSENT REQUIRED - NO TRACKING WITHOUT YOUR PERMISSION: These cookies are <strong>DISABLED by default</strong>. Analytics tracking ONLY occurs after you explicitly consent by either: (1) Clicking "Accept All" in the cookie consent banner, or (2) Enabling "Analytics Cookies" in the customize cookie settings popup. Google Analytics will NOT load, NO cookies will be set, and NO data will be collected until you provide explicit consent.
            </p>

            <p className="mb-2 font-semibold mt-4">What We Track (Only With Your Consent):</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li><strong>Page Views:</strong> All page navigation including single-page app (SPA) route changes</li>
              <li><strong>User Engagement:</strong> Button clicks, feature interactions, time spent on pages, and scroll depth</li>
              <li><strong>Traffic Sources:</strong> Referral websites, search engines, campaign parameters, and UTM tracking</li>
              <li><strong>Geographic Data:</strong> Country, region, and city derived from your IP address (not precise GPS location)</li>
              <li><strong>Demographic Information:</strong> Estimated age range, gender, and interests provided by Google Signals</li>
              <li><strong>Device Information:</strong> Browser type/version, operating system, screen resolution, device category</li>
              <li><strong>Performance Metrics:</strong> Page load times, error rates, and feature usage statistics</li>
              <li><strong>Custom Events:</strong> Recipe conversions, user type (free/paid), and subscription status</li>
            </ul>

            <p className="mb-2 font-semibold">Google Analytics 4 (GA4) Configuration:</p>
            <p className="mb-4 text-justify">
              We use Google Analytics 4 (Property ID: G-CR787RJ2VK) with the following configuration:
            </p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li><strong>Automatic Page View Tracking:</strong> Enabled - all route changes are automatically tracked</li>
              <li><strong>Google Signals:</strong> Enabled - collects demographics and interests data for logged-in Google users</li>
              <li><strong>Ad Personalization:</strong> Disabled - your data is NOT used for personalized advertising</li>
              <li><strong>IP Anonymization:</strong> Disabled - full IP addresses are collected to provide accurate geographic insights</li>
              <li><strong>Cookie Security:</strong> All cookies use SameSite=None and Secure flags for enhanced security</li>
              <li><strong>Data Retention:</strong> User-level data retained for 14 months, event-level data for 2 months</li>
            </ul>

            <p className="mb-4 text-justify">
              <strong>Data Sharing with Google:</strong> When you consent to analytics cookies, your usage data is transmitted to Google's servers in the United States. Google processes this data as a data processor on our behalf according to their <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">Privacy Policy</a> and our Data Processing Agreement.
            </p>

            <p className="mb-2 font-semibold">Google Analytics Cookies:</p>

            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Cookie Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">_ga</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">Unique visitor identification</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">2 years</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">_ga_*</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">Session state storage for Google Analytics 4</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">2 years</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">_gid</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">User session identification</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">24 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mb-4 text-justify">
              <strong>Opt-Out Options:</strong> You can disable analytics cookies through our cookie settings banner or by using the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">Google Analytics Opt-out Browser Add-on</a>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.4 Advertising Cookies (Targeting/Marketing)</h3>
            <p className="mb-4 text-justify">
              <strong>IMPORTANT:</strong> Recipe Revamped has <strong>DISABLED ad personalization</strong> in our Google Analytics configuration. We do NOT use your personal data to serve personalized advertisements. Our advertising integration is limited to:
            </p>

            <p className="mb-2 font-semibold mt-4">What We Track for Marketing (Non-Personalized):</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li><strong>Campaign Effectiveness:</strong> Measuring which marketing campaigns drive traffic and conversions</li>
              <li><strong>Conversion Attribution:</strong> Understanding which traffic sources lead to sign-ups and subscriptions</li>
              <li><strong>Aggregated Demographics:</strong> Viewing general audience characteristics (age ranges, interests) at the aggregate level</li>
              <li><strong>Geographic Performance:</strong> Analyzing which regions respond best to our marketing efforts</li>
              <li><strong>Device Insights:</strong> Understanding device preferences (mobile vs desktop) for optimization</li>
            </ul>

            <p className="mb-4 text-justify">
              <strong>What We Do NOT Do:</strong> We do not enable personalized advertising features, remarketing, or audience targeting based on individual user behavior. Google Signals is enabled solely for demographic reporting purposes, NOT for ad personalization.
            </p>

            <p className="mb-2 font-semibold">Marketing Data Processing:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>All marketing analytics data is processed in aggregate form</li>
              <li>Individual user profiles are NOT created for advertising purposes</li>
              <li>Your browsing behavior on our site is NOT used to show you personalized ads elsewhere</li>
              <li>We do not share personally identifiable information with advertising networks</li>
            </ul>

            <p className="mb-4 text-justify font-semibold">
              Important for US Residents: Under certain state privacy laws (CCPA, VCDPA, etc.), sharing data with Google Ads may be considered a "sale" or "sharing" of personal information. You have the right to opt-out through our cookie settings.
            </p>

            <p className="mb-4 text-justify">
              You can control advertising cookies through our cookie consent banner or by visiting <a href="https://adssettings.google.com" className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">Google Ad Settings</a>.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. THIRD-PARTY COOKIES</h2>
            <p className="mb-4 text-justify">
              In addition to our own cookies, we use cookies from trusted third-party service providers to deliver specific functionality and features.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">3.1 Third-Party Services We Use</h3>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Firebase (Google Cloud)</h4>
              <p className="mb-2 text-justify">Used for authentication, database, and cloud storage services.</p>
              <ul className="list-disc ml-6 space-y-1 mb-2 text-sm">
                <li>Cookie: __session (authentication session management)</li>
                <li>Cookie: firebase-heartbeat-* (service health monitoring)</li>
                <li>Duration: Persistent</li>
              </ul>
              <p className="text-sm italic">Privacy Policy: <a href="https://firebase.google.com/support/privacy" className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">https://firebase.google.com/support/privacy</a></p>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Google Analytics</h4>
              <p className="mb-2 text-justify">Website analytics and user behavior tracking (with Google Ads integration).</p>
              <ul className="list-disc ml-6 space-y-1 mb-2 text-sm">
                <li>Cookies: _ga, _ga_*, _gid (described in Section 2.3)</li>
                <li>Analytics ID: G-CR787RJ2VK</li>
                <li>Includes: Google Ads integration for advertising measurement</li>
              </ul>
              <p className="text-sm italic">Privacy Policy: <a href="https://policies.google.com/privacy" className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a></p>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Stripe</h4>
              <p className="mb-2 text-justify">Payment processing and subscription management services.</p>
              <ul className="list-disc ml-6 space-y-1 mb-2 text-sm">
                <li>Cookies set by Stripe for fraud detection and payment security</li>
                <li>Duration: Varies by cookie type</li>
              </ul>
              <p className="text-sm italic">Privacy Policy: <a href="https://stripe.com/privacy" className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a></p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.2 Services We Do NOT Use</h3>
            <p className="mb-2">For transparency, we want to clarify that we do NOT use the following services:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>No Facebook/Meta pixels or tracking cookies</li>
              <li>No TikTok, Twitter/X, or other social media advertising pixels</li>
              <li>No third-party advertising networks beyond Google Ads</li>
              <li>No social media widgets or sharing buttons that track users</li>
              <li>No affiliate marketing tracking cookies</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. MANAGING YOUR COOKIE PREFERENCES</h2>
            <p className="mb-4 text-justify">
              You have several options to control and manage cookies on your device.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">4.1 Our Cookie Consent Tool</h3>
            <p className="mb-4 text-justify">
              When you first visit Recipe Revamped, you will see a cookie consent banner allowing you to accept or customize your cookie preferences. You can change your preferences at any time by:
            </p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Clicking the cookie settings link in the website footer</li>
              <li>Accessing cookie preferences through your account settings</li>
              <li>Clearing the cookie_consent cookie to reset your choices</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.2 Browser-Level Cookie Control</h3>
            <p className="mb-4 text-justify">
              Most web browsers allow you to control cookies through their settings. You can typically find cookie settings in the "Options", "Preferences", or "Settings" menu of your browser.
            </p>

            <div className="mb-4">
              <p className="font-semibold mb-2">Desktop Browsers:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong>Google Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Mozilla Firefox:</strong> Preferences → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
              </ul>
            </div>

            <div className="mb-4">
              <p className="font-semibold mb-2">Mobile Browsers:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong>iOS Safari:</strong> Settings → Safari → Privacy & Security</li>
                <li><strong>Android Chrome:</strong> Settings → Site settings → Cookies</li>
                <li><strong>Samsung Internet:</strong> Settings → Privacy and security → Block cookies</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.3 Opting Out of Targeted Advertising</h3>
            <p className="mb-2">You can opt-out of personalized advertising through:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li><strong>Google Ad Settings:</strong> <a href="https://adssettings.google.com" className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">https://adssettings.google.com</a></li>
              <li><strong>Google Analytics Opt-out:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">https://tools.google.com/dlpage/gaoptout</a></li>
              <li><strong>Network Advertising Initiative:</strong> <a href="https://optout.networkadvertising.org" className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">https://optout.networkadvertising.org</a></li>
              <li><strong>Digital Advertising Alliance:</strong> <a href="https://optout.aboutads.info" className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">https://optout.aboutads.info</a></li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.4 Do Not Track (DNT) Signals</h3>
            <p className="mb-4 text-justify">
              Some browsers offer a "Do Not Track" (DNT) signal. However, there is no universal standard for how websites should respond to DNT signals. Currently, we do not alter our data collection and use practices in response to DNT signals. We respect your privacy choices made through our cookie consent tool and browser settings.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.5 Impact of Disabling Cookies</h3>
            <p className="mb-2">Please note that disabling certain cookies may impact your experience:</p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li><strong>Essential Cookies:</strong> Disabling these will prevent you from logging in and using core features</li>
              <li><strong>Preference Cookies:</strong> Your settings and preferences will not be remembered across sessions</li>
              <li><strong>Analytics Cookies:</strong> We will not be able to improve the Service based on usage data</li>
              <li><strong>Advertising Cookies:</strong> Ads may be less relevant to your interests</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. UPDATES TO THIS COOKIE POLICY</h2>
            <p className="mb-4 text-justify">
              We may update this Cookie Policy from time to time to reflect changes in technology, legal requirements, or our cookie practices. When we make material changes, we will notify you by:
            </p>
            <ul className="list-disc ml-6 space-y-2 mb-4">
              <li>Posting a prominent notice on our website</li>
              <li>Sending an email to registered users (for significant changes)</li>
              <li>Requiring acknowledgment through the cookie consent banner</li>
            </ul>
            <p className="mb-4 text-justify">
              Minor clarifications and updates will be reflected by updating the "Last Updated" date at the top of this policy. Material changes will be effective thirty (30) days after notification.
            </p>
          </section>

          {/* Section 6 - Contact */}
          <section className="border-t-2 border-gray-300 pt-12 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. CONTACT INFORMATION</h2>

            <p className="mb-6 text-justify">
              If you have questions, concerns, or requests regarding this Cookie Policy or our use of cookies, please contact us at:
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
                <strong>Cookie Questions:</strong> cookies@reciperevamped.com
              </p>

              <p>
                <strong>Website:</strong> <Link to="/" className="underline text-blue-600 hover:text-blue-800">https://reciperevamped.com</Link>
              </p>

              <p className="text-sm text-gray-600">
                <strong>Response Time:</strong> Cookie questions answered within five (5) business days.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-300">
              <p className="text-sm text-gray-600">
                <strong>Related Legal Documents:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• <Link to="/terms-of-service" className="underline text-blue-600 hover:text-blue-800">Terms of Service</Link></li>
                <li>• <Link to="/privacy-policy" className="underline text-blue-600 hover:text-blue-800">Privacy Policy</Link></li>
              </ul>
            </div>
          </section>

          {/* Document Footer */}
          <div className="border-t-2 border-gray-900 pt-8 mt-16 text-center">
            <p className="text-sm text-gray-600 mb-2">
              <strong>END OF COOKIE POLICY</strong>
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
