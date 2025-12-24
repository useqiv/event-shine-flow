import { Music, Shirt, Trophy, UtensilsCrossed, MonitorSmartphone, PartyPopper } from "lucide-react";

const Categories = () => {
  const categories = [
    { icon: Music, label: "Music", color: "group-hover:bg-pink-500/10 group-hover:border-pink-500/30" },
    { icon: Shirt, label: "Fashion", color: "group-hover:bg-purple-500/10 group-hover:border-purple-500/30" },
    { icon: Trophy, label: "Sport", color: "group-hover:bg-amber-500/10 group-hover:border-amber-500/30" },
    { icon: UtensilsCrossed, label: "Food", color: "group-hover:bg-green-500/10 group-hover:border-green-500/30" },
    { icon: MonitorSmartphone, label: "Tech", color: "group-hover:bg-blue-500/10 group-hover:border-blue-500/30" },
    { icon: PartyPopper, label: "Nightlife", color: "group-hover:bg-orange-500/10 group-hover:border-orange-500/30" },
  ];

  return (
    <section className="py-10 lg:py-12 bg-muted">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Categories</h2>
            <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              View All
            </button>
          </div>
          
          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 lg:gap-4">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`group flex flex-col items-center justify-center gap-3 p-5 lg:p-6 bg-card border border-border rounded-2xl hover:shadow-lg transition-all duration-300 ${category.color}`}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <category.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-foreground font-medium text-sm">{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Categories;
