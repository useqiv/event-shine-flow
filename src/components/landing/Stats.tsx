import { TrendingUp, Vote, Users, Clock } from "lucide-react";

const Stats = () => {
  const stats = [
  {
    icon: Vote,
    value: "1M+",
    label: "Votes Processed",
    description: "Secure & verified",
    growth: "+127% YoY"
  },
  {
    icon: Users,
    value: "500+",
    label: "Event Organizers",
    description: "Globally trusted",
    growth: "+85% YoY"
  },
  {
    icon: Users,
    value: "3K+",
    label: "Users",
    description: "Active platform users",
    growth: "+200% YoY"
  },
  {
    icon: Clock,
    value: "99.9%",
    label: "Uptime",
    description: "Enterprise reliability",
    growth: "SLA guaranteed"
  }];


  return (
    <section className="py-10 sm:py-14 lg:py-20 bg-gradient-to-br from-primary via-primary to-accent relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Decorative Elements */}
      
      <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-2 sm:mb-3 px-2">
              Trusted by Organizers Worldwide
            </h2>
            <p className="text-primary-foreground/80 text-sm sm:text-base lg:text-lg px-4">
              Growing rapidly across 25+ countries with proven results
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {stats.map((stat, index) =>
            <div key={index} className="group">
                <div className="bg-primary-foreground/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 hover:bg-primary-foreground/15 transition-all duration-300 border border-primary-foreground/10 h-full">
                  {/* Icon */}
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-primary-foreground/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                  </div>
                  
                  {/* Value */}
                  <div className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-1 sm:mb-2 group-hover:scale-105 transition-transform origin-left">
                    {stat.value}
                  </div>
                  
                  {/* Label */}
                  <div className="text-sm sm:text-base lg:text-lg font-semibold text-primary-foreground/90 mb-0.5 sm:mb-1">
                    {stat.label}
                  </div>
                  
                  {/* Description - Hidden on small mobile */}
                  <div className="hidden sm:block text-xs sm:text-sm text-primary-foreground/70 mb-2 sm:mb-4">
                    {stat.description}
                  </div>
                  
                  {/* Growth Badge */}
                  <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary-foreground/10 rounded-full">
                    <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-foreground/80" />
                    <span className="text-[10px] sm:text-xs font-medium text-primary-foreground/80">{stat.growth}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>);

};

export default Stats;