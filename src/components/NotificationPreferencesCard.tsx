import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Bell, Loader2 } from "lucide-react";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/useNotificationPreferences";

const NotificationPreferencesCard = () => {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const handleToggle = (key: string, value: boolean) => {
    updatePreferences.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Default values if no preferences exist yet
  const prefs = preferences ?? {
    email_donation_updates: true,
    email_campaign_milestones: true,
    email_new_donations: true,
    email_weekly_summary: false,
    push_donation_updates: true,
    push_campaign_milestones: true,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Control what updates you receive about your donations and campaigns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Email Notifications</h3>
          </div>
          
          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_donation_updates">Campaign Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates when campaigns you've donated to post new updates
                </p>
              </div>
              <Switch
                id="email_donation_updates"
                checked={prefs.email_donation_updates}
                onCheckedChange={(checked) => handleToggle("email_donation_updates", checked)}
                disabled={updatePreferences.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_campaign_milestones">Milestone Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when campaigns reach funding milestones
                </p>
              </div>
              <Switch
                id="email_campaign_milestones"
                checked={prefs.email_campaign_milestones}
                onCheckedChange={(checked) => handleToggle("email_campaign_milestones", checked)}
                disabled={updatePreferences.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_new_donations">Donation Receipts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email receipts for your donations
                </p>
              </div>
              <Switch
                id="email_new_donations"
                checked={prefs.email_new_donations}
                onCheckedChange={(checked) => handleToggle("email_new_donations", checked)}
                disabled={updatePreferences.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_weekly_summary">Weekly Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly digest of campaign progress
                </p>
              </div>
              <Switch
                id="email_weekly_summary"
                checked={prefs.email_weekly_summary}
                onCheckedChange={(checked) => handleToggle("email_weekly_summary", checked)}
                disabled={updatePreferences.isPending}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Push Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">In-App Notifications</h3>
          </div>
          
          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push_donation_updates">Campaign Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications for campaign updates in-app
                </p>
              </div>
              <Switch
                id="push_donation_updates"
                checked={prefs.push_donation_updates}
                onCheckedChange={(checked) => handleToggle("push_donation_updates", checked)}
                disabled={updatePreferences.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push_campaign_milestones">Milestone Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications when campaigns hit milestones
                </p>
              </div>
              <Switch
                id="push_campaign_milestones"
                checked={prefs.push_campaign_milestones}
                onCheckedChange={(checked) => handleToggle("push_campaign_milestones", checked)}
                disabled={updatePreferences.isPending}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesCard;
