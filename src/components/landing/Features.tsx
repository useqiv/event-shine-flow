import { 
  Vote, 
  Ticket, 
  Shield, 
  BarChart3, 
  Wallet, 
  QrCode, 
  Share2, 
  Bell,
  Palette,
  Award,
  Users,
  Globe,
  Sparkles,
  CreditCard,
  Smartphone,
  Lock
} from "lucide-react";

const Features = () => {
  const organizerFeatures = [
    {
      icon: Shield,
      title: "AI Anti-Fraud Engine",
      description: "Machine learning detects vote manipulation, duplicate accounts, and suspicious patterns in real-time.",
      highlight: true
    },
    {
      icon: QrCode,
      title: "QR Code Tickets",
      description: "Generate secure QR tickets with built-in scanner app for seamless venue check-ins."
    },
    {
      icon: BarChart3,
      title: "Live Analytics Dashboard",
      description: "Track votes, ticket sales, revenue, and engagement with beautiful real-time visualizations."
    },
    {
      icon: Share2,
      title: "Auto-Generated Share Links",
      description: "Each contestant gets unique shareable links for easy social media promotion."
    },
    {
      icon: Palette,
      title: "Custom Branding",
      description: "White-label your voting pages with your company's logo, colors, and domain."
    },
    {
      icon: CreditCard,
      title: "Automated Payouts",
      description: "Automatic commission calculation and instant payouts to your bank account."
    }
  ];

  const userFeatures = [
    {
      icon: Wallet,
      title: "Digital Wallet",
      description: "Pre-load credits for instant voting and ticket purchases. Multiple top-up options available."
    },
    {
      icon: Smartphone,
      title: "One-Tap Voting",
      description: "Vote for your favorites instantly with a single tap. No complicated forms."
    },
    {
      icon: Award,
      title: "Earn Rewards & Badges",
      description: "Get points for participation, referrals, and activity. Redeem for discounts."
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Real-time alerts when your favorite contestant needs votes or events go live."
    },
    {
      icon: Users,
      title: "Referral Bonuses",
      description: "Invite friends and earn bonus credits for each successful signup."
    },
    {
      icon: Sparkles,
      title: "Fast Checkout",
      description: "Buy event tickets in seconds with saved payment methods and wallet balance."
    }
  ];

  return (
    <section id="features" className="py-24 bg-card relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground font-medium">Powerful Features</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Everything You Need to Run{" "}
            <span className="text-primary">World-Class Events</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A comprehensive platform packed with features for organizers and participants alike.
          </p>
        </div>

        {/* Organizer Features */}
        <div id="organizers" className="mb-24">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">For Organizers</h3>
              <p className="text-muted-foreground text-sm">Tools to run successful contests and events</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizerFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* User Features */}
        <div id="users">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Vote className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">For Participants</h3>
              <p className="text-muted-foreground text-sm">Seamless voting and ticket buying experience</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* Platform Highlights */}
        <div className="mt-24 grid md:grid-cols-4 gap-6">
          {[
            { icon: Lock, title: "Bank-Level Security", desc: "256-bit encryption & secure voting ledger" },
            { icon: Globe, title: "Multi-Currency", desc: "Accept payments in 50+ currencies" },
            { icon: Smartphone, title: "Mobile-First", desc: "Optimized for all devices" },
            { icon: BarChart3, title: "API Ready", desc: "RESTful APIs for integrations" },
          ].map((item, i) => (
            <div key={i} className="text-center p-6 bg-background/50 border border-border rounded-xl hover:border-primary/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: boolean;
}

const FeatureCard = ({ icon: Icon, title, description, highlight }: FeatureCardProps) => {
  return (
    <div className={`group relative p-6 bg-background border rounded-xl hover:shadow-xl transition-all duration-300 ${highlight ? 'border-primary/50 shadow-lg' : 'border-border hover:border-primary/30'}`}>
      {highlight && (
        <div className="absolute -top-3 left-4">
          <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
            Popular
          </span>
        </div>
      )}
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h4 className="text-lg font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default Features;
