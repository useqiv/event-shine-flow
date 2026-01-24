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
    <section id="features" className="py-10 sm:py-14 lg:py-20 bg-muted relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1600px] mx-auto">

          {/* AI Features Section */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              AI-Powered Platform
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-2">
              Intelligent Features That Work For You
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Leverage cutting-edge AI to automate tasks, generate content, and get smart recommendations.
            </p>
          </div>

          {/* AI Feature Cards - Horizontal scroll on mobile */}
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-10 lg:mb-12 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
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
                className={`p-4 sm:p-5 lg:p-6 bg-card border rounded-xl sm:rounded-2xl hover:shadow-xl transition-all duration-300 group min-w-[240px] sm:min-w-0 shrink-0 sm:shrink ${
                  item.highlight ? 'border-primary/50 shadow-lg ring-1 ring-primary/10' : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-muted border border-border flex items-center justify-center mb-3 sm:mb-4 lg:mb-5 group-hover:border-primary/50 group-hover:scale-110 transition-all">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">{item.title}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Platform Highlights */}
          <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {[
                { icon: Lock, title: "Bank-Level Security", desc: "256-bit encryption" },
                { icon: Globe, title: "Multi-Currency", desc: "50+ currencies supported" },
                { icon: Smartphone, title: "Mobile-First", desc: "All devices optimized" },
                { icon: CreditCard, title: "Fast Payouts", desc: "Quick settlements" },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 sm:p-4 lg:p-6 bg-muted rounded-xl sm:rounded-2xl hover:bg-primary/5 transition-colors group">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-card border border-border flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4 group-hover:border-primary/50 transition-colors">
                    <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm sm:text-base mb-0.5 sm:mb-1">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
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
