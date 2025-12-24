import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Sparkles, Shield, Clock } from "lucide-react";

const CTA = () => {
  const benefits = [
    { icon: Clock, text: "5-minute setup" },
    { icon: Shield, text: "No credit card required" },
    { icon: Sparkles, text: "Full features included" },
    { icon: CheckCircle, text: "Cancel anytime" },
  ];

  return (
    <section className="py-24 bg-card relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Card Container */}
          <div className="bg-background border border-border rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-bl-full" />
            
            <div className="relative text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground font-medium">Start your free trial today</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Ready to Transform Your{" "}
                <span className="text-primary">Events & Contests</span>?
              </h2>
              
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join 500+ organizers who've already modernized their voting and ticketing. 
                Launch your first contest or event in minutes.
              </p>

              {/* Benefits */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Button variant="hero" size="xl" className="group text-base min-w-[200px]">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="heroOutline" size="xl" className="min-w-[200px]">
                  Schedule a Demo
                </Button>
              </div>

              {/* Trust Text */}
              <p className="text-sm text-muted-foreground">
                Trusted by organizers in <span className="text-foreground font-medium">25+ countries</span> worldwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
