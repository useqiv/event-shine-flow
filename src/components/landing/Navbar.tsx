import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Vote, Search, User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Campaigns", href: "/campaigns" },
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
  ];

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-card/95 backdrop-blur-md shadow-md' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex items-center gap-0.5 h-10 w-10 bg-primary rounded-xl justify-center group-hover:scale-105 transition-transform">
              <Vote className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground hidden sm:block">VotePass</span>
          </a>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search organizers, events, venues..."
                className="w-full pl-12 pr-12 py-3 bg-card border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg transition-colors">
                <Search className="h-5 w-5 text-primary" />
              </button>
            </div>
          </form>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/dashboard">
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
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
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
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border bg-card/95 backdrop-blur-md animate-fade-in">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search organizers, events..."
                className="w-full pl-12 pr-12 py-3 bg-background border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5">
                <Search className="h-5 w-5 text-primary" />
              </button>
            </form>
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors py-3 px-4 rounded-lg font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || 'User'} />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        {profile?.full_name && (
                          <p className="font-medium text-sm">{profile.full_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                    </Link>
                    <Link to="/profile" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-destructive" 
                      onClick={() => { handleLogout(); setIsOpen(false); }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-center">Sign In</Button>
                    </Link>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="default" className="w-full justify-center">Get Started Free</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
