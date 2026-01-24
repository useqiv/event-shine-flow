/**
 * Reusable hook for fetching payment transactions with filtering
 * Used by AdminPaymentHistory and other payment-related pages
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, isAfter } from 'date-fns';

export interface PaymentTransaction {
  id: string;
  type: 'vote' | 'ticket' | 'donation' | 'form';
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  event_title?: string;
  contest_title?: string;
  campaign_title?: string;
  form_title?: string;
  quantity: number;
}

export interface PaymentFilters {
  searchTerm: string;
  statusFilter: string;
  methodFilter: string;
  typeFilter: string;
  entityFilter: string;
  daysFilter: string;
}

const DEFAULT_FILTERS: PaymentFilters = {
  searchTerm: '',
  statusFilter: 'all',
  methodFilter: 'all',
  typeFilter: 'all',
  entityFilter: 'all',
  daysFilter: '30',
};

/**
 * Fetch votes with contest info
 */
export const useVotesQuery = () => {
  return useQuery({
    queryKey: ['admin-votes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('votes_public')
        .select('id, quantity, amount_paid, payment_method, created_at, user_id, guest_email, guest_name, contest_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch contest info separately
      const contestIds = [...new Set(data?.map(v => v.contest_id).filter(Boolean))];
      const { data: contests } = await supabase
        .from('contests')
        .select('id, title, vote_currency')
        .in('id', contestIds);

      const contestsMap = new Map(contests?.map(c => [c.id, c]) || []);

      return data?.map(v => ({
        ...v,
        contest: contestsMap.get(v.contest_id),
      }));
    },
  });
};

/**
 * Fetch tickets with event/ticket type info
 */
export const useTicketsQuery = () => {
  return useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets_public')
        .select('id, quantity, amount_paid, payment_method, status, created_at, user_id, guest_name, guest_email, event_id, ticket_type_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const eventIds = [...new Set(data?.map(t => t.event_id).filter(Boolean))];
      const ticketTypeIds = [...new Set(data?.map(t => t.ticket_type_id).filter(Boolean))];

      const [eventsRes, ticketTypesRes] = await Promise.all([
        supabase.from('events').select('id, title').in('id', eventIds),
        supabase.from('ticket_types').select('id, name, currency').in('id', ticketTypeIds),
      ]);

      const eventsMap = new Map(eventsRes.data?.map(e => [e.id, e]) || []);
      const ticketTypesMap = new Map(ticketTypesRes.data?.map(t => [t.id, t]) || []);

      return data?.map(t => ({
        ...t,
        holder_name: t.guest_name,
        holder_email: t.guest_email,
        event: eventsMap.get(t.event_id),
        ticket_type: ticketTypesMap.get(t.ticket_type_id),
      }));
    },
  });
};

/**
 * Fetch donations with campaign info
 */
export const useDonationsQuery = () => {
  return useQuery({
    queryKey: ['admin-donations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donations_public')
        .select('id, amount, currency, payment_method, status, created_at, donor_id, guest_email, guest_name, is_anonymous, campaign_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const campaignIds = [...new Set(data?.map(d => d.campaign_id).filter(Boolean))];
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, title, currency')
        .in('id', campaignIds);

      const campaignsMap = new Map(campaigns?.map(c => [c.id, c]) || []);

      return data?.map(d => ({
        ...d,
        campaign: campaignsMap.get(d.campaign_id),
      }));
    },
  });
};

/**
 * Fetch form responses with payment info
 */
export const useFormResponsesQuery = () => {
  return useQuery({
    queryKey: ['admin-form-responses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_responses')
        .select('id, payment_amount, payment_status, submitted_at, form_id')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const formIds = [...new Set(data?.map(r => r.form_id).filter(Boolean))];
      const { data: forms } = await supabase
        .from('forms')
        .select('id, title, payment_currency')
        .in('id', formIds);

      const formsMap = new Map(forms?.map(f => [f.id, f]) || []);

      return data?.map(r => ({
        ...r,
        form: formsMap.get(r.form_id),
      }));
    },
  });
};

/**
 * Transform raw data into unified PaymentTransaction format
 */
