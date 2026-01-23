import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  venue: string;
  address: string | null;
  event_date: string;
  is_active: boolean;
  is_featured: boolean;
  custom_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity_available: number;
  quantity_sold: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  event_id: string;
  ticket_type_id: string;
  quantity: number;
  qr_code: string;
  amount_paid: number;
  payment_method: string;
  status: 'active' | 'used' | 'cancelled' | 'expired';
  created_at: string;
}

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return data as Event[];
    },
  });
};

export const useFeaturedEvents = () => {
  return useQuery({
    queryKey: ['featured-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('event_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data as Event[];
    },
  });
};

export const useEvent = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['event', idOrSlug],
    queryFn: async () => {
      // First try by ID (UUID format)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      
      if (isUUID) {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', idOrSlug)
          .single();
        
        if (error) throw error;
        return data as Event;
      }
      
      // Otherwise try by custom_slug
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('custom_slug', idOrSlug)
        .single();
      
      if (error) throw error;
      return data as Event;
    },
    enabled: !!idOrSlug,
  });
};

export const useTicketTypes = (eventId: string) => {
  return useQuery({
    queryKey: ['ticket-types', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId)
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data as TicketType[];
    },
    enabled: !!eventId,
  });
};

export const useMyTickets = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          event:events(*),
          ticket_type:ticket_types(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const usePurchaseTicket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      eventId,
      ticketTypeId,
      quantity,
      amountPaid,
      paymentMethod,
      guestEmail,
      guestName
    }: {
      eventId: string;
      ticketTypeId: string;
      quantity: number;
      amountPaid: number;
      paymentMethod: 'wallet' | 'card' | 'bank_transfer' | 'usdt';
      guestEmail?: string;
      guestName?: string;
    }) => {
      const isGuest = !user?.id;
      const isFreeTicket = amountPaid === 0;

      // For paid tickets, require authentication
      if (!isFreeTicket && isGuest) {
        throw new Error('Please login to purchase paid tickets');
      }

      // For free tickets as guest, require email
      if (isFreeTicket && isGuest && !guestEmail) {
        throw new Error('Email is required for free ticket delivery');
      }

      // Generate unique QR code
      const qrCode = `TICKET-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // If paying with wallet (only for authenticated users with paid tickets)
      if (paymentMethod === 'wallet' && !isFreeTicket && user?.id) {
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (walletError) throw walletError;
        if (Number(wallet.balance) < amountPaid) {
          throw new Error('Insufficient wallet balance');
        }

        // Create wallet transaction
        await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: wallet.id,
            user_id: user.id,
            type: 'ticket',
            amount: -amountPaid,
            description: `Ticket purchase`,
            status: 'completed'
          });

        // Update wallet balance
        await supabase
          .from('wallets')
          .update({ balance: Number(wallet.balance) - amountPaid })
          .eq('id', wallet.id);
      }

      // Create ticket record - supports both authenticated and guest users
      const ticketData: any = {
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        quantity,
        qr_code: qrCode,
        amount_paid: amountPaid,
        payment_method: isFreeTicket ? 'free' : paymentMethod,
        status: 'active'
      };

      // Add user or guest info
      if (user?.id) {
        ticketData.user_id = user.id;
      } else {
        ticketData.guest_email = guestEmail;
        ticketData.guest_name = guestName || null;
      }

      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;

      // Create notification only for authenticated users
      if (user?.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            title: isFreeTicket ? 'Free Ticket Claimed!' : 'Ticket Purchased!',
            message: `Your ticket has been ${isFreeTicket ? 'claimed' : 'purchased'}. QR Code: ${qrCode}`,
            type: 'ticket'
          });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
