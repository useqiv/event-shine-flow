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
  Globe
} from "lucide-react";

const Features = () => {
  const organizerFeatures = [
    {
      icon: Vote,
      title: "Smart Anti-Fraud Engine",
      description: "AI-powered detection prevents vote manipulation and ensures fair contests."
    },
    {
      icon: QrCode,
      title: "QR Code Tickets",
      description: "Generate secure QR tickets with built-in scanner for seamless check-ins."
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Track votes, sales, and engagement with beautiful live dashboards."
    },
    {
      icon: Share2,
      title: "Auto-Share Links",
      description: "Generate unique contestant links for easy social media sharing."
    },
    {
      icon: Palette,
      title: "Custom Branding",
      description: "White-label your voting pages with your company's look and feel."
    },
    {
      icon: Wallet,
      title: "Payout Automation",
      description: "Automatic commission calculation and instant payouts to organizers."
    }
  ];

  const userFeatures = [
    {
      icon: Wallet,
      title: "Digital Wallet",
      description: "Pre-load credits for instant voting and ticket purchases."
    },
    {
      icon: Vote,
      title: "One-Click Voting",
      description: "Vote for your favorites instantly with a single tap."
    },
    {
      icon: Award,
      title: "Earn Rewards",
      description: "Get points and badges for participation, redeemable for discounts."
    },
    {
      icon: Bell,
      title: "Instant Notifications",
      description: "Stay updated with real-time alerts on contests and events."
    },
    {
      icon: Users,
      title: "Referral Bonuses",
      description: "Invite friends and earn bonus credits for each signup."
    },
    {
      icon: Ticket,
      title: "Fast Checkout",
      description: "Buy event tickets in seconds with saved payment methods."
    }
  ];

  const systemFeatures = [
    {
      icon: Shield,
      title: "Secure Voting Ledger",
      description: "Immutable record of all votes with full audit trail."
    },
    {
      icon: Globe,
      title: "Multi-Currency Support",
      description: "Accept payments in multiple currencies worldwide."
    },
    {
      icon: Bell,
      title: "Omni-Channel Alerts",
      description: "Email, SMS, and push notifications for all platforms."
    },
    {
      icon: BarChart3,
      title: "API-Ready Architecture",
      description: "RESTful APIs for seamless mobile app integration."
    }
  ];

  return (
    <section id="features" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Run{" "}
            <span className="text-primary">World-Class Events</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A comprehensive platform packed with features for organizers, 
            participants, and administrators.
          </p>
        </div>

        {/* Organizer Features */}
        <div id="organizers" className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground">For Organizers</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizerFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* User Features */}
        <div id="users" className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Vote className="h-5 w-5 text-secondary" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground">For Participants</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* System Features */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-muted/30 flex items-center justify-center">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground">Platform Capabilities</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} compact />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  compact?: boolean;
}

const FeatureCard = ({ icon: Icon, title, description, compact }: FeatureCardProps) => {
  return (
    <div className={`group p-6 bg-background border border-border rounded-lg hover:border-primary/50 hover:shadow-lg transition-all duration-300 ${compact ? 'text-center' : ''}`}>
      <div className={`h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors ${compact ? 'mx-auto' : ''}`}>
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h4 className="text-lg font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
};

export default Features;
