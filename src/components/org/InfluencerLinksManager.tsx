import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContests, useOrganizationEvents } from '@/hooks/useOrganization';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, PlusCircle, Trash2, Copy, TrendingUp, MousePointerClick, DollarSign, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface InfluencerLink {
  id: string;
  name: string;
  code: string;
  contest_id: string | null;
  event_id: string | null;
  commission_type: string;
  commission_value: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue: number;
  total_commission: number;
  is_active: boolean;
  created_at: string;
  contests?: { title: string } | null;
  events?: { title: string } | null;
}

export const InfluencerLinksManager: React.FC = () => {
  const { user } = useAuth();
  const { confirm } = useConfirmDialog();
  const queryClient = useQueryClient();
  const { data: contests } = useOrganizationContests();
  const { data: events } = useOrganizationEvents();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLink, setNewLink] = useState({
    name: '',
    code: '',
    link_type: 'contest',
    target_id: '',
    commission_type: 'percentage',
    commission_value: '',
  });

  // Fetch influencer links
  const { data: links, isLoading } = useQuery({
    queryKey: ['influencer-links', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencer_links')
        .select('*, contests(title), events(title)')
        .eq('organization_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InfluencerLink[];
    },
    enabled: !!user?.id,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const code = newLink.code.toUpperCase().trim();
      if (!code) throw new Error('Tracking code is required');
      if (!newLink.name.trim()) throw new Error('Influencer name is required');
      if (!newLink.target_id) throw new Error('Please select a contest or event');
      
      // Check if code already exists
      const { data: existingLink } = await supabase
        .from('influencer_links')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      
      if (existingLink) {
        throw new Error('This tracking code is already in use. Please choose a different code.');
      }

      // Get currency from selected contest or event
      let commission_currency = 'NGN';
      if (newLink.link_type === 'contest' && contests) {
        const selectedContest = contests.find((c: any) => c.id === newLink.target_id);
        commission_currency = selectedContest?.vote_currency || 'NGN';
      } else if (newLink.link_type === 'event' && events) {
        const selectedEvent = events.find((e: any) => e.id === newLink.target_id);
        commission_currency = selectedEvent?.currency || 'NGN';
      }

      const { error } = await supabase.from('influencer_links').insert({
        organization_id: user.id,
        name: newLink.name.trim(),
        code: code,
        contest_id: newLink.link_type === 'contest' ? newLink.target_id : null,
        event_id: newLink.link_type === 'event' ? newLink.target_id : null,
        commission_type: newLink.commission_type,
        commission_value: Number(newLink.commission_value) || 0,
        commission_currency: commission_currency,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer-links'] });
      setIsCreateOpen(false);
      setNewLink({
        name: '',
        code: '',
        link_type: 'contest',
        target_id: '',
        commission_type: 'percentage',
        commission_value: '',
      });
      toast.success('Influencer link created!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create link');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('influencer_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer-links'] });
      toast.success('Link deleted');
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('influencer_links')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer-links'] });
    },
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewLink(prev => ({ ...prev, code: result }));
  };

  const copyLink = (code: string, targetId: string | null, linkType: string) => {
    const baseUrl = window.location.origin;
    let url = baseUrl;
    
    if (linkType === 'contest' && targetId) {
      const contest = contests?.find(c => c.id === targetId);
      url = contest?.custom_slug 
        ? `${baseUrl}/c/${contest.custom_slug}?ref=${code}`
        : `${baseUrl}/contests/${targetId}?ref=${code}`;
    } else if (linkType === 'event' && targetId) {
      url = `${baseUrl}/events/${targetId}?ref=${code}`;
    } else {
      url = `${baseUrl}?ref=${code}`;
    }
    
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const activeContests = contests?.filter(c => c.is_active) || [];
  const activeEvents = events?.filter(e => e.is_active) || [];

  // Calculate totals
  const totalClicks = links?.reduce((sum, l) => sum + l.total_clicks, 0) || 0;
  const totalConversions = links?.reduce((sum, l) => sum + l.total_conversions, 0) || 0;
  const totalRevenue = links?.reduce((sum, l) => sum + l.total_revenue, 0) || 0;
  const totalCommission = links?.reduce((sum, l) => sum + l.total_commission, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MousePointerClick className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalConversions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-chart-2" />
              <div>
                <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-chart-3" />
              <div>
                <p className="text-2xl font-bold">₦{totalCommission.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Commission Owed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Influencer Links
              </CardTitle>
              <CardDescription>Create trackable links for influencers and affiliates</CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Influencer Link</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Influencer Name *</Label>
                    <Input
                      placeholder="e.g., John Doe"
                      value={newLink.name}
                      onChange={(e) => setNewLink(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tracking Code *</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., JOHN2024"
                        value={newLink.code}
                        onChange={(e) => setNewLink(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        className="uppercase"
                      />
                      <Button type="button" variant="outline" onClick={generateCode}>
                        Generate
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Link Type</Label>
                      <Select
                        value={newLink.link_type}
                        onValueChange={(value) => setNewLink(prev => ({ ...prev, link_type: value, target_id: '' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contest">Contest</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{newLink.link_type === 'contest' ? 'Contest' : 'Event'}</Label>
                      <Select
                        value={newLink.target_id}
                        onValueChange={(value) => setNewLink(prev => ({ ...prev, target_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(newLink.link_type === 'contest' ? activeContests : activeEvents).map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Commission Type</Label>
                      <Select
                        value={newLink.commission_type}
                        onValueChange={(value) => setNewLink(prev => ({ ...prev, commission_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (₦)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Commission Value</Label>
                      <Input
                        type="number"
                        placeholder={newLink.commission_type === 'percentage' ? '10' : '500'}
                        value={newLink.commission_value}
                        onChange={(e) => setNewLink(prev => ({ ...prev, commission_value: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={() => createMutation.mutate()} 
                    className="w-full" 
                    disabled={!newLink.name || !newLink.code || createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Link'}
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
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : links && links.length > 0 ? (
            <div className="space-y-3">
              {links.map((link) => (
                <div 
                  key={link.id} 
                  className="p-4 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{link.name}</p>
                        <Badge variant="outline" className="font-mono">{link.code}</Badge>
                        <Badge variant={link.is_active ? 'default' : 'secondary'}>
                          {link.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {link.contests?.title || link.events?.title || 'General'}
                        {' • '}
                        {link.commission_type === 'percentage' 
                          ? `${link.commission_value}% commission`
                          : `₦${link.commission_value} per conversion`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: link.id, is_active: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLink(link.code, link.contest_id || link.event_id, link.contest_id ? 'contest' : 'event')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={async () => {
                          const confirmed = await confirm({
                            title: 'Delete Link',
                            description: 'Are you sure you want to delete this influencer link? This action cannot be undone.',
                            confirmText: 'Delete',
                            variant: 'destructive',
                          });
                          if (confirmed) {
                            deleteMutation.mutate(link.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold">{link.total_clicks.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{link.total_conversions.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Conversions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">₦{link.total_revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">₦{link.total_commission.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Commission</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No influencer links yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
