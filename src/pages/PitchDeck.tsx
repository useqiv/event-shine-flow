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
    title: "Platform Status",
    subtitle: "Built, tested, and ready to scale",
    icon: BarChart3,
    content: [
      "DEVELOPMENT COMPLETE:",
      "• Full-featured platform — voting, ticketing, crowdfunding, forms",
      "• Payment integrations live — Flutterwave, crypto support",
      "• Anti-fraud system tested & operational",
      "• Influencer tracking & payout infrastructure ready",
      "",
      "TECHNICAL READINESS:",
      "• Production-grade architecture deployed",
      "• Serverless infrastructure scaling to millions",
      "• 99.9% uptime during internal testing",
      "",
      "NEXT MILESTONE: First paying customers (actively in pilot discussions)"
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
      "• Year 1: $50K GMV → $6K Revenue (first customers, validation)",
      "• Year 2: $300K GMV → $40K Revenue (market expansion)",
      "• Year 3: $1.2M GMV → $150K Revenue (scale phase)",
      "",
      "KEY MILESTONES:",
      "• First revenue: Month 3",
      "• 50 paying organizers: Month 9",
      "• Break-even: Month 18",
      "• Series A ready: Month 24"
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
      "• Deep experience in fintech & events space",
      "• Strong relationships with event agencies & influencers",
      "",
      "EXECUTION PROVES CAPABILITY:",
      "• Full platform built with minimal capital (<$20K)",
      "• Production-ready in 6 months from concept",
      "• Pilot discussions active with 10+ organizers"
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
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-5 w-5" />
          </Link>
          <span className="text-sm text-muted-foreground font-medium">
            {currentSlide + 1} / {slides.length}
          </span>
          <Button variant="ghost" size="sm" onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Slide Content */}
          <div className="relative min-h-[560px]">
            {slides.map((slide, index) => (
              <PitchDeckSlide
                key={slide.id}
                title={slide.title}
                subtitle={slide.subtitle}
                isActive={index === currentSlide}
              >
                {slide.id === 1 ? (
                  // Title Slide - Clean Hero
                  <div className="py-8">
                    <p className="text-xl md:text-2xl text-foreground leading-relaxed max-w-xl">
                      {slide.content[0]}
                    </p>
                    <p className="text-lg text-muted-foreground mt-6">
                      {slide.content[1]}
                    </p>
                    <div className="mt-12 pt-8 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">{slide.content[2]}</p>
                      <p className="text-primary font-semibold mt-1">{slide.content[3]}</p>
                    </div>
                  </div>
                ) : slide.id === 8 ? (
                  // Platform Status Slide - Clean Checklist
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { label: "Voting System", status: "Live" },
                        { label: "Ticketing", status: "Live" },
                        { label: "Crowdfunding", status: "Live" },
                        { label: "Form Builder", status: "Live" },
                        { label: "Payments", status: "Integrated" },
                        { label: "Influencer Tools", status: "Ready" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-3 border-b border-border/30">
                          <span className="text-foreground">{item.label}</span>
                          <span className="text-sm font-medium text-primary">{item.status}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-center pt-4 border-t border-border/50">
                      <p className="text-2xl font-bold text-foreground">Ready for Launch</p>
                      <p className="text-muted-foreground mt-1">Seeking first pilot customers</p>
                    </div>
                  </div>
                ) : slide.id === 13 ? (
                  // The Ask Slide - Clean Breakdown
                  <div className="space-y-8">
                    <div className="text-center">
                      <span className="text-5xl md:text-6xl font-bold text-foreground">$500K–$1M</span>
                      <p className="text-muted-foreground mt-3">18-month runway → Series A ready</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-border/50">
                      {[
                        { label: "Product", value: "40%" },
                        { label: "Growth", value: "30%" },
                        { label: "Team", value: "20%" },
                        { label: "Ops", value: "10%" },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <p className="text-2xl font-bold text-foreground">{item.value}</p>
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Default Layout - Clean Typography
                  <div className="space-y-4">
                    {slide.content.map((line, i) => (
                      <p 
                        key={i} 
                        className={`text-lg leading-relaxed ${
                          line.startsWith("•") 
                            ? "text-foreground pl-5" 
                            : line.endsWith(":") 
                              ? "font-semibold text-foreground mt-6 first:mt-0" 
                              : line === "" 
                                ? "h-2" 
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

          {/* Minimal Navigation */}
          <div className="flex items-center justify-between mt-12">
            <button
              onClick={() => goToSlide(currentSlide - 1)}
              disabled={currentSlide === 0}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </button>
            
            <div className="flex gap-1.5">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentSlide 
                      ? "bg-foreground w-6" 
                      : "bg-muted-foreground/20 w-1.5 hover:bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={() => goToSlide(currentSlide + 1)}
              disabled={currentSlide === slides.length - 1}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="text-sm">Next</span>
              <ChevronRight className="h-5 w-5" />
            </button>
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
