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
  Lock,
  ArrowRight,
  FileText,
  Heart,
  TrendingUp,
  Gift
} from "lucide-react";

const Features = () => {
  const organizerFeatures = [
    {
      icon: Vote,
      title: "Contest Voting",
      description: "Run secure, anti-fraud voting for pageants, awards, and competitions with live leaderboards.",
      highlight: true
    },
    {
      icon: Ticket,
      title: "Event Ticketing",
      description: "Sell QR-verified tickets with tiered pricing, instant check-ins, and capacity tracking."
    },
    {
      icon: Heart,
      title: "Crowdfunding Campaigns",
      description: "Launch fundraising campaigns with goal tracking, donor leaderboards, and social sharing."
    },
    {
      icon: FileText,
      title: "Custom Forms",
      description: "Build multi-page forms with conditional logic, payments, and response management."
    },
  ];

  return (
    <section id="features" className="py-14 lg:py-20 bg-muted relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full px-4 md:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1600px] mx-auto">



          {/* AI Features Section */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              AI-Powered Platform
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Intelligent Features That Work For You
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Leverage cutting-edge AI to automate tasks, generate content, and get smart recommendations.
            </p>
          </div>

          {/* AI Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { 
                icon: Sparkles, 
                title: "AI Chat Assistant", 
                desc: "Get instant answers about contests, events, and recommendations with our intelligent QIV assistant.",
                highlight: true
              },
              { 
                icon: FileText, 
                title: "AI Content Generation", 
                desc: "Auto-generate compelling descriptions for events, contests, and campaigns in seconds."
              },
              { 
                icon: TrendingUp, 
                title: "Smart Recommendations", 
                desc: "Personalized suggestions based on your voting history and preferences."
              },
              { 
                icon: Share2, 
                title: "AI Social Posts", 
                desc: "Generate engaging social media content tailored for each platform automatically."
              },
            ].map((item, i) => (
              <div 
                key={i} 
                className={`p-6 bg-card border rounded-2xl hover:shadow-xl transition-all duration-300 group ${
                  item.highlight ? 'border-primary/50 shadow-lg ring-1 ring-primary/10' : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="h-12 w-12 rounded-xl bg-muted border border-border flex items-center justify-center mb-5 group-hover:border-primary/50 group-hover:scale-110 transition-all">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">{item.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Platform Highlights */}
          <div className="bg-card border border-border rounded-3xl p-6 lg:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {[
                { icon: Lock, title: "Bank-Level Security", desc: "256-bit encryption" },
                { icon: Globe, title: "Multi-Currency", desc: "50+ currencies supported" },
                { icon: Smartphone, title: "Mobile-First", desc: "All devices optimized" },
                { icon: CreditCard, title: "Fast Payouts", desc: "Quick settlements" },
              ].map((item, i) => (
                <div key={i} className="text-center p-5 lg:p-6 bg-muted rounded-2xl hover:bg-primary/5 transition-colors group">
                  <div className="h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center mx-auto mb-4 group-hover:border-primary/50 transition-colors">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
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
  highlight?: boolean;
}

const FeatureCard = ({ icon: Icon, title, description, highlight }: FeatureCardProps) => {
  return (
    <div className={`group relative p-6 bg-card border rounded-2xl hover:shadow-xl transition-all duration-300 ${highlight ? 'border-primary/50 shadow-lg ring-1 ring-primary/10' : 'border-border hover:border-primary/30'}`}>
      <div className="h-12 w-12 rounded-xl bg-muted border border-border flex items-center justify-center mb-5 group-hover:border-primary/50 group-hover:scale-110 transition-all">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h4 className="text-lg font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default Features;
