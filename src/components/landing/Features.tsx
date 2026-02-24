import {
  Sparkles,
  MessageSquareText,
  Wand2,
  Target,
  Share2,
  Shield,
  Globe,
  Smartphone,
  Zap,
  ArrowRight } from
"lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Features = () => {
  const aiFeatures = [
  {
    icon: MessageSquareText,
    title: "Intelligent Chat Assistant",
    desc: "Ask anything about contests, events, or campaigns. Get instant, contextual answers powered by advanced AI.",
    badge: "Most Popular"
  },
  {
    icon: Wand2,
    title: "One-Click Content Creation",
    desc: "Generate compelling event descriptions, campaign stories, and marketing copy in seconds—not hours."
  },
  {
    icon: Target,
    title: "Personalized Discovery",
    desc: "Smart algorithms learn your preferences to surface contests and events you'll actually love."
  },
  {
    icon: Share2,
    title: "Social Media Automation",
    desc: "Auto-generate platform-optimized posts for Instagram, Twitter, Facebook, and more."
  }];


  const platformStats = [
  { icon: Shield, value: "256-bit", label: "Bank-Grade Encryption", desc: "Your data is protected with military-grade security" },
  { icon: Globe, value: "50+", label: "Currencies Supported", desc: "Accept payments from anywhere in the world" },
  { icon: Smartphone, value: "100%", label: "Mobile Optimized", desc: "Seamless experience on any device" },
  { icon: Zap, value: "24hr", label: "Fast Settlements", desc: "Quick payouts to your bank account" }];


  return (
    <section id="features" className="py-16 sm:py-20 lg:py-28 bg-background relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">AI-Powered Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight">
              Work Smarter, Not Harder
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Let artificial intelligence handle the heavy lifting while you focus on what matters—growing your audience and revenue.
            </p>
          </div>

          {/* AI Features - Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-16 sm:mb-20 lg:mb-28">
            {aiFeatures.map((feature, i) =>
            <div
              key={i}
              className={`group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl border transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 ${
              i === 0 ?
              'bg-gradient-to-br from-primary/5 via-background to-background border-primary/20 md:col-span-2 md:flex md:items-center md:gap-8' :
              'bg-card border-border hover:border-primary/30'}`
              }>

                {/* Badge for featured item */}
                {feature.badge &&
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                    <span className="px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                      {feature.badge}
                    </span>
                  </div>
              }
                
                <div className={`${i === 0 ? 'md:flex-shrink-0' : ''}`}>
                  <div className={`inline-flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-5 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300 ${
                i === 0 ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-12 w-12 sm:h-14 sm:w-14'}`
                }>
                    <feature.icon className={`text-primary ${i === 0 ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-6 w-6 sm:h-7 sm:w-7'}`} />
                  </div>
                </div>
                
                <div className={`${i === 0 ? 'md:flex-1' : ''}`}>
                  <h3 className={`font-bold text-foreground mb-2 sm:mb-3 ${
                i === 0 ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-lg sm:text-xl'}`
                }>
                    {feature.title}
                  </h3>
                  <p className={`text-muted-foreground leading-relaxed ${
                i === 0 ? 'text-base sm:text-lg max-w-xl' : 'text-sm sm:text-base'}`
                }>
                    {feature.desc}
                  </p>
                  
                  {i === 0 &&
                <Button asChild variant="outline" className="mt-6 group/btn rounded-full">
                      <Link to="/auth" className="flex items-center gap-2">
                        Try It Free
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                }
                </div>
                
                {/* Hover gradient effect */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            )}
          </div>

          {/* Platform Stats - Modern Cards */}
          



































        </div>
      </div>
    </section>);

};

export default Features;