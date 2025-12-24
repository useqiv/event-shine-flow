import { Music, Shirt, Trophy, UtensilsCrossed, MonitorSmartphone, PartyPopper } from "lucide-react";

const Categories = () => {
  const categories = [
    { icon: Music, label: "Music" },
    { icon: Shirt, label: "Fashion" },
    { icon: Trophy, label: "Sport" },
    { icon: UtensilsCrossed, label: "Food" },
    { icon: MonitorSmartphone, label: "Tech" },
    { icon: PartyPopper, label: "Nightlife" },
  ];

  return (
    <section className="py-8 bg-muted">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold text-foreground mb-6">Categories</h2>
        
        <div className="flex flex-wrap gap-3">
          {categories.map((category, index) => (
            <button
              key={index}
              className="inline-flex items-center gap-2.5 px-5 py-3 bg-card border border-border rounded-full hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <div className="text-primary group-hover:scale-110 transition-transform">
                <category.icon className="h-5 w-5" />
              </div>
              <span className="text-foreground font-medium">{category.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
