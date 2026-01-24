import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Sparkles, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  const benefits = [
    { icon: Clock, text: "5-minute setup" },
    { icon: Shield, text: "No credit card required" },
    { icon: Sparkles, text: "Full features included" },
    { icon: CheckCircle, text: "Cancel anytime" },
  ];

  return (
    <section className="py-10 sm:py-14 lg:py-24 bg-muted relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/4 w-[250px] sm:w-[400px] lg:w-[500px] h-[250px] sm:h-[400px] lg:h-[500px] bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[250px] sm:w-[400px] lg:w-[500px] h-[250px] sm:h-[400px] lg:h-[500px] bg-accent/10 rounded-full blur-3xl" />

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1200px] mx-auto">
          {/* Card Container */}
          <div className="bg-card border border-border rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 md:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-24 sm:w-36 lg:w-48 h-24 sm:h-36 lg:h-48 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-16 sm:w-24 lg:w-32 h-16 sm:h-24 lg:h-32 bg-gradient-to-tr from-accent/10 to-transparent rounded-tr-full" />
            
            <div className="relative text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-muted border border-border rounded-full mb-5 sm:mb-6 lg:mb-8">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm text-foreground font-medium">Start your free trial today</span>
              </div>

              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 leading-tight px-2">
                Ready to Launch Your{" "}
                <span className="text-primary">Next Big Thing</span>?
              </h2>
              
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto px-2">
                Join 500+ organizers running contests, events, campaigns, and more. 
                Launch your first project in minutes.
              </p>

              {/* CTA Button */}
              <div className="flex items-center justify-center mb-5 sm:mb-6 lg:mb-8">
                <Button asChild variant="default" size="lg" className="group rounded-full px-6 sm:px-10 text-sm sm:text-base h-11 sm:h-14 shadow-lg shadow-primary/20 w-full sm:w-auto">
                  <Link to="/auth">
                    Get Started
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              {/* Trust Text */}
              <p className="text-xs sm:text-sm text-muted-foreground">
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
