import { Vote, Ticket, BarChart3, QrCode, Wallet, Trophy } from "lucide-react";

const Showcase = () => {
  return (
    <section className="py-12 bg-muted relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full mb-6">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground font-medium">Built for Entertainment & Events</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Two Powerful Products,{" "}
            <span className="text-primary">One Platform</span>
          </h2>
          <p className="text-muted-foreground">
            Whether you're running a beauty pageant or selling concert tickets, VotePass has you covered.
          </p>
        </div>

        {/* Product Cards */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Voting Product */}
          <div className="group relative bg-card border border-border rounded-3xl p-6 md:p-8 hover:border-primary/50 hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Vote className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Contest Voting</h3>
                  <p className="text-sm text-muted-foreground">For pageants, awards & competitions</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-5 text-sm">
                Run secure, transparent voting for any competition. Our AI-powered anti-fraud system ensures every vote counts.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: "🛡️", text: "Anti-fraud protection" },
                  { icon: "📊", text: "Live leaderboards" },
                  { icon: "🔗", text: "Shareable vote links" },
                  { icon: "💰", text: "Monetized voting" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span>{feature.icon}</span>
                    <span className="text-sm text-foreground">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Mini Dashboard Preview */}
              <div className="bg-muted border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">Top Contestants</span>
                  <span className="text-xs text-primary font-medium">● Live</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Sarah Johnson", votes: 2847, percent: 100 },
                    { name: "Maria Santos", votes: 2534, percent: 89 },
                    { name: "Emily Chen", votes: 2198, percent: 77 },
                  ].map((contestant, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{contestant.name}</span>
                          <span className="text-xs text-muted-foreground">{contestant.votes.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${contestant.percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ticketing Product */}
          <div className="group relative bg-card border border-border rounded-3xl p-6 md:p-8 hover:border-accent/50 hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-12 w-12 rounded-2xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                  <Ticket className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Event Ticketing</h3>
                  <p className="text-sm text-muted-foreground">For concerts, shows & ceremonies</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-5 text-sm">
                Sell tickets seamlessly with QR code verification. Fast check-ins, real-time capacity tracking, and zero hassle.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: "📱", text: "QR code tickets" },
                  { icon: "⚡", text: "Instant check-in" },
                  { icon: "🎫", text: "Tiered pricing" },
                  { icon: "📈", text: "Sales analytics" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span>{feature.icon}</span>
                    <span className="text-sm text-foreground">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Mini Ticket Preview */}
              <div className="bg-muted border border-border rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 h-14 w-14 bg-accent/10 rounded-xl flex items-center justify-center border border-dashed border-accent/30">
                    <QrCode className="h-8 w-8 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground mb-1">Miss Universe 2024 Finals</div>
                    <div className="text-xs text-muted-foreground mb-2">VIP Section • Seat A-12</div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">VALID</span>
                      <span className="text-xs text-muted-foreground">Dec 15, 2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 lg:gap-12">
          {[
            { icon: Vote, label: "Votes Cast", value: "1M+" },
            { icon: Ticket, label: "Tickets Sold", value: "50K+" },
            { icon: BarChart3, label: "Events Hosted", value: "2K+" },
            { icon: Wallet, label: "Payouts Made", value: "$500K+" },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Showcase;
