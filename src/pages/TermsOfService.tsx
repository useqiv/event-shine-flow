import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last Updated: January 4, 2026</p>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to UseQiv. These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and Airaplay Innovation Labs Limited, operating the UseQiv platform ("UseQiv," "Company," "we," "our," or "us").
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                UseQiv includes our website, mobile applications, APIs, and all related products and services (collectively, the "Platform").
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By accessing or using the Platform, you confirm that you have read, understood, and agreed to be bound by these Terms. If you do not agree, you must not access or use the Platform.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We reserve the right to modify these Terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms. You are responsible for reviewing them periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed">
                You must be at least 18 years old or the age of majority in your jurisdiction to use the Platform. By using UseQiv, you represent and warrant that you meet this requirement and have the legal capacity to enter into a binding agreement.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                If you use the Platform on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We reserve the right to request proof of age or authority at any time and to suspend or terminate accounts found to be in violation of this section.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Account Registration and Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Keep your login credentials confidential</li>
                <li>Promptly update your account details</li>
                <li>Notify us immediately of unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We may suspend or terminate accounts that contain false information, violate these Terms, or pose security or fraud risks.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Platform Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                UseQiv provides tools for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Voting contests and polls</li>
                <li>Event ticket sales and management</li>
                <li>Fundraising and donation campaigns</li>
                <li>Nominations, surveys, and digital forms</li>
                <li>Influencer marketing and referral programs</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                UseQiv acts solely as a technology intermediary. We are not a party to transactions, agreements, or obligations between users, organizers, donors, voters, influencers, or third parties.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We do not guarantee the success, legality, quality, or delivery of any contest, event, campaign, or service hosted on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. User Conduct and Prohibited Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Violate any applicable law or regulation</li>
                <li>Engage in vote manipulation, ticket scalping, or artificial engagement</li>
                <li>Use bots, scripts, or automated tools</li>
                <li>Create multiple accounts to bypass restrictions</li>
                <li>Commit fraud, money laundering, or financial abuse</li>
                <li>Upload malicious software or harmful content</li>
                <li>Impersonate any person or entity</li>
                <li>Harass, threaten, or abuse others</li>
                <li>Infringe intellectual property rights</li>
                <li>Attempt unauthorized system access</li>
                <li>Interfere with Platform operations or security</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Violations may result in immediate suspension, termination, forfeiture of funds, invalidation of votes, and legal action.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Payments, Fees, and Refunds</h2>
              <h3 className="text-xl font-medium text-foreground mb-3">6.1 Payment Processing</h3>
              <p className="text-muted-foreground leading-relaxed">
                All payments are handled by third-party payment providers. By making a payment, you agree to their terms. You are responsible for all applicable taxes and charges.
              </p>
              
              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">6.2 Platform Fees</h3>
              <p className="text-muted-foreground leading-relaxed">
                UseQiv charges service fees, disclosed at the point of transaction. Fee structures may change at our discretion.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">6.3 Refund Policy</h3>
              <p className="text-muted-foreground leading-relaxed">
                All purchases (including votes, tickets, and donations) are final and non-refundable, except where required by law or at our sole discretion due to platform error or event cancellation.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">6.4 Payouts</h3>
              <p className="text-muted-foreground leading-relaxed">
                Payouts to organizations or creators are subject to verification, minimum thresholds, fraud checks, and processing timelines set by UseQiv. We may withhold or delay payouts during investigations or disputes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Organization Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Organizations and campaign owners agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate and lawful information</li>
                <li>Obtain all required licenses and approvals</li>
                <li>Fulfill obligations to users and donors</li>
                <li>Respond promptly to disputes and inquiries</li>
                <li>Accept responsibility for their content and activities</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                UseQiv is not responsible for organizer actions, failures, or representations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Platform Integrity & Anti-Fraud</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To protect fairness and trust, UseQiv reserves the right to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Monitor activity and engagement</li>
                <li>Invalidate votes or results</li>
                <li>Suspend campaigns or accounts</li>
                <li>Withhold or reverse payouts</li>
                <li>Remove fraudulent or misleading content</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4 font-medium">
                All decisions related to platform integrity are final.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Intellectual Property</h2>
              <h3 className="text-xl font-medium text-foreground mb-3">9.1 UseQiv Property</h3>
              <p className="text-muted-foreground leading-relaxed">
                All Platform content, software, branding, and intellectual property belong to UseQiv or its licensors and are protected by law. Unauthorized use is prohibited.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">9.2 User Content</h3>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of content you submit. By submitting content, you grant UseQiv a worldwide, non-exclusive, royalty-free, sublicensable license to use it for Platform operation, promotion, and improvement.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">9.3 Feedback</h3>
              <p className="text-muted-foreground leading-relaxed">
                All feedback or suggestions become our property and may be used without compensation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed font-medium">
                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE." WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND AVAILABILITY.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4 font-medium">
                WE DO NOT GUARANTEE RESULTS, OUTCOMES, SUCCESS, VISIBILITY, EARNINGS, OR PLATFORM UPTIME.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4 font-medium">
                YOUR USE OF USEQIV IS AT YOUR OWN RISK.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>UseQiv shall not be liable for indirect, incidental, consequential, punitive, or special damages</li>
                <li>Total liability shall not exceed the greater of ₦ equivalent of $100 USD or the amount paid to UseQiv in the previous 12 months</li>
                <li>We are not liable for third-party actions, unauthorized access, or data loss</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Some jurisdictions may limit these exclusions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree to indemnify and hold harmless UseQiv, its directors, officers, employees, and partners from any claims, damages, losses, or expenses arising from:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Your use of the Platform</li>
                <li>Your content or conduct</li>
                <li>Your violation of these Terms</li>
                <li>Disputes with other users or organizations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Dispute Resolution & Arbitration</h2>
              <h3 className="text-xl font-medium text-foreground mb-3">13.1 Informal Resolution</h3>
              <p className="text-muted-foreground leading-relaxed">
                You agree to contact legal@useqiv.com and attempt resolution for at least 30 days before formal proceedings.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">13.2 Binding Arbitration</h3>
              <p className="text-muted-foreground leading-relaxed">
                Unresolved disputes shall be resolved by binding arbitration, conducted in English, with the arbitrator's decision being final.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">13.3 Class Action Waiver</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Disputes must be brought individually, not as part of any class or representative action.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">14. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may suspend or terminate access at any time, with or without notice. Upon termination, your rights to use the Platform cease immediately. Sections that should survive termination shall do so.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">15. Force Majeure</h2>
              <p className="text-muted-foreground leading-relaxed">
                We are not liable for delays or failures caused by events beyond our reasonable control, including natural disasters, government actions, strikes, power failures, or internet disruptions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">16. Governing Law and Jurisdiction</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms are governed by the laws of the Federal Republic of Nigeria. For disputes not subject to arbitration, you submit to the exclusive jurisdiction of Nigerian courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">17. Severability</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any provision is found unenforceable, the remaining provisions remain in full effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">18. Entire Agreement</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and UseQiv.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">19. Assignment</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may not assign these Terms without our consent. We may assign them freely.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">20. Waiver</h2>
              <p className="text-muted-foreground leading-relaxed">
                Failure to enforce any provision is not a waiver unless stated in writing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">21. Data Protection & Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                UseQiv processes personal data in accordance with the Nigeria Data Protection Act (NDPA). Your use of the Platform is governed by our Privacy Policy, which explains how your data is collected, used, and protected.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">22. Company Information & Contact</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                UseQiv is operated by:
              </p>
              <div className="text-muted-foreground leading-relaxed">
                <p className="font-medium">Airaplay Innovation Labs Limited</p>
                <p>Federal Republic of Nigeria</p>
                <p className="mt-4">
                  📧 <a href="mailto:legal@useqiv.com" className="text-primary hover:underline">legal@useqiv.com</a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
