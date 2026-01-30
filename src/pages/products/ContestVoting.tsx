import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Vote, Trophy, Shield, BarChart3, Users, Zap, 
  Eye, Lock, Globe, CheckCircle, ArrowRight, TrendingUp
} from "lucide-react";

const ContestVoting = () => {
  const features = [
    { 
      icon: Vote, 
      title: "Paid Voting System", 
      description: "Monetize your contests with secure paid voting. Set custom vote prices and packages." 
    },
    { 
      icon: Trophy, 
      title: "Real-time Leaderboards", 
      description: "Live rankings that update instantly as votes come in. Build excitement and engagement." 
    },
    { 
      icon: Shield, 
      title: "Anti-Fraud Protection", 
      description: "Advanced detection prevents vote manipulation, duplicate votes, and suspicious activity." 
    },
    { 
      icon: BarChart3, 
      title: "Detailed Analytics", 
      description: "Track voting patterns, peak times, revenue, and contestant performance metrics." 
    },
    { 
      icon: Users, 
      title: "Contestant Management", 
      description: "Easy contestant profiles with photos, bios, categories, and individual voting links." 
    },
    { 
      icon: Eye, 
      title: "Public or Private Votes", 
      description: "Choose whether vote counts are visible publicly or hidden until results are announced." 
    },
  ];

  const howItWorks = [
    { step: "1", title: "Create Contest", description: "Set up your contest with categories, voting period, and pricing." },
    { step: "2", title: "Add Contestants", description: "Upload contestant profiles with photos and details. Assign categories." },
    { step: "3", title: "Launch & Share", description: "Go live and share your contest link. Contestants can share their own links." },
    { step: "4", title: "Track & Announce", description: "Monitor votes in real-time and announce winners when voting ends." },
  ];

  const useCases = [
    "Beauty Pageants",
    "Talent Shows",
    "Music Competitions",
    "Photo Contests",
    "School Elections",
    "Award Ceremonies",
    "Fan Voting",
    "Corporate Events",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Vote className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Contest Voting</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Run Secure <span className="text-primary">Paid Voting</span> Competitions
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Create engaging contests with real-time leaderboards, anti-fraud protection, and powerful analytics.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">Create a Contest</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contests">View Active Contests</Link>
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
              Launch your voting contest in four simple steps.
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
              Powerful Voting Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run successful voting competitions.
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

      {/* Use Cases & Benefits */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Perfect For Any Competition
              </h2>
              <p className="text-muted-foreground mb-8">
                From beauty pageants to talent shows, our platform handles voting for any type of contest with ease and security.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {useCases.map((useCase, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{useCase}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-3xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Lock className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Fraud Prevention</div>
                    <div className="text-sm text-muted-foreground">AI-powered detection for fair results</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Zap className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Instant Results</div>
                    <div className="text-sm text-muted-foreground">Real-time vote counting & leaderboards</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Globe className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Global Reach</div>
                    <div className="text-sm text-muted-foreground">Accept votes from anywhere in the world</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <TrendingUp className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Revenue Tracking</div>
                    <div className="text-sm text-muted-foreground">Monitor earnings in real-time</div>
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
              Ready to Launch Your Contest?
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Set up your first contest in minutes and start collecting votes today.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">
                Create Contest Now
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

export default ContestVoting;
