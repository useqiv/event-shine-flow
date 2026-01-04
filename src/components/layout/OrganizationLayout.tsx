import React, { useMemo } from 'react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useProfile } from '@/hooks/useProfile';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useOrgPermissions } from '@/hooks/useOrgPermissions';
import { 
  Vote, 
  LayoutDashboard, 
  Trophy, 
  Calendar, 
  Wallet, 
  Bell, 
  User, 
  LogOut,
  Menu,
  X,
  Settings,
  PlusCircle,
  BarChart3,
  Megaphone,
  HelpCircle,
  CreditCard,
  Users,
  QrCode,
  HandHeart,
  ClipboardList,
  ChevronDown,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import appLogo from "@/assets/logo.png";

const OrganizationLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profile } = useProfile();
  const { data: unreadCount } = useUnreadCount();
  const { data: permissions } = useOrgPermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isManageOpen, setIsManageOpen] = React.useState(false);

  // Check if user is owner (has all permissions)
  const isOwner = permissions?.isOwner ?? true;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Filter navigation items based on permissions
  const createSubItems = useMemo(() => {
    const items = [
      { path: '/org/contests/create', label: 'Create Contest', icon: Trophy, permission: 'can_edit_contests' as const },
      { path: '/org/events/create', label: 'Create Event', icon: Calendar, permission: 'can_edit_events' as const },
      { path: '/campaigns/create', label: 'Create Campaign', icon: HandHeart, permission: 'can_edit_campaigns' as const },
      { path: '/forms/create', label: 'Create Form', icon: ClipboardList, permission: 'can_edit_campaigns' as const },
    ];
    
    if (isOwner) return items;
    return items.filter(item => permissions?.[item.permission]);
  }, [isOwner, permissions]);

  const manageSubItems = useMemo(() => {
    const items = [
      { path: '/org/contests', label: 'Manage Contests', icon: Trophy, viewPermission: 'can_view_contests' as const },
      { path: '/org/events', label: 'Manage Events', icon: Calendar, viewPermission: 'can_view_events' as const },
      { path: '/org/campaigns', label: 'Manage Campaigns', icon: HandHeart, viewPermission: 'can_view_campaigns' as const },
      { path: '/forms', label: 'Manage Forms', icon: ClipboardList, viewPermission: 'can_view_campaigns' as const },
    ];
    
    if (isOwner) return items;
    return items.filter(item => permissions?.[item.viewPermission]);
  }, [isOwner, permissions]);

  const mainNavItems = useMemo(() => {
    const items = [
      { path: '/org/dashboard', label: 'Overview', icon: LayoutDashboard, alwaysShow: true },
      { path: '/org/event-scanner', label: 'QR Scanner', icon: QrCode, permission: 'can_scan_tickets' as const },
      { path: '/org/wallet', label: 'Wallet & Finance', icon: Wallet, permission: 'can_view_analytics' as const },
      { path: '/org/payouts', label: 'Payouts', icon: CreditCard, permission: 'can_manage_payouts' as const },
      { path: '/org/team', label: 'Team Members', icon: Users, ownerOnly: true },
      { path: '/org/support', label: 'Support', icon: HelpCircle, alwaysShow: true },
    ];
    
    if (isOwner) return items;
    return items.filter(item => item.alwaysShow || (item.permission && permissions?.[item.permission]));
  }, [isOwner, permissions]);

  const bottomNavItems = [
    { path: '/org/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isCreateActive = createSubItems.some(item => isActive(item.path));
  const isManageActive = manageSubItems.some(item => isActive(item.path));

  // Auto-open Create/Manage menu if a sub-item is active
  React.useEffect(() => {
    if (isCreateActive) {
      setIsCreateOpen(true);
    }
    if (isManageActive) {
      setIsManageOpen(true);
    }
  }, [isCreateActive, isManageActive]);

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/org/dashboard" className="flex flex-col items-center gap-2">
            <img src={appLogo} alt="USEQIV" className="h-10" />
            <p className="text-xs text-muted-foreground">Organization</p>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-4 px-3">Dashboard</p>
          <div className="space-y-1">
            {/* Overview link */}
            <Link to="/org/dashboard">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-11 px-3 font-medium",
                  isActive('/org/dashboard') 
                    ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <LayoutDashboard className="h-5 w-5" />
                Overview
              </Button>
            </Link>

            {/* Create Collapsible - only show if user has create permissions */}
            {createSubItems.length > 0 && (
            <Collapsible open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11 px-3 font-medium",
                    isCreateActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <PlusCircle className="h-5 w-5" />
                  Create
                  <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isCreateOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 mt-1">
                {createSubItems.map((item) => (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-10 px-3 font-medium text-sm",
                        isActive(item.path) 
                          ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
            )}

            {/* Manage Collapsible - only show if user has view permissions */}
            {manageSubItems.length > 0 && (
            <Collapsible open={isManageOpen} onOpenChange={setIsManageOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11 px-3 font-medium",
                    isManageActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <FolderOpen className="h-5 w-5" />
                  Manage
                  <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isManageOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 mt-1">
                {manageSubItems.map((item) => (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-10 px-3 font-medium text-sm",
                        isActive(item.path) 
                          ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
            )}
            {/* Remaining nav items */}
            {mainNavItems.slice(1).map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11 px-3 font-medium",
                    isActive(item.path) 
                      ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none" 
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
                      ? "bg-primary/10 text-primary" 
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
              <Link to="/org/dashboard" className="flex items-center gap-2 md:hidden">
                <img src={appLogo} alt="USEQIV" className="h-8" />
              </Link>

              {/* Page Title - Desktop */}
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold text-foreground">
                  {mainNavItems.find(item => isActive(item.path))?.label || 
                   bottomNavItems.find(item => isActive(item.path))?.label || 
                   'Organization Dashboard'}
                </h1>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <Link to="/org/notifications">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount && unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.full_name?.charAt(0) || 'O'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{profile?.full_name || 'Organization'}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/org/settings" className="cursor-pointer">
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
                <Link to="/org/dashboard" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                  <img src={appLogo} alt="USEQIV" className="h-10" />
                  <p className="text-xs text-muted-foreground">Organization</p>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground mb-4 px-3">Dashboard</p>
                <div className="space-y-1">
                  {/* Overview link */}
                  <Link to="/org/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-11 px-3 font-medium",
                        isActive('/org/dashboard') 
                          ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Overview
                    </Button>
                  </Link>

                  {/* Create Collapsible - only show if user has create permissions */}
                  {createSubItems.length > 0 && (
                  <Collapsible open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-11 px-3 font-medium",
                          isCreateActive 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <PlusCircle className="h-5 w-5" />
                        Create
                        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isCreateOpen && "rotate-180")} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 space-y-1 mt-1">
                      {createSubItems.map((item) => (
                        <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-3 h-10 px-3 font-medium text-sm",
                              isActive(item.path) 
                                ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Button>
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                  )}

                  {/* Manage Collapsible - only show if user has view permissions */}
                  {manageSubItems.length > 0 && (
                  <Collapsible open={isManageOpen} onOpenChange={setIsManageOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-11 px-3 font-medium",
                          isManageActive 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <FolderOpen className="h-5 w-5" />
                        Manage
                        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isManageOpen && "rotate-180")} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 space-y-1 mt-1">
                      {manageSubItems.map((item) => (
                        <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-3 h-10 px-3 font-medium text-sm",
                              isActive(item.path) 
                                ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Button>
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                  )}

                  {/* Remaining nav items */}
                  {mainNavItems.slice(1).map((item) => (
                    <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-11 px-3 font-medium",
                          isActive(item.path) 
                            ? "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none" 
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
                            ? "bg-primary/10 text-primary" 
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

export default OrganizationLayout;
