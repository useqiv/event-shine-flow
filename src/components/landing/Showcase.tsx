import { Vote, Ticket, BarChart3, QrCode, Wallet, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Showcase = () => {
  return (
    <section className="py-14 lg:py-20 bg-card relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="w-full px-4 md:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1600px] mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-full mb-6">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground font-medium">Complete Event Management Suite</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Five Powerful Products,{" "}
              <span className="text-primary">One Platform</span>
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg">
              Contests, events, crowdfunding, forms, and influencer marketing — all in USEQIV.
            </p>
          </div>

          {/* Product Cards */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-12 lg:mb-16">
            {/* Voting Product */}
            <div className="group relative bg-muted border border-border rounded-3xl p-6 md:p-8 lg:p-10 hover:border-primary/50 hover:shadow-2xl transition-all duration-500 overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                    <Vote className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground">Contest Voting</h3>
                    <p className="text-sm text-muted-foreground">For pageants, awards & competitions</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">
                  Run secure, transparent voting for any competition. Our AI-powered anti-fraud system ensures every vote counts.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: "🛡️", text: "Anti-fraud protection" },
                    { icon: "📊", text: "Live leaderboards" },
                    { icon: "🔗", text: "Shareable vote links" },
                    { icon: "💰", text: "Monetized voting" },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-3 bg-card/50 rounded-xl border border-border/50">
                      <span className="text-lg">{feature.icon}</span>
                      <span className="text-sm text-foreground font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Mini Dashboard Preview */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-foreground">Top Contestants</span>
                    <span className="text-xs text-primary font-semibold flex items-center gap-1">
                      <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Sarah Johnson", votes: 2847, percent: 100 },
                      { name: "Maria Santos", votes: 2534, percent: 89 },
                      { name: "Emily Chen", votes: 2198, percent: 77 },
                    ].map((contestant, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-foreground">{contestant.name}</span>
                            <span className="text-xs font-medium text-muted-foreground">{contestant.votes.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-border rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                              style={{ width: `${contestant.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="default" className="w-full mt-6 rounded-full" size="lg">
                  Start Voting Contest
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Ticketing Product */}
            <div className="group relative bg-muted border border-border rounded-3xl p-6 md:p-8 lg:p-10 hover:border-accent/50 hover:shadow-2xl transition-all duration-500 overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />
              
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                    <Ticket className="h-7 w-7 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground">Event Ticketing</h3>
                    <p className="text-sm text-muted-foreground">For concerts, shows & ceremonies</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">
                  Sell tickets seamlessly with QR code verification. Fast check-ins, real-time capacity tracking, and zero hassle.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: "📱", text: "QR code tickets" },
                    { icon: "⚡", text: "Instant check-in" },
                    { icon: "🎫", text: "Tiered pricing" },
                    { icon: "📈", text: "Sales analytics" },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-3 bg-card/50 rounded-xl border border-border/50">
                      <span className="text-lg">{feature.icon}</span>
                      <span className="text-sm text-foreground font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Mini Ticket Preview */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-5">
                    <div className="flex-shrink-0 h-20 w-20 bg-accent/10 rounded-xl flex items-center justify-center border-2 border-dashed border-accent/30">
                      <QrCode className="h-12 w-12 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold text-foreground mb-1">Miss Universe 2024 Finals</div>
                      <div className="text-sm text-muted-foreground mb-2">VIP Section • Seat A-12</div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full font-semibold">VALID</span>
                        <span className="text-xs text-muted-foreground">Dec 15, 2024 • 7:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-6 rounded-full border-accent/50 text-accent hover:bg-accent hover:text-accent-foreground" size="lg">
                  Create Event
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {[
              { icon: Vote, label: "Votes Cast", value: "1M+" },
              { icon: Ticket, label: "Tickets Sold", value: "50K+" },
              { icon: BarChart3, label: "Events Hosted", value: "2K+" },
              { icon: Wallet, label: "Payouts Made", value: "$500K+" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-4 p-5 bg-muted border border-border rounded-2xl group hover:border-primary/30 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-xl lg:text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Showcase;
