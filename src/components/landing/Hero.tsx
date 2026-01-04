import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Zap, Users, Star, CheckCircle, Vote, Ticket, TrendingUp } from "lucide-react";

const Hero = () => {
  const stats = [
    { value: "1M+", label: "Votes Cast" },
    { value: "500+", label: "Organizers" },
    { value: "₦50M+", label: "Raised" },
  ];

  const trustedBy = [
    "Miss Ghana",
    "Ghana Music Awards", 
    "African Fashion Week",
    "Tech Summit Africa",
  ];

  return (
    <section className="pt-24 lg:pt-28 pb-16 lg:pb-20 bg-muted relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
      
      {/* Floating Elements - Hidden to avoid overlap, shown only on 2xl screens */}
      <div className="absolute top-32 right-[12%] hidden 2xl:flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-2xl shadow-lg animate-fade-in z-20">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Vote className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="text-xs font-semibold text-foreground">Live Votes</div>
          <div className="text-xs text-muted-foreground">+2,847 today</div>
        </div>
      </div>
      
      <div className="absolute bottom-32 left-[5%] hidden 2xl:flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-2xl shadow-lg animate-fade-in z-20">
        <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <Ticket className="h-4 w-4 text-accent" />
        </div>
        <div>
          <div className="text-xs font-semibold text-foreground">Tickets Sold</div>
          <div className="text-xs text-muted-foreground">+523 this hour</div>
        </div>
      </div>

      <div className="w-full px-4 md:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          {/* Main Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full mb-6 shadow-sm">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm font-medium text-foreground">Now serving 25+ countries</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-[1.1] mb-6">
                The Complete{" "}
                <span className="text-primary relative">
                  Event Platform
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                    <path d="M0 6 Q50 0, 100 6 T200 6" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                </span>{" "}
                for <span className="text-accent">Africa</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                Voting. Ticketing. Crowdfunding. Forms. Nominations. 
                One powerful platform to run contests, events, and campaigns.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                <Button variant="default" size="lg" className="rounded-full px-8 h-14 text-base shadow-lg shadow-primary/25 group">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-base group">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 group-hover:bg-primary/20 transition-colors">
                    <Play className="h-3.5 w-3.5 text-primary fill-primary" />
                  </div>
                  Watch Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                {[
                  { icon: Shield, text: "Anti-Fraud Protected" },
                  { icon: Zap, text: "Real-time Results" },
                  { icon: CheckCircle, text: "No Credit Card" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Stats Card */}
            <div className="relative">
              {/* Main Stats Card */}
              <div className="bg-card border border-border rounded-[2rem] p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Live Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Real-time performance</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full">
                    <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-primary">Live</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {stats.map((stat, i) => (
                    <div key={i} className="text-center p-4 bg-muted rounded-2xl">
                      <div className="text-2xl lg:text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Mini Leaderboard */}
                <div className="bg-muted rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-foreground">Top Contestants</span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Sarah Johnson", votes: 2847, change: "+12%" },
                      { name: "Maria Santos", votes: 2534, change: "+8%" },
                      { name: "Emily Chen", votes: 2198, change: "+5%" },
                    ].map((contestant, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{contestant.name}</span>
                            <span className="text-xs text-primary font-semibold">{contestant.change}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{contestant.votes.toLocaleString()} votes</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-bold text-foreground">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((i) => (
                          <Star key={i} className="h-3.5 w-3.5 text-primary fill-primary" />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">500+ reviews</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">4.9</div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 left-0 sm:-left-4 lg:-left-8 flex items-center gap-3 px-4 sm:px-5 py-2 sm:py-3 bg-card border border-border rounded-2xl shadow-xl">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary flex items-center justify-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-foreground">500+ Organizers</div>
                  <div className="text-xs text-muted-foreground">Trust USEQIV</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted By Section */}
          <div className="mt-16 lg:mt-20 pt-10 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-6">Trusted by leading event organizers</p>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
              {trustedBy.map((brand, i) => (
                <div key={i} className="text-lg font-semibold text-muted-foreground/60 hover:text-foreground transition-colors cursor-default">
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
