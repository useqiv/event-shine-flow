import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  Vote,
  HandHeart,
  FileText,
  Check,
  Sparkles,
  Calculator,
  Globe,
  Shield,
  Zap,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

type CountryCode = "NG" | "GH" | "KE" | "ZA" | "US" | "GB";

const COUNTRIES: Record<CountryCode, { name: string; currency: string; symbol: string; flat: number }> = {
  NG: { name: "Nigeria", currency: "NGN", symbol: "₦", flat: 100 },
  GH: { name: "Ghana", currency: "GHS", symbol: "₵", flat: 2 },
  KE: { name: "Kenya", currency: "KES", symbol: "KSh", flat: 30 },
  ZA: { name: "South Africa", currency: "ZAR", symbol: "R", flat: 5 },
  US: { name: "United States", currency: "USD", symbol: "$", flat: 0.5 },
  GB: { name: "United Kingdom", currency: "GBP", symbol: "£", flat: 0.4 },
};

type ProductKey = "events" | "voting" | "crowdfunding" | "forms";

const PRODUCTS: Record<ProductKey, {
  label: string;
  icon: typeof Ticket;
  tagline: string;
  percent: number;
  unit: string;
  freeTier: string;
  features: string[];
}> = {
  events: {
    label: "Event Ticketin",
    icon: Ticket,
    tagline: "Sell tickets, scan QR codes, manage check-ins.",
    percent: 8,
    unit: "per transation",
    freeTier: "Free events are 100% free — forever.",
    features: [
      "Unlimited free & paid events",
      "QR code ticket generation & scanning",
      "Multi-tier ticket types & promo codes",
      "Real-time check-in dashboard",
      "Attendee CSV export & analytics",
      "Pass fees to attendees (optional)",
    ],
  },
  voting: {
    label: "Contest Voting",
    icon: Vote,
    tagline: "Run paid voting contests with anti-fraud built in.",
    percent: 8,
    unit: "per paid vote",
    freeTier: "No setup fees. You only pay when votes are cast.",
    features: [
      "Unlimited contestants & categories",
      "Live leaderboard with realtime updates",
      "Anti-fraud & duplicate vote detection",
      "Influencer referral tracking",
      "Custom branding & vanity URLs",
      "Multi-currency vote pricing",
    ],
  },
  crowdfunding: {
    label: "Crowdfunding",
    icon: HandHeart,
    tagline: "Launch fundraising campaigns and reach your goal.",
    percent: 4,
    unit: "per donation",
    freeTier: "No platform fee on campaigns under your first $500 raised.",
    features: [
      "Goal tracking & milestone alerts",
      "Donor leaderboard & messages",
      "Campaign updates to keep donors engaged",
      "Anonymous donations supported",
      "Embeddable donate widget",
      "Automated tax receipts",
    ],
  },
  forms: {
    label: "Smart Forms",
    icon: FileText,
    tagline: "Build forms with payments, logic, and multi-page flows.",
    percent: 4,
    unit: "per paid submission",
    freeTier: "Unlimited free forms. Pay only when collecting payments.",
    features: [
      "Conditional logic & multi-page forms",
      "File uploads, signatures, ratings",
      "Payment collection on submissions",
      "Response export (CSV / Excel)",
      "Pre-built templates library",
      "Webhooks & integrations",
    ],
  },
};

const Pricing = () => {
  const [country, setCountry] = useState<CountryCode>("NG");
  const [product, setProduct] = useState<ProductKey>("events");
  const [calcAmount, setCalcAmount] = useState<string>("10000");
  const [calcQty, setCalcQty] = useState<string>("100");

  const c = COUNTRIES[country];
  const p = PRODUCTS[product];

  const calc = useMemo(() => {
    const amount = parseFloat(calcAmount) || 0;
    const qty = parseInt(calcQty) || 0;
    const gross = amount * qty;
    const feePerUnit = (amount * p.percent) / 100 + c.flat;
    const totalFee = feePerUnit * qty;
    const net = gross - totalFee;
    return { gross, totalFee, net, feePerUnit };
  }, [calcAmount, calcQty, p.percent, c.flat]);

  const fmt = (n: number) =>
    `${c.symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pricing — Pay Only When You Earn | USEQIV"
        description="Transparent pay-as-you-go pricing for events, contest voting, crowdfunding, and smart forms. No monthly fees. No hidden costs."
        canonicalUrl="https://useqiv.com/pricing"
      />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              No subscriptions. Ever.
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Pay only when{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                you earn.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              One platform. Four products. Transparent fees that scale with your success — not a flat monthly bill.
            </p>

            {/* Country selector */}
            <div className="inline-flex items-center gap-3 bg-card border border-border rounded-full px-5 py-2.5 shadow-sm">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Showing rates for</span>
              <Select value={country} onValueChange={(v) => setCountry(v as CountryCode)}>
                <SelectTrigger className="border-0 bg-transparent h-auto p-0 font-semibold focus:ring-0 gap-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COUNTRIES).map(([code, info]) => (
                    <SelectItem key={code} value={code}>
                      {info.name} ({info.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Product pricing tabs */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Tabs value={product} onValueChange={(v) => setProduct(v as ProductKey)} className="max-w-5xl mx-auto">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1.5 bg-muted/50 mb-8">
              {(Object.keys(PRODUCTS) as ProductKey[]).map((key) => {
                const item = PRODUCTS[key];
                const Icon = item.icon;
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="flex flex-col gap-1 py-3 px-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs md:text-sm font-medium">{item.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(Object.keys(PRODUCTS) as ProductKey[]).map((key) => {
              const item = PRODUCTS[key];
              return (
                <TabsContent key={key} value={key} className="mt-0">
                  <div className="grid lg:grid-cols-5 gap-6">
                    {/* Price card */}
                    <Card className="lg:col-span-2 p-8 bg-gradient-to-br from-primary/5 via-card to-accent/5 border-primary/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <item.icon className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-5xl md:text-6xl font-bold tracking-tight">{item.percent}%</span>
                          <span className="text-2xl font-semibold text-muted-foreground"> + {c.symbol}{c.flat}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">{item.unit}</p>
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <p className="text-sm">{item.freeTier}</p>
                        </div>
                        <Link to="/auth" className="block mt-6">
                          <Button size="lg" className="w-full group">
                            Get started free
                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </Card>

                    {/* Features */}
                    <Card className="lg:col-span-3 p-8">
                      <h3 className="text-lg font-semibold mb-1">Everything included</h3>
                      <p className="text-sm text-muted-foreground mb-6">{item.tagline}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {item.features.map((f) => (
                          <div key={f} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                              <Check className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-sm">{f}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3">
                <Calculator className="w-3.5 h-3.5 mr-1.5" />
                Fee calculator
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">See exactly what you'll pay</h2>
              <p className="text-muted-foreground">No surprises. Adjust the numbers below for {p.label} in {c.name}.</p>
            </div>

            <Card className="p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Price per {product === "crowdfunding" ? "donation" : product === "forms" ? "submission" : product === "voting" ? "vote" : "ticket"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{c.symbol}</span>
                    <Input
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(e.target.value)}
                      className="pl-9 h-12 text-lg"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Quantity sold
                  </label>
                  <Input
                    type="number"
                    value={calcQty}
                    onChange={(e) => setCalcQty(e.target.value)}
                    className="h-12 text-lg"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-4 pt-6 border-t">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Gross revenue</p>
                  <p className="text-lg md:text-2xl font-bold">{fmt(calc.gross)}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">USEQIV fee</p>
                  <p className="text-lg md:text-2xl font-bold text-muted-foreground">−{fmt(calc.totalFee)}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">You receive</p>
                  <p className="text-lg md:text-2xl font-bold text-primary">{fmt(calc.net)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Fee: {p.percent}% + {c.symbol}{c.flat} = {fmt(calc.feePerUnit)} per {product === "crowdfunding" ? "donation" : product === "forms" ? "submission" : product === "voting" ? "vote" : "ticket"}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* What's always included */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Included on every plan</h2>
              <p className="text-muted-foreground">Whether you're hosting your first event or your hundredth, you get the full toolkit.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Shield, title: "Anti-fraud protection", desc: "Built-in detection for duplicate votes, suspicious payments, and abuse." },
                { icon: TrendingUp, title: "Realtime analytics", desc: "Live dashboards for sales, attendees, votes, and donations." },
                { icon: Globe, title: "Multi-currency", desc: "Accept payments in NGN, USD, GHS, KES, ZAR, GBP and more." },
                { icon: Zap, title: "Instant payouts", desc: "Withdraw to your bank or USDT wallet whenever you want." },
                { icon: Sparkles, title: "Custom branding", desc: "Your logo, colors, and vanity URLs on every public page." },
                { icon: Check, title: "Unlimited everything", desc: "No caps on events, contestants, donors, or form responses." },
              ].map((item) => (
                <Card key={item.title} className="p-6 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Frequently asked questions</h2>
              <p className="text-muted-foreground">Still curious? <Link to="/contact" className="text-primary hover:underline">Talk to our team</Link>.</p>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {[
                {
                  q: "Are there any monthly or setup fees?",
                  a: "No. USEQIV is fully pay-as-you-go. You only pay a small percentage when you successfully collect money. Free events, free votes, and free form submissions cost you nothing.",
                },
                {
                  q: "Can I pass the fee to my attendees or voters?",
                  a: "Yes. You can absorb the fee yourself or pass it to your customers at checkout — it's a single toggle in your event or contest settings.",
                },
                {
                  q: "When do I get paid?",
                  a: "You can request payouts on demand. Once approved, funds typically settle within 1–2 business days for local bank transfers and within minutes for crypto (USDT) withdrawals.",
                },
                {
                  q: "Do payment processor fees come on top?",
                  a: "Our fee already covers Flutterwave/crypto payment processing — no extra hidden charges. You see the exact amount you'll receive in the calculator above.",
                },
                {
                  q: "What if I run a non-profit or charity?",
                  a: "We offer reduced rates for verified non-profits and large-scale charity campaigns. Contact our team for a custom quote.",
                },
                {
                  q: "Can I use multiple products at once?",
                  a: "Absolutely. One USEQIV account gives you access to all four products — events, voting, crowdfunding, and forms — with a unified dashboard and wallet.",
                },
              ].map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="bg-card border border-border rounded-lg px-5">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{item.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-10 md:p-14 text-center bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Start free in under 60 seconds</h2>
              <p className="text-base md:text-lg opacity-90 mb-8 max-w-xl mx-auto">
                No credit card required. Launch your first event, contest, campaign, or form today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Create free account
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Talk to sales
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
