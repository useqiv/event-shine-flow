import { Building2, Users, Vote, Ticket, DollarSign, CheckCircle, ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const organizerSteps = [
    {
      step: 1,
      icon: Building2,
      title: "Create Your Account",
      description: "Sign up as an organizer in minutes. Set up your company profile with branding, logo, and payout details."
    },
    {
      step: 2,
      icon: Vote,
      title: "Launch Contests & Events",
      description: "Create voting contests or ticketed events with custom pricing, rules, and beautiful contestant pages."
    },
    {
      step: 3,
      icon: DollarSign,
      title: "Get Paid Automatically",
      description: "Watch earnings flow in as users vote and buy tickets. Withdraw to your bank anytime."
    }
  ];

  const userSteps = [
    {
      step: 1,
      icon: Users,
      title: "Create Your Profile",
      description: "Sign up in seconds with email or social login. Fund your wallet with multiple payment options."
    },
    {
      step: 2,
      icon: Vote,
      title: "Vote & Buy Tickets",
      description: "Support your favorite contestants with one-tap voting. Purchase event tickets instantly."
    },
    {
      step: 3,
      icon: CheckCircle,
      title: "Enjoy & Earn Rewards",
      description: "Attend events with QR tickets, track your favorites, and earn points for every action."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <ArrowRight className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground font-medium">Quick Start Guide</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Get Started in{" "}
            <span className="text-primary">3 Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're an organizer or participant, getting started takes just minutes.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Organizer Flow */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full mb-10 shadow-lg">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-semibold">For Organizers</span>
            </div>
            <div className="space-y-0">
              {organizerSteps.map((item, index) => (
                <StepCard key={index} {...item} isLast={index === organizerSteps.length - 1} variant="primary" />
              ))}
            </div>
          </div>

          {/* User Flow */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-full mb-10 shadow-lg">
              <Users className="h-4 w-4" />
              <span className="text-sm font-semibold">For Participants</span>
            </div>
            <div className="space-y-0">
              {userSteps.map((item, index) => (
                <StepCard key={index} {...item} isLast={index === userSteps.length - 1} variant="secondary" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface StepCardProps {
  step: number;
  icon: React.ElementType;
  title: string;
  description: string;
  isLast: boolean;
  variant: "primary" | "secondary";
}

const StepCard = ({ step, icon: Icon, title, description, isLast, variant }: StepCardProps) => {
  const isPrimary = variant === "primary";
  
  return (
    <div className="relative flex gap-6 group">
      {/* Step Number & Line */}
      <div className="flex flex-col items-center">
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 shadow-lg group-hover:scale-110 transition-transform ${
          isPrimary 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-secondary-foreground'
        }`}>
          {step}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-full min-h-[60px] mt-3 ${isPrimary ? 'bg-primary/20' : 'bg-secondary/20'}`} />
        )}
      </div>

      {/* Content */}
      <div className="pb-12">
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`h-5 w-5 ${isPrimary ? 'text-primary' : 'text-secondary'}`} />
          <h4 className="text-xl font-bold text-foreground">{title}</h4>
        </div>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default HowItWorks;
