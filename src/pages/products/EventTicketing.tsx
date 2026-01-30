import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Ticket, QrCode, Users, CreditCard, BarChart3, Clock, 
  Smartphone, Shield, Globe, CheckCircle, ArrowRight, Calendar
} from "lucide-react";

const EventTicketing = () => {
  const features = [
    { 
      icon: Ticket, 
      title: "Multiple Ticket Types", 
      description: "Create regular, VIP, early bird, and group tickets with different pricing tiers." 
    },
    { 
      icon: QrCode, 
      title: "QR Code Tickets", 
      description: "Each ticket comes with a unique QR code for secure and fast check-in at your venue." 
    },
    { 
      icon: Smartphone, 
      title: "Mobile Scanner App", 
      description: "Scan tickets directly from your phone. Works offline and syncs when connected." 
    },
    { 
      icon: Users, 
      title: "Guest Management", 
      description: "Track attendees, manage transfers, and handle ticket sharing seamlessly." 
    },
    { 
      icon: CreditCard, 
      title: "Multiple Payment Options", 
      description: "Accept cards, bank transfers, mobile money, and cryptocurrency payments." 
    },
    { 
      icon: BarChart3, 
      title: "Real-time Analytics", 
      description: "Monitor sales, check-ins, and revenue with live dashboards and reports." 
    },
  ];

  const howItWorks = [
    { step: "1", title: "Create Your Event", description: "Set up your event with details, venue, date, and ticket types in minutes." },
    { step: "2", title: "Customize Tickets", description: "Design ticket tiers, set pricing, limits, and early bird discounts." },
    { step: "3", title: "Share & Sell", description: "Share your event link on social media and start selling tickets instantly." },
    { step: "4", title: "Manage Check-ins", description: "Use our mobile scanner to validate tickets and track attendance in real-time." },
  ];

  const benefits = [
    "Instant ticket delivery via email",
    "Automated event reminders",
    "Ticket transfer & sharing",
    "Custom event branding",
    "Promo codes & discounts",
    "Influencer tracking links",
    "Attendee communication tools",
    "Export attendee lists",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Ticket className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Event Ticketing</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Sell Tickets & Manage <span className="text-primary">Check-ins Seamlessly</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Create events, sell tickets with secure QR codes, and manage attendees all from one powerful platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">Create Your Event</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/events">Browse Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get your event up and running in just a few simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-card border border-border rounded-2xl p-6 h-full">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Event Ticketing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make selling tickets and managing events effortless.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Choose USEQIV for Events?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join hundreds of event organizers who trust us to handle their ticketing, from small gatherings to large-scale concerts.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-3xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Shield className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Secure Payments</div>
                    <div className="text-sm text-muted-foreground">PCI-compliant payment processing</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Clock className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Fast Payouts</div>
                    <div className="text-sm text-muted-foreground">Get your money within 24-48 hours</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Globe className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Multi-Currency</div>
                    <div className="text-sm text-muted-foreground">Accept NGN, GHS, USD and more</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <Calendar className="h-10 w-10 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Auto Reminders</div>
                    <div className="text-sm text-muted-foreground">Automated emails before event day</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-3xl p-8 lg:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Sell Tickets?
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Create your first event in minutes and start selling tickets today. No upfront costs.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EventTicketing;
