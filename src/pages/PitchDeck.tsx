import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PitchDeckSlide } from "@/components/pitch/PitchDeckSlide";
import { usePitchDeckExport } from "@/hooks/usePitchDeckExport";
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Home,
  Presentation,
  Target,
  Lightbulb,
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  Rocket,
  Eye,
  Mail
} from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const slides = [
  {
    id: 1,
    title: "UseQiv",
    subtitle: "Africa's Event Infrastructure Layer",
    icon: Presentation,
    content: [
      "The operating system for African events, contests & campaigns.",
      "Capturing a $8B+ market with a capital-efficient, scalable SaaS model.",
      "Airaplay Innovation Labs Limited | Nigeria",
      "Seed Round: $500K–$1M"
    ]
  },
  {
    id: 2,
    title: "The Opportunity",
    subtitle: "$8B+ market, zero dominant platform",
    icon: Target,
    content: [
      "MASSIVE UNDERSERVED MARKET:",
      "• 1.4B people, 54 countries, fastest-growing youth population",
      "• Events industry growing 12-15% CAGR across the continent",
      "• No unified platform exists—organizers use 5-8 fragmented tools",
      "",
      "WHY NOW:",
      "• Mobile money & digital payments now mainstream (60%+ penetration)",
      "• Post-COVID shift to hybrid & digital-first events",
      "• Creator economy exploding—influencer marketing is key distribution"
    ]
  },
  {
    id: 3,
    title: "The Problem",
    subtitle: "Fragmentation kills revenue",
    icon: Target,
    content: [
      "ORGANIZERS LOSE 15-25% REVENUE TO:",
      "• Tool fragmentation — juggling voting, ticketing, payments, forms",
      "• Fraud & manipulation — vote rigging erodes trust & repeat usage",
      "• Payment friction — limited options, slow cross-border payouts",
      "• No attribution — can't track which promoters drive sales",
      "",
      "RESULT: $1.2B+ in annual value leakage across the ecosystem"
    ]
  },
  {
    id: 4,
    title: "Our Solution",
    subtitle: "One platform, five revenue streams",
    icon: Lightbulb,
    content: [
      "UNIFIED PLATFORM:",
      "• Contest Voting — Anti-fraud, real-time leaderboards, custom pricing",
      "• Event Ticketing — QR validation, transfers, mobile check-in",
      "• Crowdfunding — Goal tracking, donor management, embeds",
      "• Form Builder — Conditional logic, file uploads, payment collection",
      "• Influencer Marketing — Referral links, commission tracking, payouts",
      "",
      "NETWORK EFFECT: Each module drives users to others"
    ]
  },
  {
    id: 5,
    title: "Defensibility",
    subtitle: "Three compounding moats",
    icon: BarChart3,
    content: [
      "1. DATA NETWORK EFFECTS",
      "• Every transaction improves fraud detection & recommendations",
      "• Organizer success data creates switching costs",
      "",
      "2. EMBEDDED DISTRIBUTION",
      "• Built-in influencer network = viral acquisition at near-zero CAC",
      "• Referral system turns every user into a promoter",
      "",
      "3. PLATFORM LOCK-IN",
      "• Multi-product usage increases retention 3x",
      "• Webhook integrations embed us into organizer workflows"
    ]
  },
  {
    id: 6,
    title: "Scalability",
    subtitle: "Built for 100x growth",
    icon: TrendingUp,
    content: [
      "TECHNICAL SCALABILITY:",
      "• Serverless architecture — zero marginal infrastructure cost",
      "• Edge functions auto-scale to millions of concurrent users",
      "• Multi-tenant by design — one codebase serves all markets",
      "",
      "GO-TO-MARKET SCALABILITY:",
      "• Self-serve onboarding — organizers sign up in <5 minutes",
      "• Localized payments — Flutterwave covers 30+ African countries",
      "• Copy-paste expansion — launch new country in <2 weeks"
    ]
  },
  {
    id: 7,
    title: "Capital Efficiency",
    subtitle: "Profitable unit economics from Day 1",
    icon: DollarSign,
    content: [
      "REVENUE MODEL:",
      "• 10-15% commission on all transactions",
      "• Average transaction: $3-8 USD (NGN 2,000-5,000)",
      "• Gross margin: 85%+ (pure software)",
      "",
      "LEAN OPERATIONS:",
      "• CAC near-zero via viral referral + influencer network",
      "• <$50K monthly burn at current scale",
      "• Path to profitability without additional capital",
      "",
      "LTV:CAC RATIO: >20:1 (target for African SaaS)"
    ]
  },
  {
    id: 8,
    title: "Traction",
    subtitle: "Proven product-market fit",
    icon: BarChart3,
    content: [
      "CURRENT PERFORMANCE:",
      "• 1M+ Votes Processed",
      "• 500+ Organizers",
      "• 25+ Countries Served",
      "• 50K+ Tickets Sold",
      "• NGN 50M+ Total Processed",
      "• 99.9% Platform Uptime",
      "",
      "GROWTH: Votes +127% YoY | Organizers +85% YoY | Tickets +200% YoY"
    ]
  },
  {
    id: 9,
    title: "Market Size",
    subtitle: "Land and expand strategy",
    icon: TrendingUp,
    content: [
      "TAM: $8B+ African events industry",
      "SAM: $2.5B digital event services (25 countries)",
      "SOM: $50M processed by Year 3 → $5-7.5M revenue",
      "",
      "EXPANSION PATH:",
      "• Year 1: Nigeria, Ghana (proven markets)",
      "• Year 2: Kenya, South Africa, Tanzania",
      "• Year 3+: Pan-African, then Middle East/diaspora",
      "",
      "COMPARABLE: Eventbrite processes $4B+ annually in mature markets"
    ]
  },
  {
    id: 10,
    title: "Competitive Landscape",
    subtitle: "No integrated competitor exists",
    icon: Target,
    content: [
      "FRAGMENTED ALTERNATIVES:",
      "• Eventbrite — Ticketing only, minimal Africa presence",
      "• GoFundMe — Crowdfunding only, no Africa focus",
      "• Local apps — Single-feature, poor UX, limited payments",
      "",
      "OUR ADVANTAGE:",
      "• Only all-in-one platform built for African infrastructure",
      "• Anti-fraud as core differentiator (not an afterthought)",
      "• Multi-currency + crypto from day one",
      "• Distribution built-in via influencer network"
    ]
  },
  {
    id: 11,
    title: "Go-To-Market",
    subtitle: "Viral loops + partnerships",
    icon: Rocket,
    content: [
      "ACQUISITION CHANNELS:",
      "• Influencer network — built-in viral distribution",
      "• Event agency partnerships — bulk onboarding",
      "• Social proof — public leaderboards drive FOMO",
      "",
      "RETENTION FLYWHEEL:",
      "• Successful events → repeat usage → referrals",
      "• Multi-product adoption → higher switching costs",
      "• Real-time analytics → data-driven organizers stay",
      "",
      "TARGET: 3x organizers (500→1,500) in 12 months"
    ]
  },
  {
    id: 12,
    title: "Financial Projections",
    subtitle: "Conservative, milestone-driven",
    icon: TrendingUp,
    content: [
      "PROJECTIONS (USD):",
      "• 2026: $120K GMV → $15K Revenue (proving model)",
      "• 2027: $500K GMV → $60K Revenue (market expansion)",
      "• 2028: $1.5M GMV → $180K Revenue (scale phase)",
      "",
      "KEY MILESTONES:",
      "• Break-even: Month 18",
      "• Positive cash flow: Month 24",
      "• Series A ready: Month 30"
    ]
  },
  {
    id: 13,
    title: "The Ask",
    subtitle: "$500K–$1M Seed Round",
    icon: DollarSign,
    content: [
      "USE OF FUNDS:",
      "• Product (40%): Mobile apps, AI features, scale infrastructure",
      "• Growth (30%): Market expansion, partnerships, influencer incentives",
      "• Team (20%): Engineering, country managers, customer success",
      "• Operations (10%): Legal, compliance, contingency",
      "",
      "18-MONTH RUNWAY at current burn",
      "Clear milestones for Series A readiness"
    ]
  },
  {
    id: 14,
    title: "Why Us",
    subtitle: "Operator-founders with unfair advantages",
    icon: Users,
    content: [
      "FOUNDER-MARKET FIT:",
      "• Built in Africa, for Africa — understand local nuances",
      "• Previous exits in fintech & events space",
      "• Deep relationships with event agencies & influencers",
      "",
      "TRACTION PROVES EXECUTION:",
      "• $50M+ processed with minimal capital",
      "• 25+ countries without dedicated sales team",
      "• 99.9% uptime on lean infrastructure"
    ]
  },
  {
    id: 15,
    title: "Vision",
    subtitle: "The Stripe for African Events",
    icon: Eye,
    content: [
      "NEAR-TERM (3 YEARS):",
      "• Pan-African coverage — 50+ countries",
      "• $100M+ annual transaction volume",
      "• Profitable, cash-flow positive",
      "",
      "LONG-TERM (5-7 YEARS):",
      "• Infrastructure layer for all African events",
      "• API-first platform enabling third-party innovation",
      "• Strategic acquisition or IPO"
    ]
  },
  {
    id: 16,
    title: "Let's Build Together",
    subtitle: "Next steps",
    icon: Mail,
    content: [
      "UseQiv — Airaplay Innovation Labs Limited",
      "Federal Republic of Nigeria",
      "",
      "legal@useqiv.com | privacy@useqiv.com",
      "",
      "NEXT STEPS:",
      "1. Schedule product demo",
      "2. Share detailed financials & cap table",
      "3. Customer reference calls",
      "4. Term sheet discussion"
    ]
  }
];

const PitchDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { exportToPDF, isExporting } = usePitchDeckExport();

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index);
    }
  };

  const handleExport = () => {
    const exportData = slides.map(slide => ({
      title: slide.title,
      content: [slide.subtitle || "", ...slide.content]
    }));
    exportToPDF(exportData);
  };

  const progress = ((currentSlide + 1) / slides.length) * 100;
  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Investor Pitch Deck</h1>
              <p className="text-sm text-muted-foreground">UseQiv - Airaplay Innovation Labs</p>
            </div>
          </div>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
        <Progress value={progress} className="h-1" />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Slide Counter */}
          <div className="flex items-center justify-between mb-6">
            <Badge variant="secondary" className="text-sm">
              <CurrentIcon className="h-4 w-4 mr-2" />
              Slide {currentSlide + 1} of {slides.length}
            </Badge>
            <div className="flex gap-1">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide 
                      ? "bg-primary w-6" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Slide Content */}
          <div className="relative min-h-[600px]">
            {slides.map((slide, index) => (
              <PitchDeckSlide
                key={slide.id}
                title={slide.title}
                subtitle={slide.subtitle}
                isActive={index === currentSlide}
              >
                {slide.id === 1 ? (
                  // Title Slide - Special Layout
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
                      <Presentation className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                      {slide.content[0]}
                    </p>
                    <p className="text-lg text-foreground mb-4">
                      {slide.content[1]}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mt-8">
                      {["Voting", "Ticketing", "Crowdfunding", "Forms", "Influencers"].map((tag) => (
                        <Badge key={tag} variant="outline" className="text-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : slide.id === 8 ? (
                  // Traction Slide - Grid Layout
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Votes Processed", value: "1M+" },
                      { label: "Organizers", value: "500+" },
                      { label: "Countries", value: "25+" },
                      { label: "Tickets Sold", value: "50K+" },
                      { label: "GMV Processed", value: "$30K+" },
                      { label: "Uptime", value: "99.9%" },
                    ].map((metric) => (
                      <Card key={metric.label} className="bg-muted/50">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl md:text-3xl font-bold text-primary">{metric.value}</p>
                          <p className="text-sm text-muted-foreground">{metric.label}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : slide.id === 13 ? (
                  // The Ask Slide - Visual Breakdown
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <span className="text-4xl font-bold text-primary">$500K – $1M</span>
                      <p className="text-muted-foreground mt-2">18-month runway • Series A ready</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Product", value: 40, desc: "Mobile apps, AI, infrastructure" },
                        { label: "Growth", value: 30, desc: "Market expansion, partnerships" },
                        { label: "Team", value: 20, desc: "Engineering, country managers" },
                        { label: "Operations", value: 10, desc: "Legal, compliance, contingency" },
                      ].map((item) => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{item.label} ({item.value}%)</span>
                            <span className="text-muted-foreground">{item.desc}</span>
                          </div>
                          <Progress value={item.value} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Default Layout
                  <div className="space-y-3">
                    {slide.content.map((line, i) => (
                      <p 
                        key={i} 
                        className={`text-base md:text-lg ${
                          line.startsWith("•") 
                            ? "text-foreground pl-4" 
                            : line.endsWith(":") 
                              ? "font-semibold text-primary mt-4" 
                              : line === "" 
                                ? "h-4" 
                                : "text-muted-foreground"
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </PitchDeckSlide>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => goToSlide(currentSlide - 1)}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Use arrow keys or swipe to navigate
            </div>
            <Button
              onClick={() => goToSlide(currentSlide + 1)}
              disabled={currentSlide === slides.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>

      {/* Keyboard Navigation */}
      <KeyboardHandler 
        onPrev={() => goToSlide(currentSlide - 1)} 
        onNext={() => goToSlide(currentSlide + 1)} 
      />
    </div>
  );
};

const KeyboardHandler = ({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) => {
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });
  return null;
};

export default PitchDeck;
