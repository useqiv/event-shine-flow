import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getBaseAmountsByTransactionId } from '@/lib/baseAmount';

// Types
export interface OrganizationSettings {
  id: string;
  organization_id: string;
  company_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  usdt_address: string | null;
  preferred_payout_method: string | null;
  default_currency: string;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  organization_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  usdt_address: string | null;
  reference_id: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: string;
  organization_id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  applicable_to: string;
  contest_id: string | null;
  event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QRScanLog {
  id: string;
  ticket_id: string;
  event_id: string;
  scanned_by: string | null;
  scan_result: string;
  scanned_at: string;
}

// Organization Settings
export const useOrganizationSettings = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['organization-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as OrganizationSettings | null;
    },
    enabled: !!user,
  });
};

export const useUpdateOrganizationSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (settings: Partial<OrganizationSettings>) => {
      const { data: existing } = await supabase
        .from('organization_settings')
        .select('id')
        .eq('organization_id', user!.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('organization_settings')
          .update(settings)
          .eq('organization_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organization_settings')
          .insert({ ...settings, organization_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update settings');
      console.error(error);
    },
  });
};

// Organization Contests
export const useOrganizationContests = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['organization-contests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('organization_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Organization Events
export const useOrganizationEvents = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['organization-events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Organization Payouts
export const usePayouts = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['payouts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('organization_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Payout[];
    },
    enabled: !!user,
  });
};

export const useRequestPayout = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (payoutData: { amount: number; payment_method: string; currency: string }) => {
      const { data: settings } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', user!.id)
        .single();

      const { error } = await supabase
        .from('payouts')
        .insert({
          organization_id: user!.id,
          amount: payoutData.amount,
          payment_method: payoutData.payment_method,
          currency: payoutData.currency,
          bank_name: settings?.bank_name,
          account_number: settings?.account_number,
          account_name: settings?.account_name,
          usdt_address: settings?.usdt_address,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      toast.success('Payout request submitted');
    },
    onError: (error) => {
      toast.error('Failed to request payout');
      console.error(error);
    },
  });
};

// Promo Codes
export const usePromoCodes = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['promo-codes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('organization_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PromoCode[];
    },
    enabled: !!user,
  });
};

export const useCreatePromoCode = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (promoData: Omit<Partial<PromoCode>, 'organization_id'>) => {
      const { error } = await supabase
        .from('promo_codes')
        .insert([{ ...promoData, organization_id: user!.id }] as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success('Promo code created');
    },
    onError: (error) => {
      toast.error('Failed to create promo code');
      console.error(error);
    },
  });
};

export const useDeletePromoCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (promoId: string) => {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', promoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success('Promo code deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete promo code');
      console.error(error);
    },
  });
};

// Support Tickets
export const useSupportTickets = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['support-tickets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user,
  });
};

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (ticketData: { subject: string; description: string; category: string; priority: string }) => {
      const { error } = await supabase
        .from('support_tickets')
        .insert({ ...ticketData, user_id: user!.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Support ticket created');
    },
    onError: (error) => {
      toast.error('Failed to create support ticket');
      console.error(error);
    },
  });
};

