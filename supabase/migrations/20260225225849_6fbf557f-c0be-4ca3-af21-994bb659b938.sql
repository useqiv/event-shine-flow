
-- Atomic ticket check-in function that prevents double-scanning
-- Uses row-level locking to ensure only one scanner can check in a ticket
CREATE OR REPLACE FUNCTION public.atomic_ticket_checkin(
  p_ticket_id UUID,
  p_event_id UUID,
  p_scanned_by UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket RECORD;
  v_result jsonb;
BEGIN
  -- Lock the ticket row and check status atomically
  SELECT id, status, event_id
  INTO v_ticket
  FROM tickets
  WHERE id = p_ticket_id
  FOR UPDATE SKIP LOCKED;

  -- If we couldn't lock the row, another scanner is processing it
  IF v_ticket IS NULL THEN
    -- Check if ticket exists but is locked
    IF EXISTS (SELECT 1 FROM tickets WHERE id = p_ticket_id) THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'processing',
        'message', 'This ticket is being processed by another scanner. Please wait.'
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'not_found',
        'message', 'Ticket not found.'
      );
    END IF;
  END IF;

  -- Verify event matches
  IF v_ticket.event_id != p_event_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'wrong_event',
      'message', 'This ticket is for a different event.'
    );
  END IF;

  -- Check if already used
  IF v_ticket.status = 'used' THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_used',
      'message', 'This ticket has already been scanned and used.'
    );
  END IF;

  -- Check if cancelled
  IF v_ticket.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'cancelled',
      'message', 'This ticket has been cancelled.'
    );
  END IF;

  -- Check if active
  IF v_ticket.status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'invalid_status',
      'message', 'Ticket status: ' || v_ticket.status
    );
  END IF;

  -- Atomically mark as used
  UPDATE tickets SET status = 'used' WHERE id = p_ticket_id;

  -- Log the successful scan
  INSERT INTO qr_scan_logs (event_id, ticket_id, scan_result, scanned_by)
  VALUES (p_event_id, p_ticket_id, 'success', p_scanned_by);

  RETURN jsonb_build_object(
    'success', true,
    'reason', 'checked_in',
    'message', 'Check-in successful!'
  );
END;
$$;
