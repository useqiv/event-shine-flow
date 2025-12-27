import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DonationWithCampaign {
  id: string;
  amount: number;
  currency: string;
  created_at: string;
  donor_message: string | null;
  is_anonymous: boolean;
  payment_method: string;
  status: string;
  campaign: {
    id: string;
    title: string;
    image_url: string | null;
    current_amount: number;
    goal_amount: number;
    status: string;
  };
}

export const useDonationHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["donation-history", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("donations")
        .select(`
          id,
          amount,
          currency,
          created_at,
          donor_message,
          is_anonymous,
          payment_method,
          status,
          campaign:campaigns (
            id,
            title,
            image_url,
            current_amount,
            goal_amount,
            status
          )
        `)
        .eq("donor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DonationWithCampaign[];
    },
    enabled: !!user,
  });
};

export const useDonationStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["donation-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("donations")
        .select("amount, currency, campaign_id")
        .eq("donor_id", user.id)
        .eq("status", "completed");

      if (error) throw error;

      const totalDonated = data.reduce((sum, d) => sum + d.amount, 0);
      const uniqueCampaigns = new Set(data.map((d) => d.campaign_id)).size;

      return {
        totalDonated,
        totalDonations: data.length,
        uniqueCampaigns,
      };
    },
    enabled: !!user,
  });
};
