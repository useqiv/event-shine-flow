import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import promoMan1 from "@/assets/promo-man-1.jpg";
import promoMan2 from "@/assets/promo-man-2.jpg";

const Hero = () => {
  return (
    <section className="pt-24 pb-8 bg-muted relative overflow-hidden">
      {/* Full Width Container */}
      <div className="w-full px-4 md:px-6 lg:px-8">
        {/* Welcome Header - Full Width */}
        <div className="max-w-[1600px] mx-auto mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">New Features Available</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Welcome to <span className="text-primary">VotePass</span>
              </h1>
              <p className="text-muted-foreground mt-2 text-base md:text-lg max-w-xl">
                Your all-in-one platform for contest voting & event ticketing
              </p>
            </div>
            <Button variant="default" className="rounded-full px-6 self-start md:self-auto">
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Promo Cards Grid - Full Width */}
        <div className="max-w-[1600px] mx-auto">
          <div className="grid md:grid-cols-5 gap-4 md:gap-6 mb-6">
            {/* Left Promo Card - Coral/Orange (Larger) */}
            <div className="md:col-span-3 relative bg-gradient-to-br from-primary via-primary to-primary/70 rounded-3xl p-6 md:p-8 lg:p-10 overflow-hidden min-h-[300px] md:min-h-[360px] lg:min-h-[400px] flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow">
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-primary-foreground/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/3 w-40 h-40 bg-primary-foreground/5 rounded-full blur-2xl" />
              
              {/* Badge */}
              <div className="inline-flex self-start px-4 py-2 bg-primary-foreground/20 backdrop-blur-sm rounded-full">
                <span className="text-sm font-semibold text-primary-foreground">Early Birds</span>
              </div>
              
              {/* Content */}
              <div className="relative z-10 mt-auto">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-2">
                  Get Special Discount
                </h2>
                <div className="text-6xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-6">
                  10<span className="text-3xl md:text-4xl align-top">%</span>
                </div>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="bg-primary-foreground text-primary border-none hover:bg-primary-foreground/90 rounded-full px-8 font-semibold shadow-md"
                >
                  Explore Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* Image */}
              <div className="absolute right-0 bottom-0 w-[50%] md:w-[45%] lg:w-[40%] h-full pointer-events-none">
                <img
                  src={promoMan1}
                  alt="Friendly man pointing to special discount offer"
                  className="absolute bottom-0 right-0 h-full w-full object-cover object-top drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Right Promo Card - Beige/Cream */}
            <div className="md:col-span-2 relative bg-gradient-to-br from-secondary via-secondary to-muted rounded-3xl p-6 md:p-8 overflow-hidden min-h-[300px] md:min-h-[360px] lg:min-h-[400px] flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow border border-border/50">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
              
              {/* Badge */}
              <div className="inline-flex self-start px-4 py-2 bg-foreground/10 backdrop-blur-sm rounded-full">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-foreground/70" />
                  <span className="text-sm font-semibold text-foreground/70">Limited time</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 max-w-[55%] mt-auto">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4">
                  Book Ticket at your{" "}
                  <span className="text-primary">comfort zone.</span>
                </h2>
                <Button 
                  variant="outline"
                  className="rounded-full px-6 border-foreground/20 hover:bg-foreground/5"
                >
                  Learn More
                </Button>
              </div>

              {/* Image */}
              <div className="absolute right-0 bottom-0 w-[55%] md:w-[50%] h-full pointer-events-none">
                <img
                  src={promoMan2}
                  alt="Man comfortably booking tickets on laptop"
                  className="absolute bottom-0 right-0 h-full w-full object-contain object-bottom drop-shadow-xl"
                />
              </div>
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-2.5 w-10 bg-primary rounded-full shadow-sm" />
            <div className="h-2.5 w-2.5 bg-border rounded-full hover:bg-primary/50 transition-colors cursor-pointer" />
            <div className="h-2.5 w-2.5 bg-border rounded-full hover:bg-primary/50 transition-colors cursor-pointer" />
            <div className="h-2.5 w-2.5 bg-border rounded-full hover:bg-primary/50 transition-colors cursor-pointer" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
