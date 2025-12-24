import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import promoMan1 from "@/assets/promo-man-1.jpg";
import promoMan2 from "@/assets/promo-man-2.jpg";

const Hero = () => {
  return (
    <section className="pt-24 pb-12 bg-muted relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome to <span className="text-primary">VotePass</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Your all-in-one platform for contest voting & event ticketing
          </p>
        </div>

        {/* Promo Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Left Promo Card - Coral/Orange */}
          <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 md:p-8 overflow-hidden min-h-[280px] md:min-h-[320px] flex flex-col justify-between">
            {/* Badge */}
            <div className="inline-flex self-start px-3 py-1.5 bg-primary-foreground/20 backdrop-blur-sm rounded-full mb-4">
              <span className="text-sm font-medium text-primary-foreground">Early Birds</span>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-bold text-primary-foreground mb-2">
                Get Special Discount
              </h2>
              <div className="text-5xl md:text-6xl font-bold text-primary-foreground mb-4">
                10<span className="text-2xl">%</span>
              </div>
              <Button 
                variant="outline" 
                className="bg-primary-foreground text-primary border-none hover:bg-primary-foreground/90 rounded-full px-6"
              >
                Explore
              </Button>
            </div>

            {/* Image */}
            <div className="absolute right-0 bottom-0 w-[55%] md:w-[50%] h-full">
              <img
                src={promoMan1}
                alt="Friendly man pointing to special discount offer"
                className="absolute bottom-0 right-0 h-full w-full object-cover object-top"
              />
            </div>
          </div>

          {/* Right Promo Card - Beige/Cream */}
          <div className="relative bg-gradient-to-br from-secondary to-muted rounded-3xl p-6 md:p-8 overflow-hidden min-h-[280px] md:min-h-[320px] flex flex-col justify-between">
            {/* Badge */}
            <div className="inline-flex self-start px-3 py-1.5 bg-foreground/10 backdrop-blur-sm rounded-full mb-4">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-foreground/70" />
                <span className="text-sm font-medium text-foreground/70">Limited time</span>
              </div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 max-w-[50%]">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                Book Ticket at your{" "}
                <span className="text-primary">comfort zone.</span>
              </h2>
            </div>

            {/* Image */}
            <div className="absolute right-0 bottom-0 w-[55%] md:w-[50%] h-full">
              <img
                src={promoMan2}
                alt="Man comfortably booking tickets on laptop"
                className="absolute bottom-0 right-0 h-full w-full object-contain object-bottom"
              />
            </div>
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-2 w-8 bg-primary rounded-full" />
          <div className="h-2 w-2 bg-border rounded-full" />
          <div className="h-2 w-2 bg-border rounded-full" />
          <div className="h-2 w-2 bg-border rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