// QR Scan Logs
export const useQRScanLogs = (eventId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['qr-scan-logs', eventId],
    queryFn: async () => {
      let query = supabase
        .from('qr_scan_logs')
        .select('*, tickets(*, ticket_types(name))')
        .order('scanned_at', { ascending: false });
      
      if (eventId) {
        query = query.eq('event_id', eventId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Organization Revenue Stats
export const useOrganizationStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['organization-stats', user?.id],
    queryFn: async () => {
      // Get all events with their ticket types for currency info
      const { data: events } = await supabase
        .from('events')
        .select('id, is_active, event_date')
        .eq('organization_id', user!.id);
      
      const eventIds = events?.map(e => e.id) || [];
      const activeEvents = events?.filter(e => e.is_active && new Date(e.event_date) > new Date()).length || 0;
      
      // Revenue by currency for tickets
      const ticketRevenueByCurrency: Record<string, number> = {};
      let ticketsSold = 0;
      
      if (eventIds.length > 0) {
        // Get tickets with their ticket_type currency
        const { data: tickets } = await supabase
          .from('tickets')
          .select('amount_paid, quantity, ticket_type_id, ticket_types(currency, price), transaction_id')
          .in('event_id', eventIds);

        const baseAmountMap = await getBaseAmountsByTransactionId(tickets?.map((t: any) => t.transaction_id) || []);
        
        tickets?.forEach((t: any) => {
          const currency = t.ticket_types?.currency || 'USD';
          const pricePerTicket = Number(t.ticket_types?.price) || 0;
          const ticketPriceAmount = pricePerTicket > 0 ? pricePerTicket * Number(t.quantity || 0) : undefined;
          const baseAmount = baseAmountMap.get(t.transaction_id) ?? ticketPriceAmount ?? 0;
          ticketRevenueByCurrency[currency] = (ticketRevenueByCurrency[currency] || 0) + Number(baseAmount || 0);
          ticketsSold += t.quantity;
        });
      }
      
      // Get all contests with their currency
      const { data: contests } = await supabase
        .from('contests')
        .select('id, is_active, end_date, vote_currency')
        .eq('organization_id', user!.id);
      
      const contestIds = contests?.map(c => c.id) || [];
      const activeContests = contests?.filter(c => c.is_active && new Date(c.end_date) > new Date()).length || 0;
      
      // Create a map of contest_id -> vote_currency
      const contestCurrencyMap: Record<string, string> = {};
      contests?.forEach(c => {
        contestCurrencyMap[c.id] = c.vote_currency || 'NGN';
      });
      
      // Revenue by currency for votes
      const voteRevenueByCurrency: Record<string, number> = {};
      let totalVotes = 0;
      
      if (contestIds.length > 0) {
        const { data: votes } = await supabase
          .from('votes')
          .select('amount_paid, quantity, contest_id, transaction_id')
          .in('contest_id', contestIds);

        const baseAmountMap = await getBaseAmountsByTransactionId(votes?.map((v: any) => v.transaction_id) || []);
        const { data: voteOptions } = await supabase
          .from('contest_vote_options')
          .select('contest_id, vote_quantity, price')
          .in('contest_id', contestIds);

        const voteOptionPriceMap = new Map<string, number>();
        voteOptions?.forEach((option: any) => {
          voteOptionPriceMap.set(`${option.contest_id}:${option.vote_quantity}`, Number(option.price) || 0);
        });
        
        votes?.forEach((v: any) => {
          const currency = contestCurrencyMap[v.contest_id] || 'NGN';
          const optionPrice = voteOptionPriceMap.get(`${v.contest_id}:${v.quantity}`);
          const baseAmount = baseAmountMap.get(v.transaction_id) ?? optionPrice ?? 0;
          voteRevenueByCurrency[currency] = (voteRevenueByCurrency[currency] || 0) + Number(baseAmount || 0);
          totalVotes += v.quantity;
        });
      }
      
      // Revenue by currency for campaigns (donations)
      const campaignRevenueByCurrency: Record<string, number> = {};
      let totalDonations = 0;
      
      // Get campaigns created by this organization
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('creator_id', user!.id);
      
      const campaignIds = campaigns?.map(c => c.id) || [];
      
      if (campaignIds.length > 0) {
        const { data: donations } = await supabase
          .from('donations')
          .select('amount, currency, transaction_id')
          .in('campaign_id', campaignIds)
          .eq('status', 'completed');

        const baseAmountMap = await getBaseAmountsByTransactionId(
          donations?.map((d: any) => d.transaction_id) || []
        );
        
        donations?.forEach((d: any) => {
          const currency = d.currency || 'USD';
          const baseAmount = baseAmountMap.get(d.transaction_id) ?? 0;
          campaignRevenueByCurrency[currency] = (campaignRevenueByCurrency[currency] || 0) + Number(baseAmount || 0);
          totalDonations += 1;
        });
      }
      
      // Get payouts grouped by currency
      const { data: payouts } = await supabase
        .from('payouts')
        .select('amount, status, currency')
        .eq('organization_id', user!.id);
      
      // Calculate payouts by currency
      const pendingPayoutsByCurrency: Record<string, number> = {};
      const completedPayoutsByCurrency: Record<string, number> = {};
      
      payouts?.forEach((p: any) => {
        const currency = p.currency || 'USD';
        if (p.status === 'pending') {
          pendingPayoutsByCurrency[currency] = (pendingPayoutsByCurrency[currency] || 0) + Number(p.amount);
        } else if (p.status === 'completed') {
          completedPayoutsByCurrency[currency] = (completedPayoutsByCurrency[currency] || 0) + Number(p.amount);
        }
      });
      
      // Also keep totals for backwards compatibility
      const pendingPayouts = payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const completedPayouts = payouts?.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      // Get organization commission rates
      const { data: approval } = await supabase
        .from('organization_approvals')
        .select('ticket_commission_rate, vote_commission_rate')
        .eq('organization_id', user!.id)
        .maybeSingle();
      
      // Default commission rates (10% if not set)
      const ticketCommissionRate = approval?.ticket_commission_rate ?? 10;
      const voteCommissionRate = approval?.vote_commission_rate ?? 10;
      
      // Sum up raw totals (for backwards compatibility - these are mixed currencies)
      const ticketRevenue = Object.values(ticketRevenueByCurrency).reduce((a, b) => a + b, 0);
      const voteRevenue = Object.values(voteRevenueByCurrency).reduce((a, b) => a + b, 0);
      const campaignRevenue = Object.values(campaignRevenueByCurrency).reduce((a, b) => a + b, 0);
      const totalRevenue = ticketRevenue + voteRevenue + campaignRevenue;
      
      // Calculate net revenue after platform commission PER CURRENCY
      const netRevenueByCurrency: Record<string, number> = {};
      const availableBalanceByCurrency: Record<string, number> = {};
      
      // Get all unique currencies (including those with payouts)
      const allCurrencies = new Set([
        ...Object.keys(ticketRevenueByCurrency),
        ...Object.keys(voteRevenueByCurrency),
        ...Object.keys(campaignRevenueByCurrency),
        ...Object.keys(pendingPayoutsByCurrency),
        ...Object.keys(completedPayoutsByCurrency),
      ]);
      
      allCurrencies.forEach(currency => {
        const ticketRev = ticketRevenueByCurrency[currency] || 0;
        const voteRev = voteRevenueByCurrency[currency] || 0;
        const campaignRev = campaignRevenueByCurrency[currency] || 0;
        
        const netTicket = ticketRev * (1 - ticketCommissionRate / 100);
        const netVote = voteRev * (1 - voteCommissionRate / 100);
        const netCampaign = campaignRev * (1 - ticketCommissionRate / 100);
        
        const netRev = netTicket + netVote + netCampaign;
        netRevenueByCurrency[currency] = netRev;
        
        // Available balance = net revenue - pending payouts - completed payouts
        const pending = pendingPayoutsByCurrency[currency] || 0;
        const completed = completedPayoutsByCurrency[currency] || 0;
        availableBalanceByCurrency[currency] = netRev - pending - completed;
      });
      
      // Calculate total net revenue (mixed currencies - for backwards compatibility)
      const netTicketRevenue = ticketRevenue * (1 - ticketCommissionRate / 100);
      const netVoteRevenue = voteRevenue * (1 - voteCommissionRate / 100);
      const netCampaignRevenue = campaignRevenue * (1 - ticketCommissionRate / 100);
      const netRevenue = netTicketRevenue + netVoteRevenue + netCampaignRevenue;
      const availableBalance = netRevenue - completedPayouts - pendingPayouts;
      
      return {
        totalRevenue,
        ticketRevenue,
        voteRevenue,
        campaignRevenue,
        ticketsSold,
        totalVotes,
        totalDonations,
        pendingPayouts,
        completedPayouts,
        availableBalance,
        activeContests,
        activeEvents,
        // Revenue breakdown by currency
        ticketRevenueByCurrency,
        voteRevenueByCurrency,
        campaignRevenueByCurrency,
        netRevenueByCurrency,
        availableBalanceByCurrency,
        pendingPayoutsByCurrency,
        completedPayoutsByCurrency,
        ticketCommissionRate,
        voteCommissionRate,
      };
    },
    enabled: !!user,
  });
};

// Create Contest
export const useCreateContest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (contestData: {
      title: string;
      description: string;
      category: string;
      image_url?: string;
      start_date: string;
      end_date: string;
      vote_price: number;
      vote_amount: number;
      vote_options?: Array<{
        vote_quantity: number;
        price: number;
      }>;
      vote_currency?: string;
      custom_slug?: string;
      brand_primary_color?: string;
      brand_secondary_color?: string;
      brand_logo_url?: string;
      contest_type?: 'single' | 'category';
      is_live_voting?: boolean;
    }) => {
      const { vote_options, ...contestPayload } = contestData;
      const { data, error } = await supabase
        .from('contests')
        .insert({ ...contestPayload, organization_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;

      if (vote_options && vote_options.length > 0) {
        const sanitizedOptions = vote_options
          .map((option, index) => ({
            contest_id: data.id,
            vote_quantity: Math.max(1, Math.floor(Number(option.vote_quantity) || 0)),
            price: Number(option.price) || 0,
            sort_order: index,
            is_active: true,
          }))
          .filter((option) => option.price > 0);

        if (sanitizedOptions.length > 0) {
          const { error: optionsError } = await supabase
            .from('contest_vote_options')
            .insert(sanitizedOptions);

          if (optionsError) throw optionsError;
        }
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-contests'] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      toast.success('Contest created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create contest');
      console.error(error);
    },
  });
};

// Duplicate Contest
export const useDuplicateContest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (contestId: string) => {
      // Fetch the original contest
      const { data: original, error: fetchError } = await supabase
        .from('contests')
        .select('*')
        .eq('id', contestId)
        .single();
      
      if (fetchError || !original) throw fetchError || new Error('Contest not found');
      
      // Create a new contest with copied data
      const { data, error } = await supabase
        .from('contests')
        .insert({
          organization_id: user!.id,
          title: `${original.title} (Copy)`,
          description: original.description,
          category: original.category,
          image_url: original.image_url,
          start_date: original.start_date,
          end_date: original.end_date,
          vote_price: original.vote_price,
          vote_currency: original.vote_currency,
          custom_slug: null, // Reset slug to avoid conflicts
          brand_primary_color: original.brand_primary_color,
          brand_secondary_color: original.brand_secondary_color,
          brand_logo_url: original.brand_logo_url,
          is_active: false, // Start as inactive
          is_featured: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Optionally copy contestants
      const { data: contestants } = await supabase
        .from('contestants')
        .select('name, bio, photo_url, performance, display_order')
        .eq('contest_id', contestId);
      
      if (contestants && contestants.length > 0) {
        const newContestants = contestants.map(c => ({
          ...c,
          contest_id: data.id,
          vote_count: 0,
        }));
        
        await supabase.from('contestants').insert(newContestants);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-contests'] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      toast.success('Contest duplicated successfully');
    },
    onError: (error) => {
      toast.error('Failed to duplicate contest');
      console.error(error);
    },
  });
};

// Delete Contest
export const useDeleteContest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contestId: string) => {
      // Delete contestants first (they reference the contest)
      await supabase
        .from('contestants')
        .delete()
        .eq('contest_id', contestId);
      
      // Delete contest categories
      await supabase
        .from('contest_categories')
        .delete()
        .eq('contest_id', contestId);
      
      // Delete the contest
      const { error } = await supabase
        .from('contests')
        .delete()
        .eq('id', contestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-contests'] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      toast.success('Contest deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete contest');
      console.error(error);
    },
  });
};
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (eventData: {
      title: string;
      description: string;
      category: string;
      image_url?: string;
      event_date: string;
      venue: string;
      address?: string;
      custom_slug?: string;
      country?: string;
    }) => {
      const { data, error } = await supabase
        .from('events')
        .insert({ ...eventData, organization_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create event');
      console.error(error);
    },
  });
};

