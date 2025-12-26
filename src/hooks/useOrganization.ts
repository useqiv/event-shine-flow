import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  organization_id: string;
  amount: number;
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
    mutationFn: async (payoutData: { amount: number; payment_method: string }) => {
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
      // Get all events
      const { data: events } = await supabase
        .from('events')
        .select('id, is_active, event_date')
        .eq('organization_id', user!.id);
      
      const eventIds = events?.map(e => e.id) || [];
      const activeEvents = events?.filter(e => e.is_active && new Date(e.event_date) > new Date()).length || 0;
      
      let ticketRevenue = 0;
      let ticketsSold = 0;
      
      if (eventIds.length > 0) {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('amount_paid, quantity')
          .in('event_id', eventIds);
        
        ticketRevenue = tickets?.reduce((sum, t) => sum + Number(t.amount_paid), 0) || 0;
        ticketsSold = tickets?.reduce((sum, t) => sum + t.quantity, 0) || 0;
      }
      
      // Get all contests
      const { data: contests } = await supabase
        .from('contests')
        .select('id, is_active, end_date')
        .eq('organization_id', user!.id);
      
      const contestIds = contests?.map(c => c.id) || [];
      const activeContests = contests?.filter(c => c.is_active && new Date(c.end_date) > new Date()).length || 0;
      
      let voteRevenue = 0;
      let totalVotes = 0;
      
      if (contestIds.length > 0) {
        const { data: votes } = await supabase
          .from('votes')
          .select('amount_paid, quantity')
          .in('contest_id', contestIds);
        
        voteRevenue = votes?.reduce((sum, v) => sum + Number(v.amount_paid), 0) || 0;
        totalVotes = votes?.reduce((sum, v) => sum + v.quantity, 0) || 0;
      }
      
      // Get pending payouts
      const { data: payouts } = await supabase
        .from('payouts')
        .select('amount, status')
        .eq('organization_id', user!.id);
      
      const pendingPayouts = payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const completedPayouts = payouts?.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      // Get organization commission rates
      const { data: approval } = await supabase
        .from('organization_approvals')
        .select('ticket_commission_rate, vote_commission_rate')
        .eq('organization_id', user!.id)
        .single();
      
      // Default commission rates (10% if not set)
      const ticketCommissionRate = approval?.ticket_commission_rate ?? 10;
      const voteCommissionRate = approval?.vote_commission_rate ?? 10;
      
      // Calculate net revenue after platform commission
      const netTicketRevenue = ticketRevenue * (1 - ticketCommissionRate / 100);
      const netVoteRevenue = voteRevenue * (1 - voteCommissionRate / 100);
      
      const totalRevenue = ticketRevenue + voteRevenue;
      const netRevenue = netTicketRevenue + netVoteRevenue;
      const availableBalance = netRevenue - completedPayouts - pendingPayouts;
      
      return {
        totalRevenue,
        ticketRevenue,
        voteRevenue,
        ticketsSold,
        totalVotes,
        pendingPayouts,
        completedPayouts,
        availableBalance,
        activeContests,
        activeEvents,
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
      vote_currency?: string;
      custom_slug?: string;
      brand_primary_color?: string;
      brand_secondary_color?: string;
      brand_logo_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('contests')
        .insert({ ...contestData, organization_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
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

// Create Event
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
      const { error } = await supabase
        .from('contests')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-contests'] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      toast.success('Contest updated');
    },
    onError: (error) => {
      toast.error('Failed to update contest');
      console.error(error);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
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
        .select('*, ticket_types(name, price)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!tickets || tickets.length === 0) return [];

      // Fetch profiles for all user_ids
      const userIds = [...new Set(tickets.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Merge profiles into tickets
      return tickets.map(ticket => ({
        ...ticket,
        profiles: profileMap.get(ticket.user_id) || { full_name: 'Unknown', email: '' },
      }));
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
