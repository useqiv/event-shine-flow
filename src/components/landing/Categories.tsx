import { Vote, Ticket, Heart, FileText, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Categories = () => {
  const categories = [
    { icon: Vote, label: "Contests", color: "group-hover:bg-primary/10 group-hover:border-primary/30" },
    { icon: Ticket, label: "Events", color: "group-hover:bg-accent/10 group-hover:border-accent/30" },
    { icon: Heart, label: "Campaigns", color: "group-hover:bg-pink-500/10 group-hover:border-pink-500/30" },
    { icon: FileText, label: "Forms", color: "group-hover:bg-blue-500/10 group-hover:border-blue-500/30" },
    { icon: TrendingUp, label: "Influencers", color: "group-hover:bg-green-500/10 group-hover:border-green-500/30" },
  ];

  return (
    <section className="py-6 sm:py-8 lg:py-12 bg-muted">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">What You Can Create</h2>
            <Link to="/auth" className="text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Get Started
            </Link>
          </div>
          
          {/* Categories - Horizontal scroll on mobile, grid on larger screens */}
          <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`group flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 lg:p-6 bg-card border border-border rounded-xl sm:rounded-2xl hover:shadow-lg transition-all duration-300 min-w-[80px] sm:min-w-0 shrink-0 sm:shrink ${category.color}`}
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <category.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <span className="text-foreground font-medium text-xs sm:text-sm">{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Categories;
