import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroCards = () => {
  return (
    <section className="mb-8">
      {/* Welcome Message */}
      <h1 className="text-2xl font-semibold text-foreground mb-6">
        Welcome back, <span className="text-foreground">Emma</span>
      </h1>

      {/* Hero Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Main Promo Card */}
        <div className="lg:col-span-3 bg-primary rounded-3xl p-6 relative overflow-hidden min-h-[220px]">
          {/* Badge */}
          <span className="inline-block px-3 py-1 bg-primary-foreground/20 text-primary-foreground text-xs font-medium rounded-full mb-4">
            Early Birds
          </span>
          
          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-primary-foreground text-xl font-semibold mb-1">
              Get Special Discount
            </h2>
            <p className="text-primary-foreground text-5xl font-bold mb-4">
              10<span className="text-3xl">%</span>
            </p>
            <Button 
              variant="secondary" 
              className="bg-background text-foreground hover:bg-background/90 rounded-full px-6"
            >
              Explore
            </Button>
          </div>

          {/* Decorative - Person placeholder */}
          <div className="absolute right-0 bottom-0 w-40 h-full bg-gradient-to-l from-primary/50 to-transparent" />
          
          {/* Carousel Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <div className="w-6 h-1.5 bg-primary-foreground rounded-full" />
            <div className="w-1.5 h-1.5 bg-primary-foreground/40 rounded-full" />
            <div className="w-1.5 h-1.5 bg-primary-foreground/40 rounded-full" />
            <div className="w-1.5 h-1.5 bg-primary-foreground/40 rounded-full" />
          </div>
        </div>

        {/* Secondary Card */}
        <div className="lg:col-span-2 bg-accent/10 rounded-3xl p-6 relative overflow-hidden min-h-[220px]">
          {/* Badge */}
          <span className="inline-block px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full mb-4">
            Limited time
          </span>
          
          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-foreground text-2xl font-semibold leading-tight">
              Book Ticket<br />
              at your<br />
              comfort zone.
            </h2>
          </div>

          {/* Decorative gradient */}
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-tl from-accent/20 to-transparent rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroCards;
