import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Trophy, 
  Calendar, 
  Heart, 
  FileText,
  Users,
  DollarSign,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { useOrganizationDetails } from '@/hooks/useOrganizationDetails';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface OrganizationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: any;
  getStatusBadge: (org: any) => React.ReactNode;
}

const OrganizationDetailsDialog: React.FC<OrganizationDetailsDialogProps> = ({
  open,
  onOpenChange,
  organization,
  getStatusBadge,
}) => {
  const { contests, events, campaigns, forms, isLoading } = useOrganizationDetails(
    organization?.id || null
  );

  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Organization Details</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="space-y-6 py-4 pr-4">
            {/* Organization Info Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={organization.avatar_url || ''} />
                <AvatarFallback className="text-lg">
                  <Building2 className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{organization.full_name}</h3>
                <p className="text-muted-foreground">{organization.email}</p>
                <div className="mt-2">{getStatusBadge(organization)}</div>
              </div>
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{organization.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commission Rate</p>
                <p className="font-medium">
                  {organization.approval?.special_commission_rate 
                    ? `${organization.approval.special_commission_rate}%`
                    : 'Default (10%)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{format(new Date(organization.created_at), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approval Date</p>
                <p className="font-medium">
                  {organization.approval?.reviewed_at 
                    ? format(new Date(organization.approval.reviewed_at), 'PPP')
                    : 'Not reviewed'}
                </p>
              </div>
            </div>

            {/* Company Details */}
            {organization.settings && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Company Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="font-medium">{organization.settings.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company Email</p>
                    <p className="font-medium">{organization.settings.company_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company Phone</p>
                    <p className="font-medium">{organization.settings.company_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payout Method</p>
                    <p className="font-medium capitalize">{organization.settings.preferred_payout_method || 'Bank'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rejection Reason */}
            {organization.approval?.rejection_reason && (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                <p className="text-sm mt-1">{organization.approval.rejection_reason}</p>
              </div>
            )}

            {/* Content Tabs */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Organization Content</h4>
              <Tabs defaultValue="contests" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="contests" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Contests ({contests.length})
                  </TabsTrigger>
                  <TabsTrigger value="events" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Events ({events.length})
                  </TabsTrigger>
                  <TabsTrigger value="campaigns" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Campaigns ({campaigns.length})
                  </TabsTrigger>
                  <TabsTrigger value="forms" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Forms ({forms.length})
                  </TabsTrigger>
                </TabsList>

                {/* Contests Tab */}
                <TabsContent value="contests" className="mt-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : contests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No contests created</p>
                  ) : (
                    <div className="space-y-2">
                      {contests.map((contest) => (
                        <div key={contest.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{contest.title}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{contest.category}</span>
                              <span>•</span>
                              <span>{contest.total_votes} votes</span>
                              <span>•</span>
                              <span>{contest.vote_currency} {contest.vote_price}/vote</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={contest.is_active ? 'default' : 'secondary'}>
                              {contest.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/admin/contests/${contest.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Events Tab */}
                <TabsContent value="events" className="mt-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : events.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No events created</p>
                  ) : (
                    <div className="space-y-2">
                      {events.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{event.title}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{event.category}</span>
                              <span>•</span>
                              <span>{event.venue}</span>
                              <span>•</span>
                              <span>{format(new Date(event.event_date), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={event.is_active ? 'default' : 'secondary'}>
                              {event.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/admin/events/${event.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Campaigns Tab */}
                <TabsContent value="campaigns" className="mt-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : campaigns.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No campaigns created</p>
                  ) : (
                    <div className="space-y-2">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{campaign.title}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{campaign.category}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {campaign.current_amount.toLocaleString()} / {campaign.goal_amount.toLocaleString()} {campaign.currency}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {campaign.donor_count} donors
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                              {campaign.status}
                            </Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/campaigns/${campaign.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Forms Tab */}
                <TabsContent value="forms" className="mt-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : forms.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No forms created</p>
                  ) : (
                    <div className="space-y-2">
                      {forms.map((form) => (
                        <div key={form.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{form.title}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>Created {format(new Date(form.created_at), 'MMM d, yyyy')}</span>
                              <span>•</span>
                              <span>{form.is_accepting_responses ? 'Accepting responses' : 'Closed'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={form.is_active ? 'default' : 'secondary'}>
                              {form.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/forms/${form.id}/responses`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationDetailsDialog;
