import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Heart, Target, Users, CreditCard, Share2, Bell, 
  TrendingUp, Shield, Globe, CheckCircle, ArrowRight, MessageSquare
} from "lucide-react";

const Crowdfunding = () => {
  const features = [
    { 
      icon: Target, 
      title: "Goal Tracking", 
      description: "Set funding goals and watch progress in real-time with visual progress bars and milestones." 
    },
    { 
      icon: Users, 
      title: "Donor Management", 
      description: "Track all donors, send thank you messages, and build lasting relationships with supporters." 
    },
    { 
      icon: MessageSquare, 
      title: "Campaign Updates", 
      description: "Keep donors informed with regular updates on how their contributions are making an impact." 
    },
    { 
      icon: Share2, 
      title: "Social Sharing", 
      description: "Built-in sharing tools make it easy to spread your campaign across social media platforms." 
    },
    { 
      icon: CreditCard, 
      title: "Flexible Payments", 
      description: "Accept one-time and recurring donations via cards, bank transfer, and mobile money." 
    },
    { 
      icon: Bell, 
      title: "Real-time Notifications", 
      description: "Get instant alerts when you receive donations and reach campaign milestones." 
    },
  ];

  const howItWorks = [
    { step: "1", title: "Tell Your Story", description: "Create your campaign with a compelling story, images, and funding goal." },
    { step: "2", title: "Set Your Goal", description: "Define your target amount, deadline, and customize your campaign page." },
    { step: "3", title: "Share Widely", description: "Share with friends, family, and on social media to reach more donors." },
    { step: "4", title: "Collect & Withdraw", description: "Receive donations and withdraw funds directly to your bank account." },
  ];

  const categories = [
    "Medical Emergencies",
    "Education & Tuition",
    "Community Projects",
    "Creative Projects",
    "Business Startups",
    "Charity & Nonprofits",
    "Sports & Teams",
    "Memorial Funds",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Crowdfunding</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Launch Your <span className="text-primary">Fundraising Campaign</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Create powerful fundraising campaigns, track donations, and reach your goals faster with our easy-to-use platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/campaigns/create">Start Fundraising</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/campaigns">Explore Campaigns</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start receiving donations in just a few easy steps.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-card border border-border rounded-2xl p-6 h-full">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Fundraise
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful tools to help you reach your fundraising goals.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
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

      {/* Categories & Benefits */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Fundraise for Any Cause
              </h2>
              <p className="text-muted-foreground mb-8">
                Whether it's a personal emergency, community project, or creative endeavor, our platform supports all types of fundraising campaigns.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {categories.map((category, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{category}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-3xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Shield className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Secure Donations</div>
                    <div className="text-sm text-muted-foreground">All payments are encrypted and secure</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <TrendingUp className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Track Progress</div>
                    <div className="text-sm text-muted-foreground">Real-time goal tracking & analytics</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Globe className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Global Reach</div>
                    <div className="text-sm text-muted-foreground">Accept donations from worldwide</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <CreditCard className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Low Fees</div>
                    <div className="text-sm text-muted-foreground">Competitive platform fees</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-3xl p-8 lg:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Start Your Campaign Today
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Create your fundraising campaign in minutes. No upfront costs, only pay when you raise funds.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/campaigns/create">
                Create Campaign
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Crowdfunding;
