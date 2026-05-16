import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Loader2, AlertTriangle } from 'lucide-react';
import { useSendOrgBroadcastEmail } from '@/hooks/useAdminData';

interface OrgBroadcastEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalOrgs: number;
  approvedCount: number;
  pendingCount: number;
}

const OrgBroadcastEmailDialog: React.FC<OrgBroadcastEmailDialogProps> = ({
  open,
  onOpenChange,
  totalOrgs,
  approvedCount,
  pendingCount,
}) => {
  const sendBroadcast = useSendOrgBroadcastEmail();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const recipientCount =
    recipientFilter === 'all'
      ? totalOrgs
      : recipientFilter === 'approved'
        ? approvedCount
        : pendingCount;

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setRecipientFilter('all');
    setConfirmOpen(false);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen && !sendBroadcast.isPending) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSend = async () => {
    await sendBroadcast.mutateAsync({
      subject: subject.trim(),
      message: message.trim(),
      recipientFilter,
    });
    resetForm();
    onOpenChange(false);
  };

  const canProceed = subject.trim().length > 0 && message.trim().length > 0;

  return (
    <>
      <Dialog open={open && !confirmOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email All Organizations
            </DialogTitle>
            <DialogDescription>
              Send a message to organization signup email addresses via ZeptoMail.
              Each organization receives a separate email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="broadcast-recipients">Recipients</Label>
              <Select
                value={recipientFilter}
                onValueChange={(v) => setRecipientFilter(v as typeof recipientFilter)}
              >
                <SelectTrigger id="broadcast-recipients">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organizations ({totalOrgs})</SelectItem>
                  <SelectItem value="approved">Approved only ({approvedCount})</SelectItem>
                  <SelectItem value="pending">Pending / not approved ({pendingCount})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="broadcast-subject">Subject</Label>
              <Input
                id="broadcast-subject"
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="broadcast-message">Message</Label>
              <Textarea
                id="broadcast-message"
                placeholder="Write your message to organizations..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                maxLength={10000}
              />
              <p className="text-xs text-muted-foreground">{message.length} / 10,000</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={sendBroadcast.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!canProceed || sendBroadcast.isPending || recipientCount === 0}
            >
              Review & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm broadcast
            </DialogTitle>
            <DialogDescription>
              You are about to email <strong>{recipientCount}</strong> organization
              {recipientCount === 1 ? '' : 's'} at their signup email addresses. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
            <p><span className="text-muted-foreground">Subject:</span> {subject}</p>
            <p className="text-muted-foreground line-clamp-3">{message}</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sendBroadcast.isPending}>
              Back
            </Button>
            <Button onClick={handleSend} disabled={sendBroadcast.isPending}>
              {sendBroadcast.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send to ${recipientCount} org${recipientCount === 1 ? '' : 's'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrgBroadcastEmailDialog;
