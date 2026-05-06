import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { isAdminVerificationComplete } from "@/components/admin/AdminMfaGate";
import { InfluencerTracker } from "@/components/InfluencerTracker";
import { AIChatWidget } from "@/components/AIChatWidget";
import { ConfirmDialogProvider } from "@/hooks/useConfirmDialog";
import { useIsScannerOnly } from "@/hooks/useIsScannerOnly";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Contests from "./pages/Contests";
import ContestDetail from "./pages/ContestDetail";
import ContestantDetail from "./pages/ContestantDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import WalletPage from "./pages/Wallet";
import MyTickets from "./pages/MyTickets";
import MyVotes from "./pages/MyVotes";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import AccountTypeSelection from "./pages/AccountTypeSelection";
import PublicContest from "./pages/PublicContest";
import { ShareContestRedirect, ShareContestantRedirect } from "./pages/ShareRedirect";
import SavedItems from "./pages/SavedItems";
import ReferralLeaderboard from "./pages/ReferralLeaderboard";
import PaymentCallback from "./pages/PaymentCallback";
import AcceptTransfer from "./pages/AcceptTransfer";
import EmbedLeaderboard from "./pages/EmbedLeaderboard";
import EmbedCampaign from "./pages/EmbedCampaign";
import EmbedContest from "./pages/EmbedContest";
import EmbedEvent from "./pages/EmbedEvent";
import FavoriteContestants from "./pages/FavoriteContestants";
import ResetPassword from "./pages/ResetPassword";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import MyCampaigns from "./pages/MyCampaigns";
import DonationHistory from "./pages/DonationHistory";
import CampaignDashboard from "./pages/CampaignDashboard";
import Install from "./pages/Install";
import Search from "./pages/Search";
import Forms from "./pages/Forms";
import FormBuilder from "./pages/FormBuilder";
import FormResponses from "./pages/FormResponses";
import PublicForm from "./pages/PublicForm";
import EmbedForm from "./pages/EmbedForm";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import ForOrganizers from "./pages/ForOrganizers";
import ForParticipants from "./pages/ForParticipants";
import ForInfluencers from "./pages/ForInfluencers";
import HelpCenter from "./pages/HelpCenter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import PitchDeck from "./pages/PitchDeck";

// Product Pages
import EventTicketing from "./pages/products/EventTicketing";
import ContestVoting from "./pages/products/ContestVoting";
import Crowdfunding from "./pages/products/Crowdfunding";
import SmartForms from "./pages/products/SmartForms";

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
import Support from "./pages/org/Support";
import OrgSettings from "./pages/org/OrgSettings";
import OrgNotifications from "./pages/org/OrgNotifications";
import TeamMembers from "./pages/org/TeamMembers";
import EventCheckinDashboard from "./pages/org/EventCheckinDashboard";
import ContestAnalytics from "./pages/org/ContestAnalytics";
import ContestMarketing from "./pages/org/ContestMarketing";
import EventMarketing from "./pages/org/EventMarketing";
import ManageCampaigns from "./pages/org/ManageCampaigns";
import CampaignAnalytics from "./pages/org/CampaignAnalytics";

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
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import AdminSystemHealth from "./pages/admin/AdminSystemHealth";
import AdminOrgReports from "./pages/admin/AdminOrgReports";

// Influencer Dashboard Pages
import InfluencerDashboard from "./pages/influencer/InfluencerDashboard";
import InfluencerLinks from "./pages/influencer/InfluencerLinks";
import InfluencerEarnings from "./pages/influencer/InfluencerEarnings";
import InfluencerPayouts from "./pages/influencer/InfluencerPayouts";
import InfluencerSettings from "./pages/influencer/InfluencerSettings";

// Scanner Dashboard Pages
import ScannerDashboard from "./pages/scanner/ScannerDashboard";
import ScannerEventPage from "./pages/scanner/ScannerEventPage";

