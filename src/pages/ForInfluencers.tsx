import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Share2, DollarSign, BarChart3, Link2, Users, Zap, 
  TrendingUp, CreditCard, CheckCircle, ArrowRight, Star
} from "lucide-react";

const ForInfluencers = () => {
  const benefits = [
    { icon: Share2, title: "Custom Referral Links", description: "Get unique tracking links for every event and contest you promote." },
    { icon: DollarSign, title: "Earn Commissions", description: "Earn a percentage of every sale made through your referral links." },
    { icon: BarChart3, title: "Real-time Analytics", description: "Track clicks, conversions, and earnings in your personal dashboard." },
    { icon: Link2, title: "Multiple Campaigns", description: "Promote multiple events and contests simultaneously." },
    { icon: Users, title: "Grow Your Audience", description: "Connect your followers to exciting events and exclusive contests." },
    { icon: Zap, title: "Instant Tracking", description: "See your performance metrics update in real-time." },
  ];

  const howItWorks = [
    { step: "1", title: "Sign Up", description: "Create your free influencer account in minutes." },
    { step: "2", title: "Get Links", description: "Generate unique referral links for events you want to promote." },
    { step: "3", title: "Share & Earn", description: "Share with your audience and earn commissions on every sale." },
    { step: "4", title: "Get Paid", description: "Request payouts to your bank account or crypto wallet." },
  ];

  const features = [
    "Competitive commission rates",
    "Real-time earnings tracking",
    "Fast payout processing",
    "Bank & crypto payments",
    "Dedicated dashboard",
    "Performance analytics",
    "Multiple payment options",
    "24/7 support",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">For Influencers</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Monetize Your <span className="text-primary">Influence</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Earn commissions by promoting events, contests, and campaigns to your audience. Join our influencer program today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">Join as Influencer</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Partner With Us?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              USEQIV offers one of the best influencer programs in the event industry.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start earning in four simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative bg-card border border-border rounded-2xl p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features & Earnings */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Earn More With Every Share
              </h2>
              <p className="text-muted-foreground mb-8">
                Our competitive commission structure means you earn more for every successful referral. Plus, get access to exclusive promotional materials and early access to new events.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-3xl p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Earnings Potential</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-2xl">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <span className="font-medium text-foreground">Ticket Sales</span>
                  </div>
                  <span className="text-primary font-bold">Up to 10%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-2xl">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-primary" />
                    <span className="font-medium text-foreground">Vote Sales</span>
                  </div>
                  <span className="text-primary font-bold">Up to 15%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <span className="font-medium text-foreground">Campaign Donations</span>
                  </div>
                  <span className="text-primary font-bold">Up to 8%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Commission rates vary by campaign and organizer settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join our influencer program today and start monetizing your audience.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/auth">
              Join Now - It's Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForInfluencers;