import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, User, ArrowRight, Gift, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useApplyReferral } from "@/hooks/useReferral";

const AccountTypeSelection = () => {
  const [selectedType, setSelectedType] = useState<"user" | "organization" | "influencer" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingReferral, setPendingReferral] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const applyReferral = useApplyReferral();

  // Check for pending referral code
  useEffect(() => {
    const storedReferral = localStorage.getItem('pendingReferral');
    if (storedReferral) {
      setPendingReferral(storedReferral);
    }
  }, []);

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

      // Apply referral bonus if there's a pending referral (only for regular users)
      if (pendingReferral && selectedType === "user") {
        try {
          await applyReferral.mutateAsync({ userId: user.id, referralCode: pendingReferral });
          toast({
            title: "Referral bonus applied!",
            description: "₦500 has been added to your wallet!",
          });
        } catch (refError: any) {
          console.error('Referral error:', refError);
          // Don't fail the whole process for referral errors
        }
        // Clear the pending referral
        localStorage.removeItem('pendingReferral');
      }

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Account Type</h1>
          <p className="text-muted-foreground">
            Select how you'll be using the platform. You can always change this later.
          </p>
          {pendingReferral && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 text-sm">
              <Gift className="h-4 w-4" />
              Referral code applied! You'll get ₦500 bonus.
            </div>
          )}
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
