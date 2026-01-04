-- Insert campaign commission setting if it doesn't exist
INSERT INTO platform_settings (setting_key, setting_value, setting_type, category, description)
VALUES ('campaign_commission_percentage', '5', 'number', 'commission', 'Commission percentage on campaign donations')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert influencer commission setting if it doesn't exist
INSERT INTO platform_settings (setting_key, setting_value, setting_type, category, description)
VALUES ('influencer_commission_percentage', '10', 'number', 'commission', 'Default commission percentage for influencer referrals')
ON CONFLICT (setting_key) DO NOTHING;