// Delete Event
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      // Delete promo codes first (they reference the event)
      await supabase
        .from('promo_codes')
        .delete()
        .eq('event_id', eventId);
      
      // Delete ticket types (they reference the event)
      await supabase
        .from('ticket_types')
        .delete()
        .eq('event_id', eventId);
      
      // Delete event auto posts
      await supabase
        .from('event_auto_posts')
        .delete()
        .eq('event_id', eventId);
      
      // Delete influencer links
      await supabase
        .from('influencer_links')
        .delete()
        .eq('event_id', eventId);
      
      // Delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete event');
      console.error(error);
    },
  });
};

// Duplicate Event
export const useDuplicateEvent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      // Fetch the original event
      const { data: original, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (fetchError || !original) throw fetchError || new Error('Event not found');
      
      // Create a new event with copied data
      const { data, error } = await supabase
        .from('events')
        .insert({
          organization_id: user!.id,
          title: `${original.title} (Copy)`,
          description: original.description,
          category: original.category,
          image_url: original.image_url,
          event_date: original.event_date,
          venue: original.venue,
          address: original.address,
          is_active: false, // Start as inactive
          is_featured: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Copy ticket types
      const { data: ticketTypes } = await supabase
        .from('ticket_types')
        .select('name, description, price, currency, quantity_available')
        .eq('event_id', eventId);
      
      if (ticketTypes && ticketTypes.length > 0) {
        const newTicketTypes = ticketTypes.map(tt => ({
          ...tt,
          event_id: data.id,
          quantity_sold: 0,
        }));
        
        await supabase.from('ticket_types').insert(newTicketTypes);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event duplicated successfully');
    },
    onError: (error) => {
      toast.error('Failed to duplicate event');
      console.error(error);
    },
  });
};

