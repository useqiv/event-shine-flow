import { Music, Shirt, Dumbbell, UtensilsCrossed, Monitor, PartyPopper } from "lucide-react";

const Categories = () => {
  const categories = [
    { name: "Music", icon: Music },
    { name: "Fashion", icon: Shirt },
    { name: "Sport", icon: Dumbbell },
    { name: "Food", icon: UtensilsCrossed },
    { name: "Tech", icon: Monitor },
    { name: "Nightlife", icon: PartyPopper },
  ];

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Categories</h2>
      
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category.name}
            className="flex items-center gap-2 px-5 py-3 bg-card border border-border rounded-full hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
          >
            <category.icon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default Categories;
