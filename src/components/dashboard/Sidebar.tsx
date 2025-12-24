import { useState } from "react";
import { 
  Home, 
  LayoutDashboard, 
  CalendarPlus, 
  Users, 
  Store, 
  Vote, 
  Ticket,
  Settings,
  HelpCircle
} from "lucide-react";

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState("Home");

  const menuItems = [
    { name: "Home", icon: Home },
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Plan Event", icon: CalendarPlus },
    { name: "Event Planners", icon: Users },
    { name: "Vendors", icon: Store },
    { name: "E-Voting", icon: Vote },
    { name: "E-tickets", icon: Ticket },
  ];

  const bottomItems = [
    { name: "Setting", icon: Settings },
    { name: "Support", icon: HelpCircle },
  ];

  const MenuItem = ({ item, isActive }: { item: typeof menuItems[0]; isActive: boolean }) => (
    <button
      onClick={() => setActiveItem(item.name)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
        isActive 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
      <span className="text-sm">{item.name}</span>
    </button>
  );

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col p-4 fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
            <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
          </div>
        </div>
        <span className="text-xl font-bold">
          <span className="text-foreground">Event</span>
          <span className="text-primary">Sphere</span>
        </span>
      </div>

      {/* Menu Label */}
      <p className="text-xs text-muted-foreground font-medium px-2 mb-2">Menu</p>

      {/* Main Menu */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <MenuItem key={item.name} item={item} isActive={activeItem === item.name} />
        ))}
      </nav>

      {/* Bottom Menu */}
      <div className="space-y-1 pt-4 border-t border-border">
        {bottomItems.map((item) => (
          <MenuItem key={item.name} item={item} isActive={activeItem === item.name} />
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