// Create Contestant
export const useCreateContestant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contestantData: {
      contest_id: string;
      name: string;
      bio?: string;
      photo_url?: string;
      performance?: string;
      category_id?: string | null;
    }) => {
      const { error } = await supabase
        .from('contestants')
        .insert(contestantData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contestants'] });
      toast.success('Contestant added');
    },
    onError: (error) => {
      toast.error('Failed to add contestant');
      console.error(error);
    },
  });
};

// Update Contestant
export const useUpdateContestant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: { 
      id: string; 
      name?: string;
      bio?: string;
      photo_url?: string;
      performance?: string;
      category_id?: string | null;
    }) => {
      const { error } = await supabase
        .from('contestants')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contestants'] });
      toast.success('Contestant updated');
    },
    onError: (error) => {
      toast.error('Failed to update contestant');
      console.error(error);
    },
  });
};

// Delete Contestant
export const useDeleteContestant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contestantId: string) => {
      const { error } = await supabase
        .from('contestants')
        .delete()
        .eq('id', contestantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contestants'] });
      toast.success('Contestant deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete contestant');
      console.error(error);
    },
  });
};

// Bulk Delete Contestants
export const useBulkDeleteContestants = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contestantIds: string[]) => {
      const { error } = await supabase
        .from('contestants')
        .delete()
        .in('id', contestantIds);
      
      if (error) throw error;
    },
    onSuccess: (_, contestantIds) => {
      queryClient.invalidateQueries({ queryKey: ['contestants'] });
      toast.success(`${contestantIds.length} contestant(s) deleted`);
    },
    onError: (error) => {
      toast.error('Failed to delete contestants');
      console.error(error);
    },
  });
};

