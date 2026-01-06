import { Shield, Zap, CheckCircle, Sparkles } from "lucide-react";
import heroGenzFemale from "@/assets/hero-genz-female.jpg";

const Hero = () => {
  const trustedBy = ["Miss Ghana", "Ghana Music Awards", "African Fashion Week", "Tech Summit Africa"];

  return (
    <section className="pt-24 lg:pt-28 pb-16 lg:pb-20 bg-muted relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="w-full px-4 md:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          {/* Main Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full mb-6 shadow-sm">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm font-medium text-foreground">Now serving 25+ countries</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-[1.1] mb-6">
                The Complete{" "}
                <span className="text-primary relative">
                  Event Platform
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-primary/30"
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                  >
                    <path d="M0 6 Q50 0, 100 6 T200 6" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                </span>{" "}
                for <span className="text-accent">Africa</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                Voting. Ticketing. Crowdfunding. Forms. Influencer Marketing. One powerful platform to run contests,
                events, campaigns and more.
              </p>

              {/* AI Features Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
                {[
                  { text: "AI-Powered" },
                  { text: "Smart Recommendations" },
                  { text: "Auto Content Generation" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                {[
                  { icon: Shield, text: "Anti-Fraud Protected" },
                  { icon: Zap, text: "Real-time Results" },
                  { icon: CheckCircle, text: "Instant Setup" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative max-w-md mx-auto lg:max-w-none">
              <div className="relative rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-2xl">
                <img 
                  src={heroGenzFemale} 
                  alt="Gen Z woman using USEQIV platform" 
                  className="w-full h-auto object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>
            </div>
          </div>

          {/* Trusted By Section */}
          <div className="mt-16 lg:mt-20 pt-10 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-6">Trusted by leading event organizers</p>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
              {trustedBy.map((brand, i) => (
                <div
                  key={i}
                  className="text-lg font-semibold text-muted-foreground/60 hover:text-foreground transition-colors cursor-default"
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
