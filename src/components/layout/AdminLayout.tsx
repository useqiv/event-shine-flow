import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  Building2, 
  Trophy, 
  Calendar, 
  Wallet, 
  AlertTriangle,
  FileCheck,
  Settings,
  LogOut,
  Menu,
  X,
  CreditCard,
  BarChart3,
  Bell,
  PieChart,
  RotateCcw,
  GitCompare,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminRealtime } from '@/hooks/useAdminRealtime';
import AdminMfaGate from '@/components/admin/AdminMfaGate';
import appLogo from "@/assets/logo.png";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profile } = useProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Enable real-time notifications for admins
  useAdminRealtime();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const mainNavItems = [
    { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/users', label: 'User Management', icon: Users },
    { path: '/admin/organizations', label: 'Organizations', icon: Building2 },
    { path: '/admin/org-reports', label: 'Org Revenue Reports', icon: BarChart3 },
    { path: '/admin/contests', label: 'Contests', icon: Trophy },
    { path: '/admin/events', label: 'Events', icon: Calendar },
    { path: '/admin/payouts', label: 'Payouts', icon: CreditCard },
    { path: '/admin/payments', label: 'Payment History', icon: Wallet },
    { path: '/admin/analytics', label: 'Payment Analytics', icon: PieChart },
    { path: '/admin/refunds', label: 'Refund Management', icon: RotateCcw },
    { path: '/admin/finance', label: 'Finance & Revenue', icon: BarChart3 },
    { path: '/admin/fraud', label: 'Fraud Detection', icon: AlertTriangle },
    { path: '/admin/moderation', label: 'Content Moderation', icon: FileCheck },
    { path: '/admin/vote-reconciliation', label: 'Vote Reconciliation', icon: GitCompare },
    { path: '/admin/activity-log', label: 'Activity Log', icon: History },
    { path: '/admin/system-health', label: 'System Health', icon: Bell },
  ];

  const bottomNavItems = [
    { path: '/admin/settings', label: 'Platform Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/admin/dashboard" className="flex flex-col items-center gap-2">
            <img src={appLogo} alt="USEQIV" className="h-10" />
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-4 px-3">Management</p>
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11 px-3 font-medium",
                    isActive(item.path) 
                      ? "bg-destructive/10 text-destructive border-l-4 border-destructive rounded-l-none" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-border">
          <div className="space-y-1">
            {bottomNavItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11 px-3 font-medium",
                    isActive(item.path) 
                      ? "bg-destructive/10 text-destructive" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 h-11 px-3 font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-xl">
          <div className="px-4 md:px-6">
            <div className="flex h-16 items-center justify-between">
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {/* Mobile Logo */}
              <Link to="/admin/dashboard" className="flex items-center gap-2 md:hidden">
                <img src={appLogo} alt="USEQIV" className="h-8" />
                <span className="font-bold text-lg text-foreground">Admin</span>
              </Link>

              {/* Page Title - Desktop */}
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold text-foreground">
                  {mainNavItems.find(item => isActive(item.path))?.label || 
                   bottomNavItems.find(item => isActive(item.path))?.label || 
                   'Admin Dashboard'}
                </h1>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2">
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-destructive text-destructive-foreground">
                          {profile?.full_name?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{profile?.full_name || 'Admin'}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      <Badge variant="destructive" className="mt-1 text-xs">Admin</Badge>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
            <aside 
              className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-lg flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Logo */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <Link to="/admin/dashboard" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                  <img src={appLogo} alt="USEQIV" className="h-10" />
                  <p className="text-xs text-muted-foreground">Admin Panel</p>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground mb-4 px-3">Management</p>
                <div className="space-y-1">
                  {mainNavItems.map((item) => (
                    <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-11 px-3 font-medium",
                          isActive(item.path) 
                            ? "bg-destructive/10 text-destructive border-l-4 border-destructive rounded-l-none" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Mobile Bottom Section */}
              <div className="p-4 border-t border-border bg-card shrink-0">
                <div className="space-y-1">
                  {bottomNavItems.map((item) => (
                    <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-11 px-3 font-medium",
                          isActive(item.path) 
                            ? "bg-destructive/10 text-destructive" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full justify-start gap-3 h-11 px-3 font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;