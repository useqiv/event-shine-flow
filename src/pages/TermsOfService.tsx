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
                Welcome to UseQiv. These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and UseQiv ("Company," "we," "our," or "us"). By accessing or using the UseQiv platform, including our website, mobile applications, APIs, and all related services (collectively, the "Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the Platform.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We reserve the right to modify these Terms at any time. Continued use of the Platform after any modifications constitutes your acceptance of the revised Terms. It is your responsibility to review these Terms periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed">
                You must be at least 18 years old or the age of majority in your jurisdiction to use our Platform. By using the Platform, you represent and warrant that you meet these eligibility requirements and have the legal capacity to enter into a binding agreement. If you are using the Platform on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Account Registration and Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To access certain features of the Platform, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Accept full responsibility for all activities under your account</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We reserve the right to suspend or terminate accounts that contain false information, violate these Terms, or engage in fraudulent or harmful activities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Platform Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                UseQiv provides a platform for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Organizing and participating in voting contests</li>
                <li>Purchasing and managing event tickets</li>
                <li>Creating and donating to fundraising campaigns</li>
                <li>Managing nominations and forms</li>
                <li>Influencer marketing and referral programs</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                UseQiv acts as an intermediary platform and is not a party to transactions between users and organizations. We do not guarantee the quality, safety, legality, or delivery of any contests, events, or campaigns hosted on our Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. User Conduct and Prohibited Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Engage in fraudulent voting, ticket scalping, or manipulation of contests</li>
                <li>Use bots, scripts, or automated methods to access the Platform</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Circumvent any security measures or rate limits</li>
                <li>Use the Platform for money laundering or other illegal financial activities</li>
                <li>Create multiple accounts to manipulate contests or avoid restrictions</li>
                <li>Infringe on intellectual property rights of UseQiv or third parties</li>
                <li>Interfere with the proper functioning of the Platform</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Violation of these prohibitions may result in immediate account termination, forfeiture of funds, and legal action.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Payments, Fees, and Refunds</h2>
              <h3 className="text-xl font-medium text-foreground mb-3">6.1 Payment Processing</h3>
              <p className="text-muted-foreground leading-relaxed">
                All payments are processed through third-party payment providers. By making a payment, you agree to the payment provider's terms of service. You are responsible for all applicable taxes.
              </p>
              
              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">6.2 Platform Fees</h3>
              <p className="text-muted-foreground leading-relaxed">
                UseQiv charges service fees for transactions conducted through the Platform. Fee structures are disclosed at the time of transaction and may be updated at our discretion.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">6.3 Refund Policy</h3>
              <p className="text-muted-foreground leading-relaxed">
                All purchases on the Platform, including votes, tickets, and donations, are generally final and non-refundable. Refunds may be considered at our sole discretion in cases of platform errors or cancelled events. UseQiv is not responsible for refunding purchases due to user error or change of mind.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">6.4 Payouts to Organizations</h3>
              <p className="text-muted-foreground leading-relaxed">
                Organizations are entitled to payouts after applicable fees and deductions. UseQiv reserves the right to withhold payouts pending fraud investigation or dispute resolution. Payout schedules and minimum thresholds are set at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Organization Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Organizations using the Platform agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate information about contests, events, and campaigns</li>
                <li>Comply with all applicable laws and regulations in their jurisdiction</li>
                <li>Fulfill all obligations to participants, ticket holders, and donors</li>
                <li>Maintain appropriate licenses and permits for their activities</li>
                <li>Accept responsibility for the content they publish on the Platform</li>
                <li>Respond to user inquiries and disputes in a timely manner</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                UseQiv is not responsible for the actions, content, or failures of organizations using the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
              <h3 className="text-xl font-medium text-foreground mb-3">8.1 UseQiv Property</h3>
              <p className="text-muted-foreground leading-relaxed">
                The Platform, including its design, features, functionality, content, trademarks, logos, and all intellectual property, is owned by UseQiv and protected by copyright, trademark, and other laws. You may not copy, modify, distribute, sell, or lease any part of our Platform or intellectual property without our written permission.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">8.2 User Content</h3>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of content you submit to the Platform. By submitting content, you grant UseQiv a worldwide, non-exclusive, royalty-free, sublicensable license to use, reproduce, modify, display, and distribute your content for the purposes of operating and promoting the Platform.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">8.3 Feedback</h3>
              <p className="text-muted-foreground leading-relaxed">
                Any feedback, suggestions, or ideas you provide about the Platform become our property, and we may use them without compensation or attribution to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed font-medium">
                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. TO THE FULLEST EXTENT PERMITTED BY LAW, USEQIV DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
                <li>WARRANTIES THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE</li>
                <li>WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY CONTENT</li>
                <li>WARRANTIES THAT DEFECTS WILL BE CORRECTED</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                YOU USE THE PLATFORM AT YOUR OWN RISK. WE DO NOT GUARANTEE THE OUTCOME OF ANY CONTEST, THE SUCCESS OF ANY CAMPAIGN, OR THE OCCURRENCE OF ANY EVENT.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed font-medium">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>USEQIV, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES.</li>
                <li>OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID TO USEQIV IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100).</li>
                <li>WE ARE NOT LIABLE FOR ACTIONS, CONTENT, OR SERVICES PROVIDED BY THIRD PARTIES, INCLUDING ORGANIZATIONS, PAYMENT PROCESSORS, OR OTHER USERS.</li>
                <li>WE ARE NOT LIABLE FOR ANY LOSS OR DAMAGE ARISING FROM UNAUTHORIZED ACCESS TO YOUR ACCOUNT.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to defend, indemnify, and hold harmless UseQiv, its officers, directors, employees, agents, licensors, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including attorney's fees) arising from: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any third-party rights, including intellectual property or privacy rights; (d) your content or data submitted to the Platform; (e) your negligence or willful misconduct; or (f) any dispute between you and another user or organization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Dispute Resolution and Arbitration</h2>
              <h3 className="text-xl font-medium text-foreground mb-3">12.1 Informal Resolution</h3>
              <p className="text-muted-foreground leading-relaxed">
                Before initiating any formal dispute resolution, you agree to first contact us at legal@useqiv.com to attempt to resolve the dispute informally for at least 30 days.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">12.2 Binding Arbitration</h3>
              <p className="text-muted-foreground leading-relaxed">
                Any dispute, claim, or controversy arising from or relating to these Terms or the Platform that cannot be resolved informally shall be resolved through binding arbitration conducted in accordance with applicable arbitration rules. The arbitration shall be conducted in English, and the arbitrator's decision shall be final and binding.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">12.3 Class Action Waiver</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. YOU WAIVE YOUR RIGHT TO PARTICIPATE IN CLASS ACTIONS.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may suspend or terminate your access to the Platform at any time, for any reason, without prior notice or liability. Upon termination, your right to use the Platform immediately ceases. Provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnification, and limitations of liability. We are not liable for any losses resulting from termination of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">14. Force Majeure</h2>
              <p className="text-muted-foreground leading-relaxed">
                UseQiv shall not be liable for any failure or delay in performing our obligations due to circumstances beyond our reasonable control, including but not limited to natural disasters, acts of war, terrorism, epidemics, government actions, power outages, or internet disruptions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">15. Governing Law and Jurisdiction</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which UseQiv is incorporated, without regard to conflict of law principles. For any disputes not subject to arbitration, you consent to the exclusive jurisdiction of the courts in that jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">16. Severability</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">17. Entire Agreement</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms, together with our Privacy Policy and any other agreements referenced herein, constitute the entire agreement between you and UseQiv regarding your use of the Platform. These Terms supersede all prior agreements and understandings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">18. Assignment</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may not assign or transfer these Terms or your rights hereunder without our prior written consent. UseQiv may assign these Terms without restriction. These Terms bind and inure to the benefit of the parties and their successors and permitted assigns.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">19. Waiver</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision. Any waiver must be in writing and signed by UseQiv.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">20. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-foreground font-medium">UseQiv Legal Department</p>
                <p className="text-muted-foreground">Email: legal@useqiv.com</p>
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

export default TermsOfService;
