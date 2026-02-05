import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, Vote, Ticket, Heart } from 'lucide-react';
import { useUpdateOrgNotificationSettings, useOrgNotificationSettings } from '@/hooks/useAdminOrgNotifications';

interface OrgNotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
}

const OrgNotificationSettingsDialog: React.FC<OrgNotificationSettingsDialogProps> = ({
  open,
  onOpenChange,
  organization,
}) => {
  const { data: settings, isLoading } = useOrgNotificationSettings(organization?.id || '');
  const updateSettings = useUpdateOrgNotificationSettings();

  const [notifyOnVote, setNotifyOnVote] = useState(false);
  const [notifyOnTicket, setNotifyOnTicket] = useState(false);
  const [notifyOnDonation, setNotifyOnDonation] = useState(false);

  useEffect(() => {
    if (settings) {
      setNotifyOnVote(settings.notify_on_vote ?? false);
      setNotifyOnTicket(settings.notify_on_ticket ?? false);
      setNotifyOnDonation(settings.notify_on_donation ?? false);
    } else {
      setNotifyOnVote(false);
      setNotifyOnTicket(false);
      setNotifyOnDonation(false);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!organization) return;
    
    await updateSettings.mutateAsync({
      organizationId: organization.id,
      notify_on_vote: notifyOnVote,
      notify_on_ticket: notifyOnTicket,
      notify_on_donation: notifyOnDonation,
    });
    
    onOpenChange(false);
  };

  const anyEnabled = notifyOnVote || notifyOnTicket || notifyOnDonation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Notifications</DialogTitle>
          <DialogDescription>
            Configure real-time email notifications for this organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Organization Info */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <Avatar>
              <AvatarImage src={organization?.avatar_url || ''} />
              <AvatarFallback><Building2 className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{organization?.full_name || 'Unknown'}</p>
              <p className="text-sm text-muted-foreground truncate">{organization?.email}</p>
            </div>
            {anyEnabled && (
              <Badge variant="outline" className="text-green-600 border-green-600 shrink-0">
                Active
              </Badge>
            )}
          </div>

          {/* Notification Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Vote className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label htmlFor="notify-votes" className="font-medium">Vote Notifications</Label>
                  <p className="text-xs text-muted-foreground">Email for each vote received</p>
                </div>
              </div>
              <Switch
                id="notify-votes"
                checked={notifyOnVote}
                onCheckedChange={setNotifyOnVote}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <Label htmlFor="notify-tickets" className="font-medium">Ticket Notifications</Label>
                  <p className="text-xs text-muted-foreground">Email for each ticket sale</p>
                </div>
              </div>
              <Switch
                id="notify-tickets"
                checked={notifyOnTicket}
                onCheckedChange={setNotifyOnTicket}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <Label htmlFor="notify-donations" className="font-medium">Donation Notifications</Label>
                  <p className="text-xs text-muted-foreground">Email for each donation</p>
                </div>
              </div>
              <Switch
                id="notify-donations"
                checked={notifyOnDonation}
                onCheckedChange={setNotifyOnDonation}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Emails will be sent to the organization's company email or profile email.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending || isLoading}>
            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrgNotificationSettingsDialog;
