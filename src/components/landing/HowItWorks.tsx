import { Building2, Users, Vote, Ticket, DollarSign, CheckCircle, ArrowRight, Sparkles, Megaphone, Link2, Wallet } from "lucide-react";

const HowItWorks = () => {
  const organizerSteps = [
    {
      step: 1,
      icon: Building2,
      title: "Create Your Account",
      description: "Sign up as an organizer in minutes. Set up your profile with branding, logo, and payout details."
    },
    {
      step: 2,
      icon: Vote,
      title: "Launch Your Project",
      description: "Create contests, events, crowdfunding campaigns, forms, or nominations with our easy builder."
    },
    {
      step: 3,
      icon: DollarSign,
      title: "Get Paid Automatically",
      description: "Watch earnings flow in from votes, tickets, and donations. Withdraw to your bank anytime."
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
      icon: Ticket,
      title: "Vote, Donate & Buy Tickets",
      description: "Support contestants, donate to campaigns, and purchase event tickets instantly."
    },
    {
      step: 3,
      icon: CheckCircle,
      title: "Enjoy & Earn Rewards",
      description: "Attend events with QR tickets, track your favorites, and earn ₦500 for every referral."
    }
  ];

  const influencerSteps = [
    {
      step: 1,
      icon: Megaphone,
      title: "Join as an Influencer",
      description: "Sign up and get approved to promote contests and events to your audience."
    },
    {
      step: 2,
      icon: Link2,
      title: "Share Your Unique Links",
      description: "Get custom referral links for each campaign. Track clicks and conversions in real-time."
    },
    {
      step: 3,
      icon: Wallet,
      title: "Earn Commissions",
      description: "Get paid automatically for every sale. Request payouts to your bank or USDT wallet."
    }
  ];

  return (
    <section id="how-it-works" className="py-14 lg:py-20 bg-card relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="w-full px-4 md:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1600px] mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground font-medium">Quick Start Guide</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Get Started in{" "}
              <span className="text-primary">3 Simple Steps</span>
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg">
              Whether you're an organizer, participant, or influencer, getting started takes just minutes.
            </p>
          </div>

          {/* Three Column Layout */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Organizer Flow */}
            <div className="bg-muted border border-border rounded-3xl p-6 lg:p-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full mb-8 shadow-md">
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
            <div className="bg-muted border border-border rounded-3xl p-6 lg:p-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-full mb-8 shadow-md">
                <Users className="h-4 w-4" />
                <span className="text-sm font-semibold">For Participants</span>
              </div>
              <div className="space-y-0">
                {userSteps.map((item, index) => (
                  <StepCard key={index} {...item} isLast={index === userSteps.length - 1} variant="accent" />
                ))}
              </div>
            </div>

            {/* Influencer Flow */}
            <div className="bg-muted border border-border rounded-3xl p-6 lg:p-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full mb-8 shadow-md">
                <Megaphone className="h-4 w-4" />
                <span className="text-sm font-semibold">For Influencers</span>
              </div>
              <div className="space-y-0">
                {influencerSteps.map((item, index) => (
                  <StepCard key={index} {...item} isLast={index === influencerSteps.length - 1} variant="secondary" />
                ))}
              </div>
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
  variant: "primary" | "accent" | "secondary";
}

const StepCard = ({ step, icon: Icon, title, description, isLast, variant }: StepCardProps) => {
  const colorClasses = {
    primary: {
      bg: 'bg-primary text-primary-foreground',
      line: 'bg-primary/20',
      icon: 'text-primary'
    },
    accent: {
      bg: 'bg-accent text-accent-foreground',
      line: 'bg-accent/20',
      icon: 'text-accent'
    },
    secondary: {
      bg: 'bg-secondary text-secondary-foreground',
      line: 'bg-secondary/20',
      icon: 'text-secondary-foreground'
    }
  };
  
  const colors = colorClasses[variant];
  
  return (
    <div className="relative flex gap-5 group">
      {/* Step Number & Line */}
      <div className="flex flex-col items-center">
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 shadow-lg group-hover:scale-110 transition-transform ${colors.bg}`}>
          {step}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-full min-h-[60px] mt-3 ${colors.line}`} />
        )}
      </div>

      {/* Content */}
      <div className="pb-10 pt-1">
        <div className="flex items-center gap-2.5 mb-2">
          <Icon className={`h-5 w-5 ${colors.icon}`} />
          <h4 className="text-lg font-bold text-foreground">{title}</h4>
        </div>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default HowItWorks;
