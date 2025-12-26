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
import PaymentCallback from "./pages/PaymentCallback";

// Organization Dashboard Pages
import OrgDashboard from "./pages/org/OrgDashboard";
import CreateContest from "./pages/org/CreateContest";
import CreateEvent from "./pages/org/CreateEvent";
import ManageContests from "./pages/org/ManageContests";
import ManageEvents from "./pages/org/ManageEvents";
import ContestManagement from "./pages/org/ContestManagement";
import EventManagement from "./pages/org/EventManagement";
import EventScanner from "./pages/org/EventScanner";
import EventScannerList from "./pages/org/EventScannerList";
import OrgWallet from "./pages/org/OrgWallet";
import Payouts from "./pages/org/Payouts";
import Marketing from "./pages/org/Marketing";
import Support from "./pages/org/Support";
import OrgSettings from "./pages/org/OrgSettings";
import OrgNotifications from "./pages/org/OrgNotifications";
import TeamMembers from "./pages/org/TeamMembers";
import EventCheckinDashboard from "./pages/org/EventCheckinDashboard";
import ContestAnalytics from "./pages/org/ContestAnalytics";

// Admin Dashboard Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminContests from "./pages/admin/AdminContests";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminPayouts from "./pages/admin/AdminPayouts";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminFraud from "./pages/admin/AdminFraud";
import AdminModeration from "./pages/admin/AdminModeration";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPaymentHistory from "./pages/admin/AdminPaymentHistory";
import AdminPaymentAnalytics from "./pages/admin/AdminPaymentAnalytics";
import AdminRefunds from "./pages/admin/AdminRefunds";
import AdminContestDetail from "./pages/admin/AdminContestDetail";
import AdminEventDetail from "./pages/admin/AdminEventDetail";
import AdminVoteReconciliation from "./pages/admin/AdminVoteReconciliation";

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
  
  if (profile && !profile.account_type_selected && location.pathname !== "/account-setup") {
    return <Navigate to="/account-setup" replace />;
  }

  const isOrganization = role === 'organization';
  const isAdmin = role === 'admin';
  
  if (isOrganization && location.pathname === '/dashboard') {
    return <Navigate to="/org/dashboard" replace />;
  }
  
  if (isAdmin && location.pathname === '/dashboard') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!isOrganization && !isAdmin && location.pathname.startsWith('/org/')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (!isAdmin && location.pathname.startsWith('/admin/')) {
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
    const isAdmin = role === 'admin';
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
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
    <Route path="/payment-callback" element={<PaymentCallback />} />
    <Route path="/account-setup" element={<ProtectedRoute><AccountTypeSelection /></ProtectedRoute>} />
    
    {/* Organization Dashboard Routes */}
    <Route path="/org/dashboard" element={<ProtectedRoute><OrgDashboard /></ProtectedRoute>} />
    <Route path="/org/contests/create" element={<ProtectedRoute><CreateContest /></ProtectedRoute>} />
    <Route path="/org/events/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
    <Route path="/org/contests" element={<ProtectedRoute><ManageContests /></ProtectedRoute>} />
    <Route path="/org/events" element={<ProtectedRoute><ManageEvents /></ProtectedRoute>} />
    <Route path="/org/contests/:id" element={<ProtectedRoute><ContestManagement /></ProtectedRoute>} />
    <Route path="/org/events/:id" element={<ProtectedRoute><EventManagement /></ProtectedRoute>} />
    <Route path="/org/events/:id/scanner" element={<ProtectedRoute><EventScanner /></ProtectedRoute>} />
    <Route path="/org/event-scanner" element={<ProtectedRoute><EventScannerList /></ProtectedRoute>} />
    <Route path="/org/wallet" element={<ProtectedRoute><OrgWallet /></ProtectedRoute>} />
    <Route path="/org/payouts" element={<ProtectedRoute><Payouts /></ProtectedRoute>} />
    <Route path="/org/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
    <Route path="/org/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
    <Route path="/org/settings" element={<ProtectedRoute><OrgSettings /></ProtectedRoute>} />
    <Route path="/org/notifications" element={<ProtectedRoute><OrgNotifications /></ProtectedRoute>} />
    <Route path="/org/team" element={<ProtectedRoute><TeamMembers /></ProtectedRoute>} />
    <Route path="/org/events/:id/checkin" element={<ProtectedRoute><EventCheckinDashboard /></ProtectedRoute>} />
    <Route path="/org/contests/:id/analytics" element={<ProtectedRoute><ContestAnalytics /></ProtectedRoute>} />
    
    {/* Admin Dashboard Routes */}
    <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
    <Route path="/admin/organizations" element={<ProtectedRoute><AdminOrganizations /></ProtectedRoute>} />
    <Route path="/admin/contests" element={<ProtectedRoute><AdminContests /></ProtectedRoute>} />
    <Route path="/admin/contests/:id" element={<ProtectedRoute><AdminContestDetail /></ProtectedRoute>} />
    <Route path="/admin/events" element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />
    <Route path="/admin/events/:id" element={<ProtectedRoute><AdminEventDetail /></ProtectedRoute>} />
    <Route path="/admin/payouts" element={<ProtectedRoute><AdminPayouts /></ProtectedRoute>} />
    <Route path="/admin/finance" element={<ProtectedRoute><AdminFinance /></ProtectedRoute>} />
    <Route path="/admin/payments" element={<ProtectedRoute><AdminPaymentHistory /></ProtectedRoute>} />
    <Route path="/admin/analytics" element={<ProtectedRoute><AdminPaymentAnalytics /></ProtectedRoute>} />
    <Route path="/admin/refunds" element={<ProtectedRoute><AdminRefunds /></ProtectedRoute>} />
    <Route path="/admin/fraud" element={<ProtectedRoute><AdminFraud /></ProtectedRoute>} />
        <Route path="/admin/moderation" element={<ProtectedRoute><AdminModeration /></ProtectedRoute>} />
        <Route path="/admin/vote-reconciliation" element={<ProtectedRoute><AdminVoteReconciliation /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
        
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
