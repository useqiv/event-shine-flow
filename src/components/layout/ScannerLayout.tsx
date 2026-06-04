import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QrCode, LogOut, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import appLogo from '@/assets/logo.png';

const ScannerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card">
        <div className="px-3 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <Link to="/scanner" className="flex items-center gap-2">
              <img src={appLogo} alt="Logo" className="h-7" />
              <div className="flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground hidden sm:inline">Ticket Scanner</span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{profile?.full_name || 'Scanner'}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  </div>
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

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
};

export default ScannerLayout;