import { useState } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: isScannerOnly, isLoading: scannerCheckLoading } = useIsScannerOnly();
  const location = useLocation();
  
  if (loading || profileLoading || roleLoading || scannerCheckLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (profile && !profile.account_type_selected && location.pathname !== "/account-setup") {
    return <Navigate to="/account-setup" replace />;
  }

  // Scanner-only staff: restrict to /scanner routes only
  if (isScannerOnly && !location.pathname.startsWith('/scanner')) {
    return <Navigate to="/scanner" replace />;
  }

  const isOrganization = role === 'organization';
  const isAdmin = role === 'admin';
  const isInfluencer = (role as string) === 'influencer';
  const isAdminRoute = location.pathname.startsWith('/admin/');

  // Admin must complete PIN verification before accessing ANY route.
  // Until verified, force them to /admin/dashboard where the PIN gate is rendered.
  if (isAdmin && !isAdminVerificationComplete() && location.pathname !== '/admin/dashboard') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Once verified, admin is locked to /admin/* routes
  if (isAdmin && isAdminVerificationComplete() && !isAdminRoute) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  if (isOrganization && location.pathname === '/dashboard') {
    return <Navigate to="/org/dashboard" replace />;
  }
  
  if (isAdmin && location.pathname === '/dashboard') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (isInfluencer && location.pathname === '/dashboard') {
    return <Navigate to="/influencer" replace />;
  }

  if (!isOrganization && !isAdmin && location.pathname.startsWith('/org/')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (!isAdmin && location.pathname.startsWith('/admin/')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isInfluencer && location.pathname.startsWith('/influencer')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: isScannerOnly, isLoading: scannerCheckLoading } = useIsScannerOnly();
  
  if (loading || (user && (roleLoading || scannerCheckLoading))) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (user) {
    // Scanner-only staff always go to /scanner
    if (isScannerOnly) return <Navigate to="/scanner" replace />;
    
    const isOrganization = role === 'organization';
    const isAdmin = role === 'admin';
    const isInfluencer = (role as string) === 'influencer';
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
    if (isInfluencer) return <Navigate to="/influencer" replace />;
    return <Navigate to={isOrganization ? "/org/dashboard" : "/dashboard"} replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/about" element={<About />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/features" element={<Features />} />
    <Route path="/pricing" element={<Pricing />} />
    <Route path="/for-organizers" element={<ForOrganizers />} />
    <Route path="/for-participants" element={<ForParticipants />} />
    <Route path="/for-influencers" element={<ForInfluencers />} />
    <Route path="/help" element={<HelpCenter />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms" element={<TermsOfService />} />
    <Route path="/pitch-deck" element={<PitchDeck />} />
    
    {/* Product Feature Pages */}
    <Route path="/products/events" element={<EventTicketing />} />
    <Route path="/products/contests" element={<ContestVoting />} />
    <Route path="/products/crowdfunding" element={<Crowdfunding />} />
    <Route path="/products/forms" element={<SmartForms />} />
    
    <Route path="/c/:slug" element={<PublicContest />} />
    <Route path="/c/:slug/contestant/:contestantSlug" element={<ContestantDetail />} />
    <Route path="/share/contest/:contestKey" element={<ShareContestRedirect />} />
    <Route path="/share/contestant/:contestKey/:contestantSlug" element={<ShareContestantRedirect />} />
    <Route path="/e/:slug" element={<EventDetail />} />
    
    <Route path="/embed/leaderboard/:contestId" element={<EmbedLeaderboard />} />
    <Route path="/embed/contest/:contestId" element={<EmbedContest />} />
    <Route path="/embed/campaign/:campaignId" element={<EmbedCampaign />} />
    <Route path="/embed/event/:eventId" element={<EmbedEvent />} />
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/contests" element={<Contests />} />
    <Route path="/contests/:id" element={<ContestDetail />} />
    <Route path="/contests/:contestId/contestant/:contestantSlug" element={<ContestantDetail />} />
    <Route path="/events" element={<Events />} />
    <Route path="/events/:id" element={<EventDetail />} />
    <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
    <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
    <Route path="/my-votes" element={<ProtectedRoute><MyVotes /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/saved" element={<ProtectedRoute><SavedItems /></ProtectedRoute>} />
    <Route path="/favorites" element={<ProtectedRoute><FavoriteContestants /></ProtectedRoute>} />
    <Route path="/leaderboard" element={<ProtectedRoute><ReferralLeaderboard /></ProtectedRoute>} />
    <Route path="/payment-callback" element={<PaymentCallback />} />
    <Route path="/accept-transfer" element={<AcceptTransfer />} />
    <Route path="/account-setup" element={<ProtectedRoute><AccountTypeSelection /></ProtectedRoute>} />
    <Route path="/campaigns" element={<Campaigns />} />
    <Route path="/campaigns/:id" element={<CampaignDetail />} />
    <Route path="/campaigns/create" element={<ProtectedRoute><CreateCampaign /></ProtectedRoute>} />
    <Route path="/campaigns/my" element={<ProtectedRoute><MyCampaigns /></ProtectedRoute>} />
    <Route path="/campaigns/:id/dashboard" element={<ProtectedRoute><CampaignDashboard /></ProtectedRoute>} />
    <Route path="/donations/history" element={<ProtectedRoute><DonationHistory /></ProtectedRoute>} />
    <Route path="/install" element={<Install />} />
    <Route path="/search" element={<Search />} />
    <Route path="/forms" element={<ProtectedRoute><Forms /></ProtectedRoute>} />
    <Route path="/forms/:formId/edit" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
    <Route path="/forms/:formId/responses" element={<ProtectedRoute><FormResponses /></ProtectedRoute>} />
    <Route path="/f/:formIdOrSlug" element={<PublicForm />} />
    <Route path="/embed/form/:formIdOrSlug" element={<EmbedForm />} />
    
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
    <Route path="/org/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
    <Route path="/org/settings" element={<ProtectedRoute><OrgSettings /></ProtectedRoute>} />
    <Route path="/org/notifications" element={<ProtectedRoute><OrgNotifications /></ProtectedRoute>} />
    <Route path="/org/team" element={<ProtectedRoute><TeamMembers /></ProtectedRoute>} />
    <Route path="/org/events/:id/checkin" element={<ProtectedRoute><EventCheckinDashboard /></ProtectedRoute>} />
    <Route path="/org/events/:id/marketing" element={<ProtectedRoute><EventMarketing /></ProtectedRoute>} />
    <Route path="/org/contests/:id/analytics" element={<ProtectedRoute><ContestAnalytics /></ProtectedRoute>} />
    <Route path="/org/contests/:id/marketing" element={<ProtectedRoute><ContestMarketing /></ProtectedRoute>} />
    <Route path="/org/campaigns" element={<ProtectedRoute><ManageCampaigns /></ProtectedRoute>} />
    <Route path="/org/campaigns/:id/analytics" element={<ProtectedRoute><CampaignAnalytics /></ProtectedRoute>} />
    
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
        <Route path="/admin/activity-log" element={<ProtectedRoute><AdminActivityLog /></ProtectedRoute>} />
        <Route path="/admin/system-health" element={<ProtectedRoute><AdminSystemHealth /></ProtectedRoute>} />
        <Route path="/admin/org-reports" element={<ProtectedRoute><AdminOrgReports /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
        
        {/* Influencer Dashboard Routes */}
        <Route path="/influencer" element={<ProtectedRoute><InfluencerDashboard /></ProtectedRoute>} />
        <Route path="/influencer/links" element={<ProtectedRoute><InfluencerLinks /></ProtectedRoute>} />
        <Route path="/influencer/earnings" element={<ProtectedRoute><InfluencerEarnings /></ProtectedRoute>} />
        <Route path="/influencer/payouts" element={<ProtectedRoute><InfluencerPayouts /></ProtectedRoute>} />
        <Route path="/influencer/settings" element={<ProtectedRoute><InfluencerSettings /></ProtectedRoute>} />
        
        {/* Scanner-Only Dashboard Routes */}
        <Route path="/scanner" element={<ProtectedRoute><ScannerDashboard /></ProtectedRoute>} />
        <Route path="/scanner/:id" element={<ProtectedRoute><ScannerEventPage /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <ConfirmDialogProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <InfluencerTracker>
                    <AppRoutes />
                    <AIChatWidget />
                  </InfluencerTracker>
                </BrowserRouter>
              </ConfirmDialogProvider>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
