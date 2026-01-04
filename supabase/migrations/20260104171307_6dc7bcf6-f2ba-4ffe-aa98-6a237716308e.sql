-- Add missing platform settings for fees and notifications
INSERT INTO platform_settings (setting_key, setting_value, category, setting_type, description) 
VALUES 
  -- Flutterwave fees
  ('flutterwave_fee_percentage', '0', 'payment', 'number', 'Flutterwave transaction fee percentage'),
  ('flutterwave_fee_fixed', '0', 'payment', 'number', 'Flutterwave fixed fee per transaction'),
  ('flutterwave_fee_pass_to_customer', 'false', 'payment', 'boolean', 'Pass Flutterwave fees to customer'),
  ('flutterwave_test_mode', 'true', 'payment', 'boolean', 'Enable Flutterwave test mode'),
  
  -- Crypto fees
  ('crypto_fee_percentage', '0', 'payment', 'number', 'Crypto transaction fee percentage'),
  ('crypto_network_surcharge', '0', 'payment', 'number', 'Crypto network surcharge in USD'),
  ('crypto_fee_pass_to_customer', 'false', 'payment', 'boolean', 'Pass crypto fees to customer'),
  ('crypto_notify_admins', 'true', 'notification', 'boolean', 'Notify admins on pending crypto verification'),
  
  -- Convenience fee
  ('convenience_fee_type', 'none', 'payment', 'string', 'Convenience fee type: none, percentage, or fixed'),
  ('convenience_fee_value', '0', 'payment', 'number', 'Convenience fee value'),
  ('convenience_fee_cap', '', 'payment', 'number', 'Maximum convenience fee cap'),
  
  -- Notification settings
  ('notify_fraud_alerts', 'true', 'notification', 'boolean', 'Notify admins on fraud alerts'),
  ('notify_payout_requests', 'true', 'notification', 'boolean', 'Notify admins on payout requests'),
  ('notify_new_organizations', 'true', 'notification', 'boolean', 'Notify admins on new organization registrations'),
  ('notify_content_moderation', 'true', 'notification', 'boolean', 'Notify admins on content moderation needed'),
  
  -- Security settings
  ('require_admin_2fa', 'true', 'security', 'boolean', 'Require 2FA for all admin accounts'),
  ('require_org_2fa', 'false', 'security', 'boolean', 'Require 2FA for organization accounts'),
  ('admin_session_timeout', '60', 'security', 'number', 'Admin session timeout in minutes')
ON CONFLICT (setting_key) DO NOTHING;