import {
  Building2,
  Users,
  Vote,
  Ticket,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Megaphone,
  Link2,
  Wallet,
  Heart,
  FileText,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ServiceStep = { step: string; title: string; description: string };

type Service = {
  id: string;
  label: string;
  icon: LucideIcon;
  tagline: string;
  href: string;
  steps: ServiceStep[];
};

const services: Service[] = [
  {
    id: "ticketing",
    label: "Ticketing",
    icon: Ticket,
    tagline: "Sell tickets and manage check-ins",
    href: "/products/events",
    steps: [
      { step: "1", title: "Create Your Event", description: "Set up your event with details, venue, date, and ticket types in minutes." },
      { step: "2", title: "Customize Tickets", description: "Design ticket tiers, set pricing, limits, and early bird discounts." },
      { step: "3", title: "Share & Sell", description: "Share your event link on social media and start selling tickets instantly." },
      { step: "4", title: "Manage Check-ins", description: "Use our mobile scanner to validate tickets and track attendance in real-time." },
    ],
  },
  {
    id: "voting",
    label: "Voting",
    icon: Vote,
    tagline: "Run secure paid voting contests",
    href: "/products/contests",
    steps: [
      { step: "1", title: "Create Contest", description: "Set up your contest with categories, voting period, and pricing." },
      { step: "2", title: "Add Contestants", description: "Upload contestant profiles with photos and details. Assign categories." },
      { step: "3", title: "Launch & Share", description: "Go live and share your contest link. Contestants can share their own links." },
      { step: "4", title: "Track & Announce", description: "Monitor votes in real-time and announce winners when voting ends." },
    ],
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Heart,
    tagline: "Launch crowdfunding campaigns",
    href: "/products/crowdfunding",
    steps: [
      { step: "1", title: "Tell Your Story", description: "Create your campaign with a compelling story, images, and funding goal." },
      { step: "2", title: "Set Your Goal", description: "Define your target amount, deadline, and customize your campaign page." },
      { step: "3", title: "Share Widely", description: "Share with friends, family, and on social media to reach more donors." },
      { step: "4", title: "Collect & Withdraw", description: "Receive donations and withdraw funds directly to your bank account." },
    ],
  },
  {
    id: "forms",
    label: "Forms",
    icon: FileText,
    tagline: "Build forms with payments and logic",
    href: "/products/forms",
    steps: [
      { step: "1", title: "Build Your Form", description: "Drag and drop fields to create your perfect form in minutes." },
      { step: "2", title: "Add Logic & Payments", description: "Set up conditional rules and payment collection if needed." },
      { step: "3", title: "Share & Embed", description: "Share your form link or embed it on your website." },
      { step: "4", title: "Collect & Export", description: "Receive responses and export data to Excel or CSV." },
    ],
  },
  {
    id: "influencers",
    label: "Influencers",
    icon: TrendingUp,
    tagline: "Promote events and earn commissions",
    href: "/for-influencers",
    steps: [
      { step: "1", title: "Sign Up", description: "Create your free influencer account in minutes." },
      { step: "2", title: "Get Links", description: "Generate unique referral links for events you want to promote." },
      { step: "3", title: "Share & Earn", description: "Share with your audience and earn commissions on every sale." },
      { step: "4", title: "Get Paid", description: "Request payouts to your bank account or crypto wallet." },
    ],
  },
];

const organizerSteps = [
  {
    step: 1,
    icon: Building2,
    title: "Create Your Account",
    description: "Sign up as an organizer in minutes. Set up your profile with branding, logo, and payout details.",
  },
  {
    step: 2,
    icon: Vote,
    title: "Launch Your Project",
    description: "Create contests, events, crowdfunding campaigns, forms, or nominations with our easy builder.",
  },
  {
    step: 3,
    icon: DollarSign,
    title: "Get Paid Automatically",
    description: "Watch earnings flow in from votes, tickets, and donations. Withdraw to your bank anytime.",
  },
];

const userSteps = [
  {
    step: 1,
    icon: Users,
    title: "Create Your Profile",
    description: "Sign up in seconds with email or social login. Fund your wallet with multiple payment options.",
  },
  {
    step: 2,
    icon: Ticket,
    title: "Vote, Donate & Buy Tickets",
    description: "Support contestants, donate to campaigns, and purchase event tickets instantly.",
  },
  {
    step: 3,
    icon: CheckCircle,
    title: "Enjoy & Earn Rewards",
    description: "Attend events with QR tickets, track your favorites, and earn ₦500 for every referral.",
  },
];

const influencerSteps = [
  {
    step: 1,
    icon: Megaphone,
    title: "Join as an Influencer",
    description: "Sign up and get approved to promote contests and events to your audience.",
  },
  {
    step: 2,
    icon: Link2,
    title: "Share Your Unique Links",
    description: "Get custom referral links for each campaign. Track clicks and conversions in real-time.",
  },
  {
    step: 3,
    icon: Wallet,
    title: "Earn Commissions",
    description: "Get paid automatically for every sale. Request payouts to your bank or USDT wallet.",
  },
];

const ServiceStepsGrid = ({ steps }: { steps: ServiceStep[] }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
    {steps.map((item, index) => (
      <div key={item.step} className="relative">
        <div className="bg-muted border border-border rounded-2xl p-5 sm:p-6 h-full hover:border-primary/30 transition-colors">
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mb-4">
            {item.step}
          </div>
          <h4 className="text-base font-semibold text-foreground mb-2">{item.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
        </div>
        {index < steps.length - 1 && (
          <div className="hidden lg:block absolute top-1/2 -right-2.5 -translate-y-1/2">
            <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
          </div>
        )}
      </div>
    ))}
  </div>
);

type HowItWorksProps = {
  showIntro?: boolean;
};

const HowItWorks = ({ showIntro = true }: HowItWorksProps) => {
  return (
    <div className="py-10 sm:py-14 lg:py-20 bg-card relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1600px] mx-auto">
          {showIntro && (
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 lg:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-full mb-4 sm:mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground font-medium">Simple & Powerful</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
              Ticketing, voting, campaigns, forms, and influencer marketing — each with a clear path from setup to payout.
            </p>
          </div>
          )}

          <Tabs defaultValue="ticketing" className="mb-12 sm:mb-16 lg:mb-20">
            <TabsList className="flex h-auto w-full flex-wrap justify-center gap-1 bg-muted/80 p-1.5 rounded-xl sm:rounded-2xl mb-6 sm:mb-8">
              {services.map((service) => (
                <TabsTrigger
                  key={service.id}
                  value={service.id}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  <service.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  {service.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {services.map((service) => (
              <TabsContent key={service.id} value={service.id} className="mt-0 focus-visible:outline-none">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">{service.label}</h3>
                    <p className="text-sm text-muted-foreground">{service.tagline}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-fit shrink-0" asChild>
                    <Link to={service.href}>
                      Learn more
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
                <ServiceStepsGrid steps={service.steps} />
              </TabsContent>
            ))}
          </Tabs>

          <div className="border-t border-border pt-10 sm:pt-12 lg:pt-14">
            <div className="text-center mb-8 sm:mb-10">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
                Built for Everyone
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Whether you organize, participate, or promote — USEQIV has a flow for you.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-muted border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full mb-5 sm:mb-6">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-semibold text-foreground">For Organizers</span>
                </div>
                {organizerSteps.map((item, index) => (
                  <StepCard
                    key={item.step}
                    step={item.step}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    isLast={index === organizerSteps.length - 1}
                    variant="primary"
                  />
                ))}
              </div>

              <div className="bg-muted border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full mb-5 sm:mb-6">
                  <Users className="h-4 w-4 text-accent" />
                  <span className="text-xs sm:text-sm font-semibold text-foreground">For Participants</span>
                </div>
                {userSteps.map((item, index) => (
                  <StepCard
                    key={item.step}
                    step={item.step}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    isLast={index === userSteps.length - 1}
                    variant="accent"
                  />
                ))}
              </div>

              <div className="bg-muted border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full mb-5 sm:mb-6">
                  <Megaphone className="h-4 w-4 text-secondary-foreground" />
                  <span className="text-xs sm:text-sm font-semibold text-foreground">For Influencers</span>
                </div>
                {influencerSteps.map((item, index) => (
                  <StepCard
                    key={item.step}
                    step={item.step}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    isLast={index === influencerSteps.length - 1}
                    variant="secondary"
                  />
                ))}
              </div>
            </div>

            <div className="text-center mt-8 sm:mt-10">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StepCardProps {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  isLast: boolean;
  variant: "primary" | "accent" | "secondary";
}

const StepCard = ({ step, icon: Icon, title, description, isLast, variant }: StepCardProps) => {
  const colorClasses = {
    primary: {
      bg: "bg-primary text-primary-foreground",
      line: "bg-primary/20",
      icon: "text-primary",
    },
    accent: {
      bg: "bg-accent text-accent-foreground",
      line: "bg-accent/20",
      icon: "text-accent",
    },
    secondary: {
      bg: "bg-secondary text-secondary-foreground",
      line: "bg-secondary/20",
      icon: "text-secondary-foreground",
    },
  };
  const colors = colorClasses[variant];

  return (
    <div className="relative flex gap-3 sm:gap-4 group">
      <div className="flex flex-col items-center">
        <div
          className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-md group-hover:scale-110 transition-transform ${colors.bg}`}
        >
          {step}
        </div>
        {!isLast && <div className={`w-0.5 h-full min-h-[36px] sm:min-h-[44px] mt-2 ${colors.line}`} />}
      </div>
      <div className="pb-5 sm:pb-6 pt-0.5">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${colors.icon}`} />
          <h4 className="text-sm sm:text-base font-bold text-foreground">{title}</h4>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default HowItWorks;
