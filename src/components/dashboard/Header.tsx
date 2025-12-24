import { Search, Bell, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="flex items-center justify-between py-4 px-6">
      {/* Search Bar */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search organizers, events, ven..." 
            className="pl-10 pr-4 bg-background border-border rounded-xl h-11"
          />
        </div>
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border">
          <Filter className="h-4 w-4 text-primary" />
        </Button>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notification */}
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
            2
          </span>
        </Button>

        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" />
            <AvatarFallback>E</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
