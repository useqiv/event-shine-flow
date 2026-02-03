import { Building2, Users, Vote, Ticket, DollarSign, CheckCircle, ArrowRight, Sparkles, Megaphone, Link2, Wallet } from "lucide-react";
const HowItWorks = () => {
  const organizerSteps = [{
    step: 1,
    icon: Building2,
    title: "Create Your Account",
    description: "Sign up as an organizer in minutes. Set up your profile with branding, logo, and payout details."
  }, {
    step: 2,
    icon: Vote,
    title: "Launch Your Project",
    description: "Create contests, events, crowdfunding campaigns, forms, or nominations with our easy builder."
  }, {
    step: 3,
    icon: DollarSign,
    title: "Get Paid Automatically",
    description: "Watch earnings flow in from votes, tickets, and donations. Withdraw to your bank anytime."
  }];
  const userSteps = [{
    step: 1,
    icon: Users,
    title: "Create Your Profile",
    description: "Sign up in seconds with email or social login. Fund your wallet with multiple payment options."
  }, {
    step: 2,
    icon: Ticket,
    title: "Vote, Donate & Buy Tickets",
    description: "Support contestants, donate to campaigns, and purchase event tickets instantly."
  }, {
    step: 3,
    icon: CheckCircle,
    title: "Enjoy & Earn Rewards",
    description: "Attend events with QR tickets, track your favorites, and earn ₦500 for every referral."
  }];
  const influencerSteps = [{
    step: 1,
    icon: Megaphone,
    title: "Join as an Influencer",
    description: "Sign up and get approved to promote contests and events to your audience."
  }, {
    step: 2,
    icon: Link2,
    title: "Share Your Unique Links",
    description: "Get custom referral links for each campaign. Track clicks and conversions in real-time."
  }, {
    step: 3,
    icon: Wallet,
    title: "Earn Commissions",
    description: "Get paid automatically for every sale. Request payouts to your bank or USDT wallet."
  }];
  return <section id="how-it-works" className="py-10 sm:py-14 lg:py-20 bg-card relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] bg-primary/5 rounded-full blur-3xl" />

      
    </section>;
};
interface StepCardProps {
  step: number;
  icon: React.ElementType;
  title: string;
  description: string;
  isLast: boolean;
  variant: "primary" | "accent" | "secondary";
}
const StepCard = ({
  step,
  icon: Icon,
  title,
  description,
  isLast,
  variant
}: StepCardProps) => {
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
  return <div className="relative flex gap-3 sm:gap-4 lg:gap-5 group">
      {/* Step Number & Line */}
      <div className="flex flex-col items-center">
        <div className={`h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-base sm:text-lg lg:text-xl shrink-0 shadow-lg group-hover:scale-110 transition-transform ${colors.bg}`}>
          {step}
        </div>
        {!isLast && <div className={`w-0.5 h-full min-h-[40px] sm:min-h-[50px] lg:min-h-[60px] mt-2 sm:mt-3 ${colors.line}`} />}
      </div>

      {/* Content */}
      <div className="pb-6 sm:pb-8 lg:pb-10 pt-0.5 sm:pt-1">
        <div className="flex items-center gap-2 sm:gap-2.5 mb-1 sm:mb-2">
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.icon}`} />
          <h4 className="text-base sm:text-lg font-bold text-foreground">{title}</h4>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{description}</p>
      </div>
    </div>;
};
export default HowItWorks;