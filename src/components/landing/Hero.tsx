import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Zap, Users, Star, CheckCircle, Vote, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  const stats = [{
    value: "1M+",
    label: "Votes Cast"
  }, {
    value: "20",
    label: "Events"
  }, {
    value: "50k+",
    label: "Attendees"
  }];

  return (
    <section className="pt-20 sm:pt-24 lg:pt-28 pb-12 sm:pb-16 lg:pb-20 bg-muted relative overflow-hidden">
      {/* Background Decorations - Smaller on mobile */}
      <div className="absolute top-0 right-0 w-[300px] sm:w-[400px] lg:w-[600px] h-[300px] sm:h-[400px] lg:h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[200px] sm:w-[300px] lg:w-[400px] h-[200px] sm:h-[300px] lg:h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      {/* Floating Elements - Hidden on mobile and tablet, shown only on 2xl screens */}
      <div className="absolute top-32 right-[12%] hidden 2xl:flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-2xl shadow-lg animate-fade-in z-20">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Vote className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="text-xs font-semibold text-foreground">Live Votes</div>
          <div className="text-xs text-muted-foreground">+2,847 today</div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          {/* Main Hero Content */}
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 sm:gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left min-w-0">
              {/* Badge - Smaller on mobile */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-card border border-border rounded-full mb-4 sm:mb-6 shadow-sm">
                <span className="text-xs sm:text-sm font-medium text-foreground">Now serving 25+ countries</span>
              </div>

              {/* Headline - Responsive sizing */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl 2xl:text-8xl text-foreground leading-[1.1] mb-4 sm:mb-6 font-extrabold">
                The Complete{" "}
                <span className="text-primary relative whitespace-nowrap">
                  Event Platform
                  <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-2 sm:h-3 text-primary/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                    <path d="M0 6 Q50 0, 100 6 T200 6" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                </span>{" "}
                for <span className="text-accent">Africa</span>
              </h1>

              {/* Subheadline - Better mobile spacing */}
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                Voting. Ticketing. Crowdfunding. Forms. Influencer Marketing. One powerful platform to run contests,
                events, campaigns and more.
              </p>

              {/* AI Features Badges - Horizontal scroll on mobile */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-4 sm:mb-6 px-1">
                {[{
                  text: "AI-Powered"
                }, {
                  text: "Smart Recommendations"
                }, {
                  text: "Auto Content Generation"
                }].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                    
                    <span className="text-xs sm:text-sm font-medium text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Trust Indicators - Stack on small mobile */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6">
                {[{
                  icon: Shield,
                  text: "Anti-Fraud Protected"
                }, {
                  icon: Zap,
                  text: "Real time Results"
                }, {
                  icon: CheckCircle,
                  text: "Instant Setup"
                }].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                    <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    <span className="text-xs sm:text-sm text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Mobile CTA - Show prominently on mobile */}
              <div className="mt-6 sm:mt-8 lg:hidden">
                <Button asChild size="lg" className="w-full sm:w-auto rounded-full px-8 h-12">
                  <Link to="/auth">
                    Get Started Free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Content - Stats Card */}
            <div className="relative max-w-sm sm:max-w-md lg:max-w-none mx-auto lg:mx-0 lg:ml-auto lg:mr-0">
              {/* Main Stats Card */}
              <div className="bg-card border border-border rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-20 sm:w-24 lg:w-32 h-20 sm:h-24 lg:h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />

                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold text-foreground">Live Dashboard</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Real-time performance</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
                  {stats.map((stat, i) => (
                    <div key={i} className="text-center p-2 sm:p-3 lg:p-4 bg-muted rounded-xl sm:rounded-2xl">
                      <div className="text-sm sm:text-lg lg:text-2xl font-bold text-foreground mb-0.5">{stat.value}</div>
                      <div className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Mini Leaderboard */}
                <div className="bg-muted rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                    <span className="text-xs sm:text-sm font-semibold text-foreground">Top Contestants</span>
                    <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-primary" />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {[{
                      name: "Sarah Johnson",
                      votes: 2847,
                      change: "+12%"
                    }, {
                      name: "Maria Santos",
                      votes: 2534,
                      change: "+8%"
                    }, {
                      name: "Emily Chen",
                      votes: 2198,
                      change: "+5%"
                    }].map((contestant, i) => (
                      <div key={i} className="flex items-center gap-2 sm:gap-3">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9 rounded-full bg-primary flex items-center justify-center text-[10px] sm:text-xs lg:text-sm font-bold text-primary-foreground shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] sm:text-xs lg:text-sm font-medium text-foreground truncate">{contestant.name}</span>
                            <span className="text-[9px] sm:text-[10px] lg:text-xs text-primary font-semibold shrink-0">{contestant.change}</span>
                          </div>
                          <div className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">{contestant.votes.toLocaleString()} votes</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 lg:p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex -space-x-1 sm:-space-x-1.5 lg:-space-x-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[8px] sm:text-[10px] lg:text-xs font-bold text-foreground">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 text-primary fill-primary" />
                        ))}
                      </div>
                      <div className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">500+ reviews</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm sm:text-base lg:text-lg font-bold text-foreground">4.9</div>
                    <div className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">Rating</div>
                  </div>
                </div>
              </div>

              {/* Floating Badge - Better positioned on mobile */}
              <div className="absolute -bottom-3 sm:-bottom-4 left-2 sm:left-0 lg:-left-8 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 bg-card border border-border rounded-xl sm:rounded-2xl shadow-xl">
                <div className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-lg sm:rounded-xl bg-primary flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-[11px] sm:text-xs lg:text-sm font-bold text-foreground">100+ Organizers</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Trust USEQIV</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;