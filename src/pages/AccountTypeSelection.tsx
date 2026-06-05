import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, User, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const AccountTypeSelection = () => {
  const [selectedType, setSelectedType] = useState<"user" | "organization" | "influencer" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for pending scanner-only team invite via secure server-side RPC
  useEffect(() => {
    if (!user?.id) {
      setCheckingInvite(false);
      return;
    }

    const checkPendingScannerInvite = async () => {
      try {
        // Call secure SECURITY DEFINER RPC that:
        // 1. Reads the user's email from auth.users (not client-supplied)
        // 2. Finds pending scanner-only invites
        // 3. Validates permissions server-side
        // 4. Atomically sets account type + accepts invite
        const { data, error } = await supabase.rpc('check_and_accept_scanner_invite', {
          p_user_id: user.id,
        });

        if (error) {
          console.error('Scanner invite check failed:', error);
          setCheckingInvite(false);
          return;
        }

        const result = data as { success: boolean; reason?: string; organization_id?: string };

        if (!result?.success) {
          // No scanner invite found or not eligible — show normal account selection
          setCheckingInvite(false);
          return;
        }

        // Server-side setup succeeded — update caches and redirect
        queryClient.setQueryData(['profile', user.id], (prev: any) =>
          prev ? { ...prev, account_type_selected: true } : prev
        );
        queryClient.setQueryData(['user-role', user.id], 'user');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['user-role'] });
        queryClient.invalidateQueries({ queryKey: ['org-permissions'] });

        toast({
          title: "Welcome, Scanner Staff!",
          description: "You've been set up as a ticket scanner. Redirecting to your dashboard.",
        });

        navigate('/scanner', { replace: true });
      } catch (err) {
        console.error('Error checking scanner invite:', err);
        setCheckingInvite(false);
      }
    };

    checkPendingScannerInvite();
  }, [user?.id, navigate, queryClient, toast]);

  const handleContinue = async () => {
    if (!selectedType || !user) return;

    setIsLoading(true);
    try {
      // Use secure RPC function to set account type
      // This bypasses RLS safely and only works during initial setup
      const { error: rpcError } = await supabase.rpc('set_account_type', {
        p_user_id: user.id,
        p_role: selectedType
      });

      if (rpcError) throw rpcError;

      localStorage.removeItem('pendingReferral');

      // Update caches immediately to avoid redirect races
      queryClient.setQueryData(['profile', user.id], (prev: any) =>
        prev ? { ...prev, account_type_selected: true } : prev
      );
      queryClient.setQueryData(['user-role', user.id], selectedType);

      // Invalidate caches to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });

      toast({
        title: "Account setup complete!",
        description: selectedType === "organization" 
          ? "You can now create events and contests." 
          : selectedType === "influencer"
          ? "Claim your influencer codes to start earning!"
          : "Start exploring events and contests!",
      });

      const redirectPath = selectedType === "organization" ? "/org/dashboard" : selectedType === "influencer" ? "/influencer" : "/dashboard";
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set account type",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const accountTypes = [
    {
      id: "user" as const,
      title: "Regular User",
      description: "Attend events, vote in contests, and support your favorites",
      icon: User,
      features: ["Browse & attend events", "Vote for contestants", "Track your tickets & votes"],
    },
    {
      id: "organization" as const,
      title: "Organization / Company",
      description: "Host events, create contests, and manage your audience",
      icon: Building2,
      features: ["Create & manage events", "Host voting contests", "Sell tickets & track sales"],
    },
    {
      id: "influencer" as const,
      title: "Influencer / Promoter",
      description: "Promote events and contests, earn commissions on sales",
      icon: Users,
      features: ["Claim influencer codes", "Track clicks & conversions", "Earn commission on sales"],
    },
  ];

  if (checkingInvite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Account Type</h1>
          <p className="text-muted-foreground">
            Select how you'll be using the platform. You can always change this later.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {accountTypes.map((type) => (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                selectedType === type.id
                  ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "border-border"
              }`}
              onClick={() => setSelectedType(type.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${
                    selectedType === type.id ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <type.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{type.title}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {type.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={!selectedType || isLoading}
            onClick={handleContinue}
            className="gap-2"
          >
            {isLoading ? "Setting up..." : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeSelection;
