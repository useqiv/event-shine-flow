const Stats = () => {
  const stats = [
    {
      value: "1M+",
      label: "Votes Processed",
      description: "Secure and verified"
    },
    {
      value: "500+",
      label: "Event Organizers",
      description: "Trust our platform"
    },
    {
      value: "50K+",
      label: "Tickets Sold",
      description: "QR-verified entries"
    },
    {
      value: "99.9%",
      label: "Uptime",
      description: "Enterprise reliability"
    }
  ];

  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-medium text-primary-foreground/90 mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-primary-foreground/70">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
