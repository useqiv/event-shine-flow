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
    <section className="py-16 bg-card relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Card Container */}
          <div className="bg-muted border border-border rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden">
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
            
            <div className="relative text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground font-medium">Start your free trial today</span>
              </div>

              {/* Headline */}
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                Ready to Transform Your{" "}
                <span className="text-primary">Events & Contests</span>?
              </h2>
              
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join 500+ organizers who've already modernized their voting and ticketing. 
                Launch your first contest or event in minutes.
              </p>

              {/* Benefits */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-foreground text-sm font-medium">{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <Button variant="default" size="lg" className="group rounded-full px-8">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-8">
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
