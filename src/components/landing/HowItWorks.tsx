import { Building2, Users, Vote, Ticket, DollarSign, CheckCircle } from "lucide-react";

const HowItWorks = () => {
  const organizerSteps = [
    {
      step: 1,
      icon: Building2,
      title: "Create Your Account",
      description: "Sign up as an organizer and set up your company profile with branding."
    },
    {
      step: 2,
      icon: Vote,
      title: "Launch Contests & Events",
      description: "Create voting contests or ticketed events with custom pricing and rules."
    },
    {
      step: 3,
      icon: DollarSign,
      title: "Get Paid Automatically",
      description: "Watch earnings flow in as users vote and buy tickets. Withdraw anytime."
    }
  ];

  const userSteps = [
    {
      step: 1,
      icon: Users,
      title: "Create Your Profile",
      description: "Sign up in seconds and fund your wallet with multiple payment options."
    },
    {
      step: 2,
      icon: Vote,
      title: "Vote & Buy Tickets",
      description: "Support your favorite contestants and purchase event tickets instantly."
    },
    {
      step: 3,
      icon: CheckCircle,
      title: "Enjoy & Earn Rewards",
      description: "Attend events, track your favorites, and earn points for every action."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple Steps to{" "}
            <span className="text-primary">Get Started</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're an organizer or participant, getting started takes just minutes.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Organizer Flow */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">For Organizers</span>
            </div>
            <div className="space-y-8">
              {organizerSteps.map((item, index) => (
                <StepCard key={index} {...item} isLast={index === organizerSteps.length - 1} />
              ))}
            </div>
          </div>

          {/* User Flow */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 border border-secondary/30 rounded-full mb-8">
              <Users className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-foreground">For Participants</span>
            </div>
            <div className="space-y-8">
              {userSteps.map((item, index) => (
                <StepCard key={index} {...item} isLast={index === userSteps.length - 1} />
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
}

const StepCard = ({ step, icon: Icon, title, description, isLast }: StepCardProps) => {
  return (
    <div className="relative flex gap-4">
      {/* Step Number & Line */}
      <div className="flex flex-col items-center">
        <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
          {step}
        </div>
        {!isLast && (
          <div className="w-px h-full bg-border mt-2" />
        )}
      </div>

      {/* Content */}
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-5 w-5 text-primary" />
          <h4 className="text-lg font-semibold text-foreground">{title}</h4>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default HowItWorks;