// Reorder Contestants
export const useReorderContestants = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      // Update each contestant's display_order
      for (const update of updates) {
        const { error } = await supabase
          .from('contestants')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contestants'] });
      toast.success('Order updated');
    },
    onError: (error) => {
      toast.error('Failed to update order');
      console.error(error);
    },
  });
};


// Create Ticket Type
export const useCreateTicketType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketTypeData: {
      event_id: string;
      name: string;
      price: number;
      currency?: string;
      quantity_available: number;
      description?: string;
    }) => {
      const { error } = await supabase
        .from('ticket_types')
        .insert(ticketTypeData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
      toast.success('Ticket type added');
    },
    onError: (error) => {
      toast.error('Failed to add ticket type');
      console.error(error);
    },
  });
};

// Update Ticket Type
export const useUpdateTicketType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: { 
      id: string; 
      name?: string;
      price?: number;
      currency?: string;
      quantity_available?: number;
      description?: string;
    }) => {
      const { error } = await supabase
        .from('ticket_types')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
      toast.success('Ticket type updated');
    },
    onError: (error) => {
      toast.error('Failed to update ticket type');
      console.error(error);
    },
  });
};

// Delete Ticket Type
export const useDeleteTicketType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketTypeId: string) => {
      const { error } = await supabase
        .from('ticket_types')
        .delete()
        .eq('id', ticketTypeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
      toast.success('Ticket type deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete ticket type. It may have tickets sold.');
      console.error(error);
    },
  });
};


