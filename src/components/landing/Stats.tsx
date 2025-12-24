import { TrendingUp } from "lucide-react";

const Stats = () => {
  const stats = [
    {
      value: "1M+",
      label: "Votes Processed",
      description: "Secure & verified",
      growth: "+127% YoY"
    },
    {
      value: "500+",
      label: "Event Organizers",
      description: "Globally trusted",
      growth: "+85% YoY"
    },
    {
      value: "50K+",
      label: "Tickets Sold",
      description: "QR-verified entries",
      growth: "+200% YoY"
    },
    {
      value: "99.9%",
      label: "Uptime",
      description: "Enterprise reliability",
      growth: "SLA guaranteed"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-primary via-primary to-secondary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
            Trusted by Organizers Worldwide
          </h2>
          <p className="text-primary-foreground/80">
            Growing rapidly across 25+ countries
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-2 group-hover:scale-105 transition-transform">
                {stat.value}
              </div>
              <div className="text-lg font-medium text-primary-foreground/90 mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-primary-foreground/70 mb-2">
                {stat.description}
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary-foreground/10 rounded-full">
                <TrendingUp className="h-3 w-3 text-primary-foreground/80" />
                <span className="text-xs text-primary-foreground/80">{stat.growth}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
