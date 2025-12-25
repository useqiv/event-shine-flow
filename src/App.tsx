import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { InfluencerTracker } from "@/components/InfluencerTracker";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Contests from "./pages/Contests";
import ContestDetail from "./pages/ContestDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import WalletPage from "./pages/Wallet";
import MyTickets from "./pages/MyTickets";
import MyVotes from "./pages/MyVotes";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import AccountTypeSelection from "./pages/AccountTypeSelection";
import PublicContest from "./pages/PublicContest";
import SavedItems from "./pages/SavedItems";
import ReferralLeaderboard from "./pages/ReferralLeaderboard";

// Organization Dashboard Pages
import OrgDashboard from "./pages/org/OrgDashboard";
import CreateContest from "./pages/org/CreateContest";
import CreateEvent from "./pages/org/CreateEvent";
import ManageContests from "./pages/org/ManageContests";
import ManageEvents from "./pages/org/ManageEvents";
import ContestManagement from "./pages/org/ContestManagement";
import EventManagement from "./pages/org/EventManagement";
import EventScanner from "./pages/org/EventScanner";
import OrgWallet from "./pages/org/OrgWallet";
import Payouts from "./pages/org/Payouts";
import Marketing from "./pages/org/Marketing";
import Support from "./pages/org/Support";
import OrgSettings from "./pages/org/OrgSettings";
import OrgNotifications from "./pages/org/OrgNotifications";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const location = useLocation();
  
  if (loading || profileLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect to account setup if not completed (except if already on that page)
  if (profile && !profile.account_type_selected && location.pathname !== "/account-setup") {
    return <Navigate to="/account-setup" replace />;
  }

  // Redirect organization users to org dashboard if they try to access regular dashboard
  const isOrganization = role === 'organization';
  if (isOrganization && location.pathname === '/dashboard') {
    return <Navigate to="/org/dashboard" replace />;
  }

  // Redirect regular users away from org routes
  if (!isOrganization && location.pathname.startsWith('/org/')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  
  if (loading || (user && roleLoading)) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (user) {
    const isOrganization = role === 'organization';
    return <Navigate to={isOrganization ? "/org/dashboard" : "/dashboard"} replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/c/:slug" element={<PublicContest />} />
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/contests" element={<ProtectedRoute><Contests /></ProtectedRoute>} />
    <Route path="/contests/:id" element={<ProtectedRoute><ContestDetail /></ProtectedRoute>} />
    <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
    <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
    <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
    <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
    <Route path="/my-votes" element={<ProtectedRoute><MyVotes /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/saved" element={<ProtectedRoute><SavedItems /></ProtectedRoute>} />
    <Route path="/leaderboard" element={<ProtectedRoute><ReferralLeaderboard /></ProtectedRoute>} />
    <Route path="/account-setup" element={<ProtectedRoute><AccountTypeSelection /></ProtectedRoute>} />
    
    {/* Organization Dashboard Routes */}
    <Route path="/org/dashboard" element={<ProtectedRoute><OrgDashboard /></ProtectedRoute>} />
    <Route path="/org/contests/create" element={<ProtectedRoute><CreateContest /></ProtectedRoute>} />
    <Route path="/org/events/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
    <Route path="/org/contests" element={<ProtectedRoute><ManageContests /></ProtectedRoute>} />
    <Route path="/org/events" element={<ProtectedRoute><ManageEvents /></ProtectedRoute>} />
    <Route path="/org/contests/:id" element={<ProtectedRoute><ContestManagement /></ProtectedRoute>} />
    <Route path="/org/events/:id" element={<ProtectedRoute><EventManagement /></ProtectedRoute>} />
    <Route path="/org/events/:id/scan" element={<ProtectedRoute><EventScanner /></ProtectedRoute>} />
    <Route path="/org/wallet" element={<ProtectedRoute><OrgWallet /></ProtectedRoute>} />
    <Route path="/org/payouts" element={<ProtectedRoute><Payouts /></ProtectedRoute>} />
    <Route path="/org/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
    <Route path="/org/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
    <Route path="/org/settings" element={<ProtectedRoute><OrgSettings /></ProtectedRoute>} />
    <Route path="/org/notifications" element={<ProtectedRoute><OrgNotifications /></ProtectedRoute>} />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <InfluencerTracker>
              <AppRoutes />
            </InfluencerTracker>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
