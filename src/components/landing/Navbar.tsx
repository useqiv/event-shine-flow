import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Search, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import appLogo from "@/assets/logo.png";
import { useUserRole } from "@/hooks/useUserRole";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: role } = useUserRole();
  const isAdmin = role === 'admin';

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
    }
  };

  const navLinks = [
    { name: "Campaigns", href: "/campaigns" },
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "/how-it-works" },
  ];

  const productLinks = [
    { 
      name: "Events", 
      href: "/products/events", 
      description: "Create events, sell tickets with QR codes, and manage check-ins seamlessly" 
    },
    { 
      name: "Contest Voting", 
      href: "/products/contests", 
      description: "Run secure paid voting competitions with real-time leaderboards and anti-fraud protection" 
    },
    { 
      name: "Crowdfunding", 
      href: "/products/crowdfunding", 
      description: "Launch fundraising campaigns, track donations, and reach your goals faster" 
    },
    { 
      name: "Smart Forms", 
      href: "/products/forms", 
      description: "Build custom forms with payments, conditional logic, and multi-page support" 
    },
  ];

  const companyLinks = [
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group shrink-0">
            <img src={appLogo} alt="USEQIV" className="h-10 group-hover:scale-105 transition-transform" />
          </a>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-9 py-2 text-sm bg-card border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-md transition-colors">
                <Search className="h-4 w-4 text-primary" />
              </button>
            </div>
          </form>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            <Link to="/how-it-works" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors">How It Works</Link>
            <Link to="/pricing" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Pricing</Link>
            <Link to="/about" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors">About USEQIV</Link>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"}>
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || 'User'} />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {profile?.full_name && (
                          <p className="font-medium">{profile.full_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {!isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] overflow-y-auto">
              <SheetHeader className="text-left pb-4">
                <SheetTitle>
                  <img src={appLogo} alt="USEQIV" className="h-8" />
                </SheetTitle>
              </SheetHeader>

              {/* User Section - Prominent at top */}
              {user ? (
                <div className="flex items-center gap-3 py-3 px-1 mb-4 border-b border-border">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || 'User'} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    {profile?.full_name && (
                      <p className="font-medium text-sm truncate">{profile.full_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="mb-4 pb-4 border-b border-border">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">Sign In</Button>
                  </Link>
                </div>
              )}

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search organizers, events..."
                  className="w-full pl-12 pr-4 py-3 bg-muted border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </form>

              {/* Quick Actions for logged-in users */}
              {user && (
                <div className="space-y-1 mb-6">
                  <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                  </Link>
                  {!isAdmin && (
                    <Link to="/profile" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {/* Product Links */}
              <div className="space-y-1 mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Our Products</p>
                {productLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block hover:bg-muted/50 transition-colors py-3 px-3 rounded-lg -mx-3"
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="font-medium text-foreground">{link.name}</span>
                  </Link>
                ))}
              </div>

              {/* Platform Links */}
              <div className="space-y-1 mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Platform</p>
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block hover:bg-muted/50 transition-colors py-3 px-3 rounded-lg -mx-3 font-medium text-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  to="/pricing"
                  className="block hover:bg-muted/50 transition-colors py-3 px-3 rounded-lg -mx-3 font-medium text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Pricing
                </Link>
              </div>

              {/* Company Links */}
              <div className="space-y-1 mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Company</p>
                {companyLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block hover:bg-muted/50 transition-colors py-3 px-3 rounded-lg -mx-3 font-medium text-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {/* Logout at bottom for logged-in users */}
              {user && (
                <div className="pt-4 border-t border-border">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive" 
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
