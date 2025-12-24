import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TicketValidationResult {
  isValid: boolean;
  message: string;
  ticket?: {
    id: string;
    status: string;
    quantity: number;
    attendeeName?: string;
    ticketType?: string;
    eventTitle?: string;
  };
}

export const useValidateTicket = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ qrCode, eventId }: { qrCode: string; eventId: string }): Promise<TicketValidationResult> => {
      if (!user) {
        return { isValid: false, message: 'Not authenticated' };
      }

      // Find the ticket by QR code
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_types (name),
          events (title)
        `)
        .eq('qr_code', qrCode)
        .eq('event_id', eventId)
        .maybeSingle();

      if (ticketError) {
        console.error('Ticket lookup error:', ticketError);
        return { isValid: false, message: 'Error looking up ticket' };
      }

      if (!ticket) {
        // Log failed scan
        await supabase.from('qr_scan_logs').insert({
          ticket_id: '00000000-0000-0000-0000-000000000000', // placeholder for invalid
          event_id: eventId,
          scanned_by: user.id,
          scan_result: 'invalid',
        });
        
        return { isValid: false, message: 'Invalid ticket - not found for this event' };
      }

      // Check ticket status
      if (ticket.status === 'used') {
        // Log already used scan
        await supabase.from('qr_scan_logs').insert({
          ticket_id: ticket.id,
          event_id: eventId,
          scanned_by: user.id,
          scan_result: 'already_used',
        });
        
        return { 
          isValid: false, 
          message: 'Ticket already used',
          ticket: {
            id: ticket.id,
            status: ticket.status,
            quantity: ticket.quantity,
            ticketType: ticket.ticket_types?.name,
            eventTitle: ticket.events?.title,
          }
        };
      }

      if (ticket.status === 'cancelled') {
        await supabase.from('qr_scan_logs').insert({
          ticket_id: ticket.id,
          event_id: eventId,
          scanned_by: user.id,
          scan_result: 'cancelled',
        });
        
        return { isValid: false, message: 'Ticket has been cancelled' };
      }

      // Valid ticket - mark as used
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'used' })
        .eq('id', ticket.id);

      if (updateError) {
        console.error('Failed to update ticket:', updateError);
        return { isValid: false, message: 'Failed to validate ticket' };
      }

      // Log successful scan
      await supabase.from('qr_scan_logs').insert({
        ticket_id: ticket.id,
        event_id: eventId,
        scanned_by: user.id,
        scan_result: 'success',
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['qr-scan-logs', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] });

      return {
        isValid: true,
        message: 'Ticket validated successfully!',
        ticket: {
          id: ticket.id,
          status: 'used',
          quantity: ticket.quantity,
          ticketType: ticket.ticket_types?.name,
          eventTitle: ticket.events?.title,
        }
      };
    },
  });
};