export const usePaymentTransactions = () => {
  const { data: votes, isLoading: votesLoading } = useVotesQuery();
  const { data: tickets, isLoading: ticketsLoading } = useTicketsQuery();
  const { data: donations, isLoading: donationsLoading } = useDonationsQuery();
  const { data: formResponses, isLoading: formsLoading } = useFormResponsesQuery();

  const isLoading = votesLoading || ticketsLoading || donationsLoading || formsLoading;

  const allTransactions = useMemo(() => {
    const transactions: PaymentTransaction[] = [];

    // Add votes
    votes?.forEach((vote: any) => {
      const isGuest = !vote.user_id;
      transactions.push({
        id: vote.id,
        type: 'vote',
        amount: vote.amount_paid,
        currency: vote.contest?.vote_currency || 'NGN',
        status: 'completed',
        payment_method: vote.payment_method,
        created_at: vote.created_at,
        user_name: isGuest ? (vote.guest_name || 'Guest') : null,
        user_email: isGuest ? vote.guest_email : null,
        contest_title: vote.contest?.title,
        quantity: vote.quantity,
      });
    });

    // Add tickets
    tickets?.forEach((ticket: any) => {
      const isGuest = !ticket.user_id;
      transactions.push({
        id: ticket.id,
        type: 'ticket',
        amount: ticket.amount_paid,
        currency: ticket.ticket_type?.currency || 'NGN',
        status: ticket.status,
        payment_method: ticket.payment_method,
        created_at: ticket.created_at,
        user_name: isGuest ? (ticket.holder_name || 'Guest') : null,
        user_email: isGuest ? ticket.holder_email : null,
        event_title: ticket.event?.title,
        quantity: ticket.quantity,
      });
    });

    // Add donations
    donations?.forEach((donation: any) => {
      const isGuest = !donation.donor_id;
      const isAnonymous = donation.is_anonymous;
      transactions.push({
        id: donation.id,
        type: 'donation',
        amount: donation.amount,
        currency: donation.currency || donation.campaign?.currency || 'NGN',
        status: donation.status,
        payment_method: donation.payment_method,
        created_at: donation.created_at,
        user_name: isAnonymous ? 'Anonymous' : (isGuest ? (donation.guest_name || 'Guest') : null),
        user_email: isAnonymous ? null : (isGuest ? donation.guest_email : null),
        campaign_title: donation.campaign?.title,
        quantity: 1,
      });
    });

    // Add form payments
    formResponses?.forEach((response: any) => {
      if (response.payment_amount && response.payment_amount > 0) {
        transactions.push({
          id: response.id,
          type: 'form',
          amount: response.payment_amount,
          currency: response.form?.payment_currency || 'NGN',
          status: response.payment_status || 'pending',
          payment_method: 'flutterwave',
          created_at: response.submitted_at,
          user_name: null,
          user_email: null,
          form_title: response.form?.title,
          quantity: 1,
        });
      }
    });

    return transactions.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [votes, tickets, donations, formResponses]);

  return { transactions: allTransactions, isLoading, votes, tickets };
};

/**
 * Apply filters to transactions
 */
export const useFilteredTransactions = (
  transactions: PaymentTransaction[],
  filters: PaymentFilters,
  votes?: any[],
  tickets?: any[]
) => {
  return useMemo(() => {
    return transactions.filter((tx) => {
      // Search filter
      const searchMatch =
        !filters.searchTerm ||
        tx.contest_title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        tx.event_title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        tx.campaign_title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        tx.form_title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(filters.searchTerm.toLowerCase());

      // Status filter
      const statusMatch = filters.statusFilter === 'all' || tx.status === filters.statusFilter;

      // Payment method filter
      const methodMatch = filters.methodFilter === 'all' || tx.payment_method === filters.methodFilter;

      // Type filter
      const typeMatch = filters.typeFilter === 'all' || tx.type === filters.typeFilter;

      // Entity filter
      let entityMatch = true;
      if (filters.entityFilter !== 'all') {
        if (filters.entityFilter.startsWith('contest_')) {
          const contestId = filters.entityFilter.replace('contest_', '');
          entityMatch =
            tx.type === 'vote' &&
            votes?.some((v: any) => v.id === tx.id && v.contest?.id === contestId);
        } else if (filters.entityFilter.startsWith('event_')) {
          const eventId = filters.entityFilter.replace('event_', '');
          entityMatch =
            tx.type === 'ticket' &&
            tickets?.some((t: any) => t.id === tx.id && t.event?.id === eventId);
        }
      }

      // Date filter
      let dateMatch = true;
      if (filters.daysFilter !== 'all') {
        const daysAgo = subDays(new Date(), parseInt(filters.daysFilter));
        const txDate = new Date(tx.created_at);
        dateMatch = isAfter(txDate, daysAgo);
      }

      return searchMatch && statusMatch && methodMatch && typeMatch && entityMatch && dateMatch;
    });
  }, [transactions, filters, votes, tickets]);
};

/**
 * Calculate totals by currency
 */
export const useCurrencyTotals = (transactions: PaymentTransaction[]) => {
  return useMemo(() => {
    const successStatuses = ['completed', 'active', 'confirmed', 'used'];
    const completed = transactions.filter(t => successStatuses.includes(t.status));
    const byCurrency: Record<string, number> = {};

    completed.forEach(t => {
      const currency = t.currency || 'NGN';
      byCurrency[currency] = (byCurrency[currency] || 0) + t.amount;
    });

    return byCurrency;
  }, [transactions]);
};

/**
 * Calculate transaction count totals
 */
export const useTransactionTotals = (transactions: PaymentTransaction[]) => {
  return useMemo(() => ({
    count: transactions.length,
    votes: transactions.filter(t => t.type === 'vote').length,
    tickets: transactions.filter(t => t.type === 'ticket').length,
    donations: transactions.filter(t => t.type === 'donation').length,
    forms: transactions.filter(t => t.type === 'form').length,
  }), [transactions]);
};
