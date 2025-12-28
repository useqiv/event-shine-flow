import React, { useState, useEffect } from 'react';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePromoCodes, useCreatePromoCode, useDeletePromoCode, useOrganizationEvents } from '@/hooks/useOrganization';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { MarketingAnalyticsDashboard } from '@/components/org/MarketingAnalyticsDashboard';
import { PromoCodeAnalytics } from '@/components/org/PromoCodeAnalytics';
import { SocialPostTemplates } from '@/components/org/SocialPostTemplates';
import { QuickSocialPost } from '@/components/org/QuickSocialPost';
import { ShareCardGeneratorMarketing } from '@/components/org/ShareCardGeneratorMarketing';
import { InfluencerLinksManager } from '@/components/org/InfluencerLinksManager';
import { Megaphone, Tag, PlusCircle, Trash2, Copy, Percent, BarChart3, Share2, FileText, Users, Image, Link2, Ticket, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TicketType {
  id: string;
  name: string;
  event_id: string;
}

const Marketing = () => {
  const { confirm } = useConfirmDialog();
  const { data: promoCodes, isLoading } = usePromoCodes();
  const { data: events } = useOrganizationEvents();
  const createPromoCode = useCreatePromoCode();
  const deletePromoCode = useDeletePromoCode();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    max_uses: '',
    valid_until: '',
    applicable_to: 'all',
    event_id: '',
    ticket_type_id: '',
  });

  // Fetch ticket types when event is selected
  useEffect(() => {
    const fetchTicketTypes = async () => {
      if (newPromo.event_id && newPromo.applicable_to === 'ticket_type') {
        const { data } = await supabase
          .from('ticket_types')
          .select('id, name, event_id')
          .eq('event_id', newPromo.event_id);
        setTicketTypes(data || []);
      } else {
        setTicketTypes([]);
        setNewPromo(prev => ({ ...prev, ticket_type_id: '' }));
      }
    };
    fetchTicketTypes();
  }, [newPromo.event_id, newPromo.applicable_to]);

  const handleCreatePromo = async () => {
    if (!newPromo.code || !newPromo.discount_value) {
      toast.error('Please fill in required fields');
      return;
    }

    if (newPromo.applicable_to === 'ticket_type' && !newPromo.ticket_type_id) {
      toast.error('Please select a ticket type');
      return;
    }

    try {
      await createPromoCode.mutateAsync({
        code: newPromo.code.toUpperCase(),
        discount_type: newPromo.discount_type,
        discount_value: Number(newPromo.discount_value),
        max_uses: newPromo.max_uses ? Number(newPromo.max_uses) : null,
        valid_until: newPromo.valid_until || null,
        applicable_to: newPromo.applicable_to === 'ticket_type' ? 'events' : newPromo.applicable_to,
        event_id: newPromo.event_id || null,
        ticket_type_id: newPromo.ticket_type_id || null,
      } as any);
      setIsCreateOpen(false);
      setNewPromo({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        max_uses: '',
        valid_until: '',
        applicable_to: 'all',
        event_id: '',
        ticket_type_id: '',
      });
    } catch (error) {
      console.error('Failed to create promo code:', error);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Promo code copied!');
  };

  const handleDeletePromo = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Promo Code',
      description: 'Are you sure you want to delete this promo code? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      await deletePromoCode.mutateAsync(id);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPromo(prev => ({ ...prev, code: result }));
  };

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Marketing Hub</h1>
            <p className="text-muted-foreground">Social media, analytics, and promotional tools.</p>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Cards</span>
            </TabsTrigger>
            <TabsTrigger value="influencers" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Influencers</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="promos" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Promos</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <MarketingAnalyticsDashboard />
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-6">
            <QuickSocialPost />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Auto-Posting Settings
                </CardTitle>
                <CardDescription>
                  Configure automatic posts for your contests and events in their management pages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Auto-posting is configured per contest or event. Go to a contest's or event's management page to set up scheduled posts.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={() => window.location.href = '/org/contests'}>
                      Manage Contests
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/org/events'}>
                      Manage Events
                  </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <SocialPostTemplates />
          </TabsContent>

          {/* Share Cards Tab */}
          <TabsContent value="cards">
            <ShareCardGeneratorMarketing />
          </TabsContent>

          {/* Influencers Tab */}
          <TabsContent value="influencers">
            <InfluencerLinksManager />
          </TabsContent>

          {/* Promo Codes Tab */}
          <TabsContent value="promos" className="space-y-6">
            {/* Analytics Section */}
            <PromoCodeAnalytics />

            {/* Promo Codes Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Promo Codes
                    </CardTitle>
                    <CardDescription>Create discount codes for your audience</CardDescription>
                  </div>
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Promo Code</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Code *</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g., SUMMER2024"
                              value={newPromo.code}
                              onChange={(e) => setNewPromo(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                              className="uppercase"
                            />
                            <Button type="button" variant="outline" onClick={generateRandomCode}>
                              Generate
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Discount Type</Label>
                            <Select 
                              value={newPromo.discount_type}
                              onValueChange={(value) => setNewPromo(prev => ({ ...prev, discount_type: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Discount Value *</Label>
                            <Input
                              type="number"
                              placeholder={newPromo.discount_type === 'percentage' ? '10' : '500'}
                              value={newPromo.discount_value}
                              onChange={(e) => setNewPromo(prev => ({ ...prev, discount_value: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Max Uses (optional)</Label>
                            <Input
                              type="number"
                              placeholder="Unlimited"
                              value={newPromo.max_uses}
                              onChange={(e) => setNewPromo(prev => ({ ...prev, max_uses: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Valid Until (optional)</Label>
                            <Input
                              type="date"
                              value={newPromo.valid_until}
                              onChange={(e) => setNewPromo(prev => ({ ...prev, valid_until: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Applicable To</Label>
                          <Select
                            value={newPromo.applicable_to}
                            onValueChange={(value) => setNewPromo(prev => ({ 
                              ...prev, 
                              applicable_to: value,
                              event_id: '',
                              ticket_type_id: '',
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All (Events & Contests)</SelectItem>
                              <SelectItem value="events">All Events</SelectItem>
                              <SelectItem value="contests">All Contests</SelectItem>
                              <SelectItem value="ticket_type">Specific Ticket Type</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Event selection for ticket type specific codes */}
                        {newPromo.applicable_to === 'ticket_type' && (
                          <>
                            <div className="space-y-2">
                              <Label>Select Event *</Label>
                              <Select
                                value={newPromo.event_id}
                                onValueChange={(value) => setNewPromo(prev => ({ 
                                  ...prev, 
                                  event_id: value,
                                  ticket_type_id: '',
                                }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose an event" />
                                </SelectTrigger>
                                <SelectContent>
                                  {events?.map((event: any) => (
                                    <SelectItem key={event.id} value={event.id}>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {event.title}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {newPromo.event_id && (
                              <div className="space-y-2">
                                <Label>Select Ticket Type *</Label>
                                <Select
                                  value={newPromo.ticket_type_id}
                                  onValueChange={(value) => setNewPromo(prev => ({ ...prev, ticket_type_id: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a ticket type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ticketTypes.length > 0 ? (
                                      ticketTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                          <div className="flex items-center gap-2">
                                            <Ticket className="h-4 w-4" />
                                            {type.name}
                                          </div>
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="none" disabled>
                                        No ticket types found for this event
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </>
                        )}

                        <Button onClick={handleCreatePromo} className="w-full" disabled={createPromoCode.isPending}>
                          {createPromoCode.isPending ? 'Creating...' : 'Create Promo Code'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : promoCodes && promoCodes.length > 0 ? (
                  <div className="space-y-3">
                    {promoCodes.map((promo: any) => (
                      <div key={promo.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            {promo.ticket_type_id ? (
                              <Ticket className="h-6 w-6 text-primary" />
                            ) : (
                              <Percent className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-mono font-bold text-lg">{promo.code}</p>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyCode(promo.code)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                              {promo.ticket_type_id && (
                                <Badge variant="outline" className="text-xs">
                                  <Ticket className="h-3 w-3 mr-1" />
                                  Ticket-specific
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {promo.discount_type === 'percentage' 
                                ? `${promo.discount_value}% off` 
                                : `₦${Number(promo.discount_value).toLocaleString()} off`}
                              {promo.max_uses && ` • ${promo.current_uses}/${promo.max_uses} uses`}
                              {promo.valid_until && ` • Expires ${format(new Date(promo.valid_until), 'MMM d, yyyy')}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Applies to: {promo.ticket_type_id ? 'Specific ticket type' : promo.applicable_to === 'all' ? 'All' : promo.applicable_to}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                            {promo.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeletePromo(promo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No promo codes yet</p>
                    <Button onClick={() => setIsCreateOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OrganizationLayout>
  );
};

export default Marketing;
