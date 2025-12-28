import type { HTMLAttributes } from "react";
import { Vote, Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = (props: HTMLAttributes<HTMLElement>) => {
  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "For Organizers", href: "#organizers" },
      { name: "For Participants", href: "#users" },
      { name: "Pricing", href: "#pricing" },
      { name: "API Docs", href: "#api" }
    ],
    company: [
      { name: "About Us", href: "#about" },
      { name: "Careers", href: "#careers" },
      { name: "Blog", href: "#blog" },
      { name: "Press", href: "#press" },
      { name: "Contact", href: "#contact" }
    ],
    resources: [
      { name: "Help Center", href: "#help" },
      { name: "Community", href: "#community" },
      { name: "Webinars", href: "#webinars" },
      { name: "Case Studies", href: "#case-studies" },
      { name: "Status Page", href: "#status" }
    ],
    legal: [
      { name: "Privacy Policy", href: "#privacy" },
      { name: "Terms of Service", href: "#terms" },
      { name: "Cookie Policy", href: "#cookies" },
      { name: "GDPR", href: "#gdpr" }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Youtube, href: "#", label: "YouTube" }
  ];

  return (
    <footer {...props} className="bg-card border-t border-border">
      <div className="w-full px-4 md:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-[1600px] mx-auto">
          {/* Newsletter Section */}
          <div className="bg-muted border border-border rounded-3xl p-8 lg:p-10 mb-12 lg:mb-16">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
                  Stay updated with VotePass
                </h3>
                <p className="text-muted-foreground">
                  Get the latest news, updates, and tips delivered to your inbox.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 lg:min-w-[400px]">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <Button variant="default" className="rounded-full px-6">
                  Subscribe
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12 mb-12 lg:mb-16">
            {/* Brand Column */}
            <div className="col-span-2">
              <a href="/" className="flex items-center gap-2.5 mb-5">
                <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center">
                  <Vote className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">VotePass</span>
              </a>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed max-w-xs">
                The modern platform for secure contest voting and event ticketing. 
                Trusted by organizers worldwide.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-2">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-foreground mb-5">Product</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-foreground mb-5">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-foreground mb-5">Resources</h4>
              <ul className="space-y-3">
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-foreground mb-5">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VotePass. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 bg-green-500 rounded-full" />
                All systems operational
              </div>
              <span className="text-sm text-muted-foreground">🌍 50+ currencies</span>
              <span className="text-sm text-muted-foreground">🔒 SSL Secured</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

Footer.displayName = "Footer";

export default Footer;
