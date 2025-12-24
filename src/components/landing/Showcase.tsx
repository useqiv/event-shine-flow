import { Vote, Ticket, BarChart3, QrCode, Wallet, Trophy } from "lucide-react";

const Showcase = () => {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground font-medium">Built for Entertainment & Events</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Two Powerful Products,{" "}
            <span className="text-primary">One Platform</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're running a beauty pageant or selling concert tickets, VotePass has you covered.
          </p>
        </div>

        {/* Product Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Voting Product */}
          <div className="group relative bg-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Vote className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Contest Voting</h3>
                  <p className="text-sm text-muted-foreground">For pageants, awards & competitions</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                Run secure, transparent voting for any competition. Our AI-powered anti-fraud system ensures every vote counts.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { icon: "🛡️", text: "Anti-fraud protection" },
                  { icon: "📊", text: "Live leaderboards" },
                  { icon: "🔗", text: "Shareable vote links" },
                  { icon: "💰", text: "Monetized voting" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-lg">{feature.icon}</span>
                    <span className="text-sm text-foreground">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Mini Dashboard Preview */}
              <div className="bg-background/50 border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">Top Contestants</span>
                  <span className="text-xs text-primary font-medium">Live</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Sarah Johnson", votes: 2847, percent: 100 },
                    { name: "Maria Santos", votes: 2534, percent: 89 },
                    { name: "Emily Chen", votes: 2198, percent: 77 },
                  ].map((contestant, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{contestant.name}</span>
                          <span className="text-xs text-muted-foreground">{contestant.votes.toLocaleString()} votes</span>
                        </div>
                        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
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
          <div className="group relative bg-card border border-border rounded-2xl p-8 hover:border-secondary/50 hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-colors" />
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-xl bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                  <Ticket className="h-7 w-7 text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Event Ticketing</h3>
                  <p className="text-sm text-muted-foreground">For concerts, shows & ceremonies</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                Sell tickets seamlessly with QR code verification. Fast check-ins, real-time capacity tracking, and zero hassle.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { icon: "📱", text: "QR code tickets" },
                  { icon: "⚡", text: "Instant check-in" },
                  { icon: "🎫", text: "Tiered pricing" },
                  { icon: "📈", text: "Sales analytics" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-lg">{feature.icon}</span>
                    <span className="text-sm text-foreground">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Mini Ticket Preview */}
              <div className="bg-background/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 h-16 w-16 bg-secondary/10 rounded-lg flex items-center justify-center border border-dashed border-secondary/30">
                    <QrCode className="h-10 w-10 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground mb-1">Miss Universe 2024 Finals</div>
                    <div className="text-xs text-muted-foreground mb-2">VIP Section • Seat A-12</div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">VALID</span>
                      <span className="text-xs text-muted-foreground">Dec 15, 2024 • 7:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {[
            { icon: Vote, label: "Votes Cast", value: "1M+" },
            { icon: Ticket, label: "Tickets Sold", value: "50K+" },
            { icon: BarChart3, label: "Events Hosted", value: "2K+" },
            { icon: Wallet, label: "Payouts Made", value: "$500K+" },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-lg bg-card border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
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
