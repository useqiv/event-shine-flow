import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Vote, Ticket, Heart, Search, Bell, Wallet, Shield, 
  Smartphone, Star, Users, CheckCircle, ArrowRight 
} from "lucide-react";

const ForParticipants = () => {
  const features = [
    { icon: Vote, title: "Vote for Favorites", description: "Support your favorite contestants in voting contests with secure, transparent voting." },
    { icon: Ticket, title: "Buy Event Tickets", description: "Purchase tickets easily with multiple payment options and digital QR codes." },
    { icon: Heart, title: "Support Campaigns", description: "Donate to causes you care about and track campaign progress in real-time." },
    { icon: Search, title: "Discover Events", description: "Find exciting events, contests, and campaigns happening near you." },
    { icon: Bell, title: "Stay Updated", description: "Get notifications about your favorite events and contestants." },
    { icon: Wallet, title: "Wallet System", description: "Add funds once and use them across all events and contests." },
  ];

  const benefits = [
    "Secure payment processing",
    "Digital tickets with QR codes",
    "Real-time voting results",
    "Mobile-friendly experience",
    "Transaction history",
    "Favorite contestants tracking",
    "Event recommendations",
    "Referral rewards",
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
              <span className="text-sm font-medium text-foreground">For Participants</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Vote, Buy Tickets & <span className="text-primary">Support Causes</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Join millions of users discovering amazing events, voting for favorites, and supporting campaigns.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/contests">Browse Contests</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/events">Explore Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What You Can Do
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              USEQIV makes it easy to participate in events, vote for contestants, and support causes.
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

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-card border border-border rounded-3xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Shield className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Secure Transactions</div>
                    <div className="text-sm text-muted-foreground">Bank-level security for all payments</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Smartphone className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Mobile First</div>
                    <div className="text-sm text-muted-foreground">Works perfectly on any device</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Wallet className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Easy Wallet</div>
                    <div className="text-sm text-muted-foreground">Fund once, use everywhere</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Users className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Community</div>
                    <div className="text-sm text-muted-foreground">Join a vibrant community of fans</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                A Better Way to Participate
              </h2>
              <p className="text-muted-foreground mb-8">
                We've made it simple and secure to engage with your favorite events, contests, and campaigns.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))}
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
              Start Exploring Today
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Create a free account to vote, buy tickets, and support your favorite causes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">
                  Create Free Account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/contests">Browse Contests</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForParticipants;