import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import HowItWorks from "@/components/landing/HowItWorks";
import { Button } from "@/components/ui/button";

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>How It Works - USEQIV</title>
        <meta
          name="description"
          content="Learn how USEQIV works for ticketing, voting, campaigns, forms, and influencer marketing. Step-by-step guides for organizers, participants, and influencers."
        />
        <link rel="canonical" href="https://www.useqiv.com/how-it-works" />
      </Helmet>

      <Navbar />

      <section className="pt-32 pb-12 sm:pb-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Simple & Powerful</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              How It <span className="text-primary">Works</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Ticketing, voting, campaigns, forms, and influencer marketing — each with a clear path from setup to payout.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks showIntro={false} />

      <section className="py-16 lg:py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join organizers, participants, and influencers who trust USEQIV to power their events.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">Create Free Account</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/contact">
                Talk to Sales
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

export default HowItWorksPage;