// Update Contest
export const useUpdateContest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string; [key: string]: any }) => {
      const { data, error, count } = await supabase
        .from('contests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Contest not found or you do not have permission to update it');
      return id;
    },
    onSuccess: (contestId) => {
      // Invalidate all contest-related queries to ensure fresh data across the app
      queryClient.invalidateQueries({ queryKey: ['organization-contests'] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
      queryClient.invalidateQueries({ queryKey: ['admin-contests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-contests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contest-detail', contestId] });
      queryClient.invalidateQueries({ queryKey: ['featured-contests'] });
      queryClient.invalidateQueries({ queryKey: ['contestants', contestId] });
      queryClient.invalidateQueries({ queryKey: ['contest-vote-options', contestId] });
      toast.success('Contest updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update contest');
      console.error('Update contest error:', error);
    },
  });
};

// Update Event
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate all event-related queries to ensure fresh data across the app
      queryClient.invalidateQueries({ queryKey: ['organization-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['featured-events'] });
      toast.success('Event updated');
    },
    onError: (error) => {
      toast.error('Failed to update event');
      console.error(error);
    },
  });
};

// Get contestants for a contest (organization view)
export const useContestContestants = (contestId: string) => {
  return useQuery({
    queryKey: ['contestants', contestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contestants')
        .select('*')
        .eq('contest_id', contestId)
        .order('vote_count', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!contestId,
  });
};

// Get tickets for an event (organization view)
export const useEventTickets = (eventId: string) => {
  return useQuery({
    queryKey: ['event-tickets', eventId],
    queryFn: async () => {
      // Fetch tickets with ticket_types
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*, ticket_types(name, price), transaction_id')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!tickets || tickets.length === 0) return [];

      const baseAmountMap = await getBaseAmountsByTransactionId(tickets.map((t: any) => t.transaction_id));

      // Fetch profiles for all user_ids
      const userIds = [...new Set(tickets.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Merge profiles into tickets - prioritize guest_name/guest_email from ticket
      return tickets.map(ticket => {
        const profile = profileMap.get(ticket.user_id);
        return {
          ...ticket,
          base_amount: baseAmountMap.get((ticket as any).transaction_id) ?? null,
          profiles: {
            full_name: ticket.guest_name || profile?.full_name || null,
            email: ticket.guest_email || profile?.email || null,
          },
        };
      });
    },
    enabled: !!eventId,
  });
};

// Get ticket types for an event
export const useEventTicketTypes = (eventId: string) => {
  return useQuery({
    queryKey: ['ticket-types', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId)
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
};
