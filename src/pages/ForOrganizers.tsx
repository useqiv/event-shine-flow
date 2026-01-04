import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Vote, Ticket, Heart, FileText, BarChart3, Users, Shield, 
  Zap, CreditCard, Globe, CheckCircle, ArrowRight 
} from "lucide-react";

const ForOrganizers = () => {
  const benefits = [
    { icon: Vote, title: "Contest Voting", description: "Run secure voting contests with real-time results and anti-fraud protection." },
    { icon: Ticket, title: "Event Ticketing", description: "Sell tickets with QR validation, multiple ticket types, and instant payouts." },
    { icon: Heart, title: "Crowdfunding", description: "Launch campaigns with goal tracking, updates, and donor management." },
    { icon: FileText, title: "Form Builder", description: "Create custom registration forms with payment integration." },
    { icon: BarChart3, title: "Analytics", description: "Get detailed insights on sales, votes, and audience engagement." },
    { icon: Users, title: "Team Management", description: "Collaborate with team members and assign permissions." },
  ];

  const features = [
    "Real-time dashboards and analytics",
    "Automated fraud detection",
    "Multiple payment methods",
    "Custom branding options",
    "Influencer marketing tools",
    "Social media auto-posting",
    "Embeddable widgets",
    "API access for developers",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">For Organizers</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Everything You Need to Run <span className="text-primary">Successful Events</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              From contests to ticketing, crowdfunding to forms - manage everything from one powerful dashboard.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">Start Organizing</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Request Demo</Link>
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
              All-in-One Platform for Organizers
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stop juggling multiple tools. USEQIV provides everything you need in one place.
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

      {/* Features List */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Built for Scale and Security
              </h2>
              <p className="text-muted-foreground mb-8">
                Whether you're running a small local event or a nationwide contest, our platform scales with your needs while keeping your data secure.
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
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Shield className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Anti-Fraud Protection</div>
                    <div className="text-sm text-muted-foreground">Advanced detection for vote manipulation</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Zap className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Real-time Updates</div>
                    <div className="text-sm text-muted-foreground">Instant notifications and live dashboards</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <CreditCard className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Fast Payouts</div>
                    <div className="text-sm text-muted-foreground">Get paid quickly to your preferred method</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Globe className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Multi-Currency</div>
                    <div className="text-sm text-muted-foreground">Accept NGN, GHS, USD, and crypto</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-3xl p-8 lg:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Start Organizing?
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Join 500+ organizers who trust USEQIV to power their events, contests, and campaigns.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">
                Create Free Account
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

export default ForOrganizers;