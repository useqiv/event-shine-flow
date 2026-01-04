import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: January 4, 2026</p>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                UseQiv ("we," "our," or "us") operates the UseQiv platform, including our website, mobile applications, and related services (collectively, the "Platform"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform. By accessing or using our Platform, you consent to the practices described in this Privacy Policy. If you do not agree with this Privacy Policy, please do not access or use our Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-medium text-foreground mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, password, and profile information when you register.</li>
                <li><strong>Payment Information:</strong> Billing address, payment card details (processed securely through third-party payment processors), and transaction history.</li>
                <li><strong>Organization Information:</strong> Company name, address, contact details, and banking information for payouts.</li>
                <li><strong>Content:</strong> Photos, videos, descriptions, and other content you upload to the Platform.</li>
                <li><strong>Communications:</strong> Messages, support requests, and other communications with us or other users.</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Device Information:</strong> IP address, device type, operating system, browser type, and unique device identifiers.</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, voting patterns, purchase history, and interaction timestamps.</li>
                <li><strong>Location Data:</strong> General geographic location based on IP address.</li>
                <li><strong>Cookies and Tracking Technologies:</strong> We use cookies, web beacons, and similar technologies to enhance your experience and collect analytics.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide, maintain, and improve our Platform and services</li>
                <li>Process transactions, votes, and ticket purchases</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Send transactional communications (receipts, confirmations, updates)</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send marketing communications (with your consent where required)</li>
                <li>Analyze usage patterns to improve our services</li>
                <li>Comply with legal obligations and enforce our terms</li>
                <li>Protect the security and integrity of our Platform</li>
                <li>Facilitate payouts to organizations and influencers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-muted-foreground mb-4">We may share your information in the following circumstances:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>With Organizations:</strong> When you participate in contests, purchase tickets, or donate to campaigns, relevant information is shared with the organizing entity.</li>
                <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (payment processing, hosting, analytics, email delivery).</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority, or to protect our rights and safety.</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize sharing.</li>
                <li><strong>Aggregated Data:</strong> Non-identifiable aggregated statistics may be shared publicly or with partners.</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong>Important:</strong> We do not sell your personal information to third parties for their marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your information, including encryption, secure servers, and access controls. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security. You are responsible for maintaining the confidentiality of your account credentials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. Transaction records may be retained for extended periods as required by tax and financial regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Your Rights and Choices</h2>
              <p className="text-muted-foreground mb-4">Depending on your jurisdiction, you may have the following rights:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal retention requirements.</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time.</li>
                <li><strong>Data Portability:</strong> Request your data in a portable format where applicable.</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, contact us at privacy@useqiv.com. We may require verification of your identity before processing requests.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies for functionality, analytics, and personalization. You can manage cookie preferences through your browser settings. Disabling cookies may affect Platform functionality. We use analytics services that may collect information about your online activities across websites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Third-Party Links and Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Platform may contain links to third-party websites or integrate with third-party services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Platform is not intended for children under 13 years of age (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. By using our Platform, you consent to such transfers. We implement appropriate safeguards for international data transfers as required by applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on our Platform with a new "Last Updated" date. Your continued use of the Platform after changes constitutes acceptance of the revised Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-foreground font-medium">UseQiv</p>
                <p className="text-muted-foreground">Email: privacy@useqiv.com</p>
                <p className="text-muted-foreground">Address: [Your Business Address]</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
