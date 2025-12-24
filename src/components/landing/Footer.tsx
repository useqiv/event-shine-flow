import { Vote, Ticket, Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

const Footer = () => {
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
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <Vote className="h-6 w-6 text-primary" />
                <Ticket className="h-5 w-5 text-secondary -ml-1" />
              </div>
              <span className="text-xl font-bold text-foreground">VotePass</span>
            </a>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              The modern platform for secure contest voting and event ticketing. 
              Trusted by organizers worldwide.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="h-10 w-10 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VotePass. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">🌍 Multi-currency supported</span>
            <span className="text-sm text-muted-foreground">🔒 SSL Secured</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
