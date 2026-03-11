import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryCache, selectColumns } from '@/lib/queryConfig';

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
  country: string | null;
  currency: string;
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
        .select(selectColumns.eventCard)
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return data as Event[];
    },
    ...queryCache.publicListing, // Public listing with moderate caching
  });
};

export const useFeaturedEvents = () => {
  return useQuery({
    queryKey: ['featured-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(selectColumns.eventCard)
        .eq('is_active', true)
        .eq('is_featured', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data as Event[];
    },
    ...queryCache.publicListing,
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
          .select(selectColumns.eventDetail)
          .eq('id', idOrSlug)
          .maybeSingle();
        
        if (error) throw error;
        return data as Event | null;
      }
      
      // Otherwise try by custom_slug
      const { data, error } = await supabase
        .from('events')
        .select(selectColumns.eventDetail)
        .eq('custom_slug', idOrSlug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Event | null;
    },
    enabled: !!idOrSlug,
    ...queryCache.moderate, // Individual event details
  });
};

export const useTicketTypes = (eventId: string) => {
  return useQuery({
    queryKey: ['ticket-types', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_types')
        .select(selectColumns.ticketType)
        .eq('event_id', eventId)
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data as TicketType[];
    },
    enabled: !!eventId,
    ...queryCache.dynamic, // Ticket availability changes
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

// Maximum free tickets per user/email per event
const FREE_TICKET_LIMIT_PER_EVENT = 5;

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
      guestName,
      eventDetails
    }: {
      eventId: string;
      ticketTypeId: string;
      quantity: number;
      amountPaid: number;
      paymentMethod: 'wallet' | 'card' | 'bank_transfer' | 'usdt';
      guestEmail?: string;
      guestName?: string;
      eventDetails?: {
        eventTitle: string;
        eventDate: string;
        eventVenue: string;
        ticketTypeName: string;
        currency: string;
      };
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

      // Check free ticket claim limit
      if (isFreeTicket) {
        let existingClaimCount = 0;

        if (user?.id) {
          // Check by user_id for authenticated users
          const { data: userTickets, error: countError } = await supabase
            .from('tickets')
            .select('quantity')
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .eq('amount_paid', 0);

          if (countError) throw countError;
          existingClaimCount = userTickets?.reduce((sum, t) => sum + t.quantity, 0) || 0;
        } else if (guestEmail) {
          // Check by email for guest users
          const { data: guestTickets, error: countError } = await supabase
            .from('tickets')
            .select('quantity')
            .eq('event_id', eventId)
            .eq('guest_email', guestEmail.toLowerCase())
            .eq('amount_paid', 0);

          if (countError) throw countError;
          existingClaimCount = guestTickets?.reduce((sum, t) => sum + t.quantity, 0) || 0;
        }

        const totalAfterClaim = existingClaimCount + quantity;
        if (totalAfterClaim > FREE_TICKET_LIMIT_PER_EVENT) {
          const remaining = FREE_TICKET_LIMIT_PER_EVENT - existingClaimCount;
          if (remaining <= 0) {
            throw new Error(`You have already claimed the maximum of ${FREE_TICKET_LIMIT_PER_EVENT} free tickets for this event.`);
          }
          throw new Error(`You can only claim ${remaining} more free ticket(s) for this event (limit: ${FREE_TICKET_LIMIT_PER_EVENT}).`);
        }
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
        // Explicitly set user_id to null for guest tickets (required by RLS policy)
        ticketData.user_id = null;
        ticketData.guest_email = guestEmail?.toLowerCase();
        ticketData.guest_name = guestName || null;
      }

      const { error } = await supabase
        .from('tickets')
        .insert(ticketData);

      if (error) throw error;

      const createdTicket = {
        ...ticketData,
        qr_code: qrCode,
      };

      // Send organization transaction notification
      try {
        const { data: eventData } = await supabase
          .from('events')
          .select('organization_id, title')
          .eq('id', eventId)
          .single();

        if (eventData?.organization_id) {
          const buyerName = guestName || (user?.id ? 'Authenticated User' : 'Guest');
          const buyerEmail = guestEmail || user?.email || '';

          // Get user profile info if authenticated
          if (user?.id && (!guestName || buyerEmail === user?.email)) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', user.id)
              .single();
            
            await supabase.functions.invoke('send-org-transaction-notification', {
              body: {
                type: 'ticket',
                organization_id: eventData.organization_id,
                amount: amountPaid,
                currency: eventDetails?.currency || 'NGN',
                quantity,
                event_title: eventData.title || eventDetails?.eventTitle || 'Event',
                ticket_type: eventDetails?.ticketTypeName || 'General',
                buyer_name: profile?.full_name || buyerName,
                buyer_email: profile?.email || buyerEmail,
              }
            });
          } else {
            await supabase.functions.invoke('send-org-transaction-notification', {
              body: {
                type: 'ticket',
                organization_id: eventData.organization_id,
                amount: amountPaid,
                currency: eventDetails?.currency || 'NGN',
                quantity,
                event_title: eventData.title || eventDetails?.eventTitle || 'Event',
                ticket_type: eventDetails?.ticketTypeName || 'General',
                buyer_name: buyerName,
                buyer_email: buyerEmail,
              }
            });
          }
        }
      } catch (notifError) {
        console.error('Failed to send org transaction notification:', notifError);
      }

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

      // Send email with QR code for free tickets
      if (isFreeTicket && eventDetails) {
        const recipientEmail = isGuest ? guestEmail : null;
        const recipientName = isGuest ? (guestName || 'Guest') : null;

        // Get user email if authenticated
        let userEmail = recipientEmail;
        let userName = recipientName;
        
        if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', user.id)
            .single();
          
          userEmail = profile?.email || user.email;
          userName = profile?.full_name || 'User';
        }

        if (userEmail) {
          try {
            await supabase.functions.invoke('send-payment-receipt', {
              body: {
                type: 'ticket',
                user_email: userEmail,
                user_name: userName || 'Guest',
                amount: 0,
                currency: eventDetails.currency || 'NGN',
                quantity,
                payment_method: 'Free Ticket',
                transaction_ref: qrCode,
                event_title: eventDetails.eventTitle,
                event_date: eventDetails.eventDate,
                event_venue: eventDetails.eventVenue,
                ticket_type: eventDetails.ticketTypeName,
                qr_code: qrCode
              }
            });
          } catch (emailError) {
            console.error('Failed to send ticket email:', emailError);
            // Don't throw - ticket was claimed successfully, email is secondary
          }
        }
      }

      return createdTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
