import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Zap, Users, Vote, Ticket, Trophy, Star } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Digital voting and ticketing platform for contests and events"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8 animate-fade-in">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground font-medium">Powering 500+ Pageants, Awards & Competitions</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            <span className="block">The All-in-One Platform for</span>
            <span className="text-primary relative">
              Contest Voting
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0 6 Q50 0, 100 6 T200 6" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </span>
            {" & "}
            <span className="text-secondary">Event Ticketing</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Run fair, fraud-proof voting for pageants, music competitions, and awards. 
            Sell QR-verified tickets with real-time analytics. All in one beautiful platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button variant="hero" size="xl" className="group text-base">
              Start Free Trial
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="xl" className="group text-base">
              <Play className="h-5 w-5" />
              Watch 2-Min Demo
            </Button>
          </div>

          {/* Use Case Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {["Pageants", "Music Awards", "Fashion Shows", "Talent Competitions", "Award Ceremonies"].map((useCase) => (
              <span key={useCase} className="px-4 py-2 bg-card/80 border border-border rounded-full text-sm text-foreground hover:border-primary/50 transition-colors cursor-default">
                {useCase}
              </span>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2 group">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground">Anti-Fraud</div>
                <div className="text-xs">AI-Protected Voting</div>
              </div>
            </div>
            <div className="flex items-center gap-2 group">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground">Real-time</div>
                <div className="text-xs">Live Vote Tracking</div>
              </div>
            </div>
            <div className="flex items-center gap-2 group">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground">1M+ Votes</div>
                <div className="text-xs">Securely Processed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Feature Cards */}
        <div className="hidden lg:block">
          <div className="absolute left-8 top-1/3 animate-fade-in">
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Vote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Live Voting</div>
                  <div className="text-xs text-muted-foreground">12.5K votes today</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute right-8 top-1/2 animate-fade-in delay-300">
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Tickets Sold</div>
                  <div className="text-xs text-muted-foreground">8,234 this week</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute right-16 top-1/4 animate-fade-in delay-500">
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <Star className="h-4 w-4 text-primary fill-primary" />
                <Star className="h-4 w-4 text-primary fill-primary" />
                <Star className="h-4 w-4 text-primary fill-primary" />
                <Star className="h-4 w-4 text-primary fill-primary" />
                <span className="text-xs text-foreground ml-1">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
