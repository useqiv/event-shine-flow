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
    subtitle: "The Complete Event Platform for Africa",
    icon: Presentation,
    content: [
      "Voting. Ticketing. Crowdfunding. Forms. Influencer Marketing.",
      "One powerful platform to run contests, events, and campaigns.",
      "Operated by Airaplay Innovation Labs Limited",
      "Nigeria | legal@useqiv.com"
    ]
  },
  {
    id: 2,
    title: "The Problem",
    subtitle: "Africa's event ecosystem is fragmented",
    icon: Target,
    content: [
      "• Fragmented Tools - Organizers juggle 5-8 different platforms",
      "• Fraud & Manipulation - Vote rigging erodes trust",
      "• Payment Challenges - Limited options, slow payouts",
      "• No Influencer Infrastructure - No structured promotion",
      "• Lack of Analytics - Organizers make decisions blindly",
      "",
      "Event organizers lose 15-25% revenue to inefficiencies"
    ]
  },
  {
    id: 3,
    title: "The Solution",
    subtitle: "One Platform, Infinite Possibilities",
    icon: Lightbulb,
    content: [
      "• Contest Voting - Secure voting with anti-fraud protection",
      "• Event Ticketing - QR-validated tickets & mobile check-in",
      "• Crowdfunding - Goal tracking & embeddable widgets",
      "• Form Builder - Drag-and-drop with conditional logic",
      "• Influencer Marketing - Referral tracking & commissions",
      "",
      "Key: Multi-currency support, AI-powered features, real-time analytics"
    ]
  },
  {
    id: 4,
    title: "Product Overview",
    subtitle: "Built for everyone in the ecosystem",
    icon: Users,
    content: [
      "FOR ORGANIZERS:",
      "• Real-time dashboards, team collaboration, custom branding",
      "• Commission management, payout options, webhook integrations",
      "",
      "FOR PARTICIPANTS:",
      "• Wallet system, QR tickets, referral rewards (NGN 500/referral)",
      "",
      "FOR INFLUENCERS:",
      "• Custom referral links, real-time earnings, bank/USDT payouts"
    ]
  },
  {
    id: 5,
    title: "Technology Stack",
    subtitle: "Modern, Scalable Architecture",
    icon: BarChart3,
    content: [
      "• Frontend: React, TypeScript, Tailwind CSS, Vite",
      "• Backend: Supabase (PostgreSQL, Edge Functions, Real-time)",
      "• Payments: Flutterwave, Crypto (USDT, USDC, BTC, ETH)",
      "• AI: Content generation, recommendations, chat assistant",
      "",
      "23 Edge Functions deployed for payments, fraud detection, notifications",
      "",
      "Security: Bank-level encryption, fraud detection, NDPA compliant"
    ]
  },
  {
    id: 6,
    title: "Market Opportunity",
    subtitle: "Massive untapped potential",
    icon: TrendingUp,
    content: [
      "TAM (Total Addressable Market):",
      "• African events industry: $8B+ annually (12-15% CAGR)",
      "",
      "SAM (Serviceable Addressable Market):",
      "• Digital event services: $2.5B across 25+ countries",
      "",
      "SOM (Serviceable Obtainable Market):",
      "• Year 3 target: $50M processed, $5-7.5M platform revenue"
    ]
  },
  {
    id: 7,
    title: "Business Model",
    subtitle: "Multiple revenue streams",
    icon: DollarSign,
    content: [
      "REVENUE STREAMS:",
      "• Vote Sales: 10-15% commission",
      "• Ticket Sales: 10-15% commission",
      "• Donations: 8-10% commission",
      "• Form Submissions: Fixed fee or percentage",
      "• Premium Features: Subscription model",
      "",
      "Unit Economics: Avg transaction NGN 2,000-5,000, positive from Day 1"
    ]
  },
  {
    id: 8,
    title: "Traction & Metrics",
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
      "Growth: Votes +127% YoY, Organizers +85% YoY, Tickets +200% YoY"
    ]
  },
  {
    id: 9,
    title: "Growth Strategy",
    subtitle: "Phased expansion plan",
    icon: Rocket,
    content: [
      "PHASE 1 (Current): Nigeria & Ghana focus, build organizer network",
      "PHASE 2 (Year 2): Expand to Kenya, South Africa, Tanzania",
      "PHASE 3 (Year 2-3): Live streaming, NFT ticketing, AI insights",
      "PHASE 4 (Year 3+): Enterprise API, white-label solutions",
      "",
      "Marketing: Built-in influencer network, social auto-posting, referrals"
    ]
  },
  {
    id: 10,
    title: "Competitive Advantage",
    subtitle: "First-mover in all-in-one platform",
    icon: Target,
    content: [
      "UseQiv vs. Competitors:",
      "• Eventbrite: Ticketing only, limited Africa focus",
      "• GoFundMe: Crowdfunding only, no Africa focus",
      "• Typeform: Forms only, no payments",
      "• Local Apps: Limited features, fragmented",
      "",
      "UseQiv: Only all-in-one platform with anti-fraud, multi-currency, influencer marketing, and AI features"
    ]
  },
  {
    id: 11,
    title: "Financial Projections",
    subtitle: "Path to profitability",
    icon: TrendingUp,
    content: [
      "REVENUE PROJECTIONS:",
      "• 2026: NGN 200M GMV → NGN 20-30M Revenue",
      "• 2027: NGN 800M GMV → NGN 80-120M Revenue (+300%)",
      "• 2028: NGN 2.5B GMV → NGN 250-375M Revenue (+213%)",
      "",
      "Break-even expected in Year 2",
      "Scalable infrastructure with minimal marginal cost"
    ]
  },
  {
    id: 12,
    title: "The Ask",
    subtitle: "Funding request: $500K - $1M",
    icon: DollarSign,
    content: [
      "USE OF FUNDS:",
      "• Technology (40%): Platform scaling, mobile apps, AI features",
      "• Marketing (25%): User acquisition, partnerships",
      "• Operations (20%): Team expansion, customer success",
      "• Legal & Compliance (10%): Licensing, regional compliance",
      "• Reserve (5%): Contingency",
      "",
      "Milestones: 3x organizer growth, 3 new markets, mobile app launch"
    ]
  },
  {
    id: 13,
    title: "Vision",
    subtitle: "The infrastructure layer for African events",
    icon: Eye,
    content: [
      "OUR MISSION:",
      "Become the infrastructure layer for all events, contests, and campaigns across Africa.",
      "",
      "LONG-TERM VISION:",
      "• 50+ countries served",
      "• $1B+ annual transaction volume",
      "• The 'Stripe for African Events'",
      "• IPO/Exit in 5-7 years"
    ]
  },
  {
    id: 14,
    title: "Let's Connect",
    subtitle: "Next steps",
    icon: Mail,
    content: [
      "UseQiv",
      "Operated by Airaplay Innovation Labs Limited",
      "Federal Republic of Nigeria",
      "",
      "Email: legal@useqiv.com",
      "Privacy: privacy@useqiv.com",
      "",
      "Next Steps:",
      "1. Schedule deep-dive demo",
      "2. Review detailed financials",
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
                  // Metrics Slide - Grid Layout
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Votes Processed", value: "1M+" },
                      { label: "Organizers", value: "500+" },
                      { label: "Countries", value: "25+" },
                      { label: "Tickets Sold", value: "50K+" },
                      { label: "Processed", value: "₦50M+" },
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
                ) : slide.id === 12 ? (
                  // The Ask Slide - Visual Breakdown
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <span className="text-4xl font-bold text-primary">$500K - $1M</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Technology", value: 40, desc: "Platform scaling, mobile apps, AI" },
                        { label: "Marketing", value: 25, desc: "User acquisition, partnerships" },
                        { label: "Operations", value: 20, desc: "Team expansion, customer success" },
                        { label: "Legal", value: 10, desc: "Licensing, compliance" },
                        { label: "Reserve", value: 5, desc: "Contingency" },
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
