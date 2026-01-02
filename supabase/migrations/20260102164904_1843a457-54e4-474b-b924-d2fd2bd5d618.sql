-- Update the default permissions JSON to include all permission fields
ALTER TABLE public.team_members 
ALTER COLUMN permissions SET DEFAULT '{
  "can_view_contests": true,
  "can_edit_contests": false,
  "can_view_events": true,
  "can_edit_events": false,
  "can_view_campaigns": true,
  "can_edit_campaigns": false,
  "can_scan_tickets": true,
  "scan_tickets_event_ids": [],
  "can_view_analytics": false,
  "can_manage_payouts": false
}'::jsonb;