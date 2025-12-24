import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Sparkles, Shield, Clock, Play } from "lucide-react";

const CTA = () => {
  const benefits = [
    { icon: Clock, text: "5-minute setup" },
    { icon: Shield, text: "No credit card required" },
    { icon: Sparkles, text: "Full features included" },
    { icon: CheckCircle, text: "Cancel anytime" },
  ];

  return (
    <section className="py-16 lg:py-24 bg-muted relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />

      <div className="w-full px-4 md:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1200px] mx-auto">
          {/* Card Container */}
          <div className="bg-card border border-border rounded-[2rem] p-8 md:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/10 to-transparent rounded-tr-full" />
            
            <div className="relative text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-full mb-8">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground font-medium">Start your free trial today</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                Ready to Transform Your{" "}
                <span className="text-primary">Events & Contests</span>?
              </h2>
              
              <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
                Join 500+ organizers who've already modernized their voting and ticketing. 
                Launch your first contest or event in minutes.
              </p>

              {/* Benefits */}
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mb-10">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Button variant="default" size="lg" className="group rounded-full px-10 text-base h-14 shadow-lg shadow-primary/20">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-10 text-base h-14">
                  <Play className="h-5 w-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Trust Text */}
              <p className="text-sm text-muted-foreground">
                Trusted by organizers in <span className="text-foreground font-semibold">25+ countries</span> worldwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
