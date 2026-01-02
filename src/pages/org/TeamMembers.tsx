import React, { useState } from 'react';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  useTeamMembers, 
  useInviteTeamMember, 
  useUpdateTeamMember, 
  useRemoveTeamMember,
  TeamMember,
  TeamMemberPermissions
} from '@/hooks/useTeamMembers';
import { useProfile } from '@/hooks/useProfile';
import { useOrganizationSettings } from '@/hooks/useOrganization';
import { useEvents } from '@/hooks/useEvents';
import { UserPlus, Users, Mail, Trash2, Edit, Shield, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const defaultPermissions: TeamMemberPermissions = {
  can_view_contests: true,
  can_edit_contests: false,
  can_view_events: true,
  can_edit_events: false,
  can_view_campaigns: true,
  can_edit_campaigns: false,
  can_scan_tickets: true,
  scan_tickets_event_ids: [], // Empty means all events
  can_view_analytics: false,
  can_manage_payouts: false,
};

// Component for scan tickets permission with event selection
const ScanTicketsPermission = ({
  canScan,
  eventIds,
  onCanScanChange,
  onEventIdsChange,
}: {
  canScan: boolean;
  eventIds: string[];
  onCanScanChange: (checked: boolean) => void;
  onEventIdsChange: (eventIds: string[]) => void;
}) => {
  const { data: events } = useEvents();
  const orgEvents = events || [];

  const toggleEvent = (eventId: string) => {
    if (eventIds.includes(eventId)) {
      onEventIdsChange(eventIds.filter(id => id !== eventId));
    } else {
      onEventIdsChange([...eventIds, eventId]);
    }
  };

  const selectAllEvents = () => {
    onEventIdsChange([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm">Scan Tickets</span>
        <Switch checked={canScan} onCheckedChange={onCanScanChange} />
      </div>
      {canScan && (
        <div className="ml-4 space-y-2 border-l-2 border-border pl-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Assign to specific events
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={selectAllEvents}
            >
              {eventIds.length === 0 ? 'All Events' : 'Clear Selection'}
            </Button>
          </div>
          {orgEvents.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {orgEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`event-${event.id}`}
                    checked={eventIds.length === 0 || eventIds.includes(event.id)}
                    onCheckedChange={() => {
                      if (eventIds.length === 0) {
                        // Currently "all events" - switch to only this event
                        onEventIdsChange([event.id]);
                      } else {
                        toggleEvent(event.id);
                      }
                    }}
                  />
                  <label 
                    htmlFor={`event-${event.id}`} 
                    className="text-xs cursor-pointer flex-1 truncate"
                  >
                    {event.title}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No events found</p>
          )}
          <p className="text-xs text-muted-foreground">
            {eventIds.length === 0 
              ? 'Can scan tickets for all events' 
              : `Can scan tickets for ${eventIds.length} event${eventIds.length > 1 ? 's' : ''}`
            }
          </p>
        </div>
      )}
    </div>
  );
};

const TeamMembers = () => {
  const { data: members, isLoading } = useTeamMembers();
  const { data: profile } = useProfile();
  const { data: orgSettings } = useOrganizationSettings();
  const inviteMember = useInviteTeamMember();
  const updateMember = useUpdateTeamMember();
  const removeMember = useRemoveTeamMember();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    role: 'staff',
    permissions: { ...defaultPermissions },
  });

  const handleInvite = async () => {
    await inviteMember.mutateAsync({
      ...inviteData,
      organizationName: orgSettings?.company_name || 'Our Organization',
      inviterName: profile?.full_name || 'The Team',
    });
    setIsInviteOpen(false);
    setInviteData({ email: '', name: '', role: 'staff', permissions: { ...defaultPermissions } });
  };

  const handleUpdate = async () => {
    if (!selectedMember) return;
    await updateMember.mutateAsync({
      id: selectedMember.id,
      role: selectedMember.role,
      permissions: selectedMember.permissions,
    });
    setIsEditOpen(false);
    setSelectedMember(null);
  };

  const handleRemove = async (memberId: string) => {
    await removeMember.mutateAsync(memberId);
  };

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember({ ...member });
    setIsEditOpen(true);
  };

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Team Members</h1>
            <p className="text-sm text-muted-foreground">Invite staff and manage their permissions.</p>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="sm:size-default">
                <UserPlus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Invite Member</span>
                <span className="sm:hidden">Invite</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="staff@example.com"
                    value={inviteData.email}
                    onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name (Optional)</Label>
                  <Input
                    placeholder="John Doe"
                    value={inviteData.name}
                    onChange={(e) => setInviteData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select 
                    value={inviteData.role} 
                    onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="scanner">Scanner Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    {[
                      { key: 'can_view_contests', label: 'View Contests' },
                      { key: 'can_edit_contests', label: 'Edit Contests' },
                      { key: 'can_view_events', label: 'View Events' },
                      { key: 'can_edit_events', label: 'Edit Events' },
                      { key: 'can_view_campaigns', label: 'View Campaigns' },
                      { key: 'can_edit_campaigns', label: 'Edit Campaigns' },
                      { key: 'can_view_analytics', label: 'View Analytics' },
                      { key: 'can_manage_payouts', label: 'Manage Payouts' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <Switch
                          checked={inviteData.permissions[key as keyof Omit<TeamMemberPermissions, 'scan_tickets_event_ids'>] as boolean}
                          onCheckedChange={(checked) => 
                            setInviteData(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, [key]: checked }
                            }))
                          }
                        />
                      </div>
                    ))}
                    {/* Scan Tickets with event selection */}
                    <ScanTicketsPermission
                      canScan={inviteData.permissions.can_scan_tickets}
                      eventIds={inviteData.permissions.scan_tickets_event_ids || []}
                      onCanScanChange={(checked) =>
                        setInviteData(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, can_scan_tickets: checked }
                        }))
                      }
                      onEventIdsChange={(eventIds) =>
                        setInviteData(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, scan_tickets_event_ids: eventIds }
                        }))
                      }
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleInvite} 
                  className="w-full" 
                  disabled={!inviteData.email || inviteMember.isPending}
                >
                  {inviteMember.isPending ? 'Inviting...' : 'Send Invitation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>People with access to your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : members && members.length > 0 ? (
              <div className="space-y-3">
                {members.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name || member.email}</p>
                        {member.name && (
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{member.role}</Badge>
                          <Badge variant={member.status === 'accepted' ? 'default' : 'secondary'}>
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEditDialog(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will revoke their access to your organization. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemove(member.id)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No team members yet</h3>
                <p className="text-muted-foreground mb-4">Invite staff to help manage your organization</p>
                <Button onClick={() => setIsInviteOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Member Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Edit Permissions
              </DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{selectedMember.name || selectedMember.email}</p>
                  {selectedMember.name && (
                    <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select 
                    value={selectedMember.role} 
                    onValueChange={(value) => setSelectedMember(prev => prev ? { ...prev, role: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="scanner">Scanner Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    {[
                      { key: 'can_view_contests', label: 'View Contests' },
                      { key: 'can_edit_contests', label: 'Edit Contests' },
                      { key: 'can_view_events', label: 'View Events' },
                      { key: 'can_edit_events', label: 'Edit Events' },
                      { key: 'can_view_campaigns', label: 'View Campaigns' },
                      { key: 'can_edit_campaigns', label: 'Edit Campaigns' },
                      { key: 'can_view_analytics', label: 'View Analytics' },
                      { key: 'can_manage_payouts', label: 'Manage Payouts' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <Switch
                          checked={selectedMember.permissions[key as keyof Omit<TeamMemberPermissions, 'scan_tickets_event_ids'>] as boolean}
                          onCheckedChange={(checked) => 
                            setSelectedMember(prev => prev ? {
                              ...prev,
                              permissions: { ...prev.permissions, [key]: checked }
                            } : null)
                          }
                        />
                      </div>
                    ))}
                    {/* Scan Tickets with event selection */}
                    <ScanTicketsPermission
                      canScan={selectedMember.permissions.can_scan_tickets}
                      eventIds={selectedMember.permissions.scan_tickets_event_ids || []}
                      onCanScanChange={(checked) =>
                        setSelectedMember(prev => prev ? {
                          ...prev,
                          permissions: { ...prev.permissions, can_scan_tickets: checked }
                        } : null)
                      }
                      onEventIdsChange={(eventIds) =>
                        setSelectedMember(prev => prev ? {
                          ...prev,
                          permissions: { ...prev.permissions, scan_tickets_event_ids: eventIds }
                        } : null)
                      }
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleUpdate} 
                  className="w-full" 
                  disabled={updateMember.isPending}
                >
                  {updateMember.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </OrganizationLayout>
  );
};

export default TeamMembers;
