import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { 
  Vote, Ticket, Heart, FileText, Users, Shield, Zap, Globe, 
  BarChart3, Bell, Smartphone, CreditCard, Sparkles, TrendingUp, Share2, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Features = () => {
  const mainFeatures = [
    {
      icon: Vote,
      title: "Contest Voting",
      description: "Run secure, transparent voting contests with real-time leaderboards, anti-fraud protection, and multiple voting options.",
      highlights: ["Real-time leaderboards", "Anti-fraud detection", "Custom vote pricing", "Multiple categories"],
    },
    {
      icon: Ticket,
      title: "Event Ticketing",
      description: "Sell tickets with QR code validation, multiple ticket types, and seamless check-in experience.",
      highlights: ["QR code tickets", "Multiple ticket types", "Mobile check-in", "Ticket transfers"],
    },
    {
      icon: Heart,
      title: "Crowdfunding",
      description: "Launch campaigns with goal tracking, donor management, and social sharing features.",
      highlights: ["Goal tracking", "Donor leaderboard", "Campaign updates", "Embed widgets"],
    },
    {
      icon: FileText,
      title: "Form Builder",
      description: "Create custom forms for registrations, surveys, and applications with payment integration.",
      highlights: ["Drag & drop builder", "Conditional logic", "File uploads", "Payment collection"],
    },
  ];

  const aiFeatures = [
    { icon: Bot, title: "AI Chat Assistant", description: "Get instant help and recommendations through our intelligent chat assistant." },
    { icon: Sparkles, title: "AI Content Generation", description: "Generate compelling descriptions and marketing content automatically." },
    { icon: TrendingUp, title: "Smart Recommendations", description: "AI-powered suggestions to help users discover relevant events and contests." },
    { icon: Share2, title: "AI Social Posts", description: "Create engaging social media content with AI-generated captions and hashtags." },
  ];

  const platformFeatures = [
    { icon: Shield, title: "Enterprise Security", description: "Bank-level encryption and fraud protection for all transactions." },
    { icon: Globe, title: "Multi-Currency", description: "Accept payments in multiple currencies including NGN, GHS, USD, and crypto." },
    { icon: BarChart3, title: "Analytics Dashboard", description: "Comprehensive insights and reporting for all your events and campaigns." },
    { icon: Bell, title: "Real-time Notifications", description: "Stay updated with instant notifications for votes, sales, and donations." },
    { icon: Smartphone, title: "Mobile Optimized", description: "Fully responsive design that works perfectly on all devices." },
    { icon: CreditCard, title: "Fast Payouts", description: "Quick and reliable payouts directly to your bank account or crypto wallet." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Powerful <span className="text-primary">Features</span> for Modern Events
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Everything you need to run successful contests, events, and campaigns - all in one platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Core Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Four powerful modules to handle every aspect of your events.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {mainFeatures.map((feature, index) => (
              <div key={index} className="bg-card border border-border rounded-3xl p-8 hover:shadow-lg transition-shadow">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-6">{feature.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  {feature.highlights.map((highlight, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI-Powered</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Intelligent Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Leverage cutting-edge AI to automate tasks and enhance your events.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiFeatures.map((feature, index) => (
              <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Platform Highlights</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with reliability, security, and scale in mind.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-card border border-border rounded-2xl hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join thousands of organizers who trust USEQIV to power their events.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/contact">Talk to Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;