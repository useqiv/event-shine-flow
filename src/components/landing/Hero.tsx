import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Zap, Users, Star, CheckCircle, Vote, TrendingUp, Sparkles } from "lucide-react";
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
  const trustedBy = ["Miss Ghana", "Ghana Music Awards", "African Fashion Week", "Tech Summit Africa"];
  return <section className="pt-24 lg:pt-28 pb-16 lg:pb-20 bg-muted relative overflow-hidden">
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
                Voting. Ticketing. Crowdfunding. Forms. Influencer Marketing. One powerful platform to run contests,
                events, campaigns and more.
              </p>

              {/* AI Features Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
                {[{
                text: "AI-Powered"
              }, {
                text: "Smart Recommendations"
              }, {
                text: "Auto Content Generation"
              }].map((item, i) => <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
                  </div>)}
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                {[{
                icon: Shield,
                text: "Anti-Fraud Protected"
              }, {
                icon: Zap,
                text: "Real-time Results"
              }, {
                icon: CheckCircle,
                text: "Instant Setup"
              }].map((item, i) => <div key={i} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </div>)}
              </div>
            </div>

            {/* Right Content - Stats Card */}
            <div className="relative max-w-md mx-auto lg:max-w-none">
              {/* Main Stats Card */}
              <div className="bg-card border border-border rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />

                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">Live Dashboard</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Real-time performance</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-full">
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-semibold text-primary">Live</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {stats.map((stat, i) => <div key={i} className="text-center p-2 sm:p-3 lg:p-4 bg-muted rounded-xl sm:rounded-2xl">
                      <div className="text-base sm:text-xl lg:text-2xl font-bold text-foreground mb-0.5 sm:mb-1">{stat.value}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</div>
                    </div>)}
                </div>

                {/* Mini Leaderboard */}
                <div className="bg-muted rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="text-xs sm:text-sm font-semibold text-foreground">Top Contestants</span>
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
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
                  }].map((contestant, i) => <div key={i} className="flex items-center gap-2 sm:gap-3">
                        <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs sm:text-sm font-bold text-primary-foreground shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs sm:text-sm font-medium text-foreground truncate">{contestant.name}</span>
                            <span className="text-[10px] sm:text-xs text-primary font-semibold shrink-0">{contestant.change}</span>
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">{contestant.votes.toLocaleString()} votes</div>
                        </div>
                      </div>)}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex -space-x-1.5 sm:-space-x-2">
                      {[1, 2, 3, 4].map(i => <div key={i} className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] sm:text-xs font-bold text-foreground">
                          {String.fromCharCode(64 + i)}
                        </div>)}
                    </div>
                    <div>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary fill-primary" />)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">500+ reviews</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-bold text-foreground">4.9</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Rating</div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 left-0 sm:-left-4 lg:-left-8 flex items-center gap-3 px-4 sm:px-5 py-2 sm:py-3 bg-card border border-border rounded-2xl shadow-xl">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary flex items-center justify-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-foreground">100+ Organizers</div>
                  <div className="text-xs text-muted-foreground">Trust USEQIV</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted By Section - Hidden for now */}
          {/* <div className="mt-16 lg:mt-20 pt-10 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-6">Trusted by leading event organizers</p>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
              {trustedBy.map((brand, i) => (
                <div
                  key={i}
                  className="text-lg font-semibold text-muted-foreground/60 hover:text-foreground transition-colors cursor-default"
                >
                  {brand}
                </div>
              ))}
            </div>
           </div> */}
        </div>
      </div>
    </section>;
};
export default Hero;