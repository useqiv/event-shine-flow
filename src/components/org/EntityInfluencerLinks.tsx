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
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, PlusCircle, Trash2, Copy, TrendingUp, MousePointerClick, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, getCurrencySymbol } from '@/components/ui/currency-selector';

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
}

interface EntityInfluencerLinksProps {
  entityId: string;
  entityType: 'contest' | 'event';
  entityTitle: string;
  customSlug?: string | null;
  currency?: string;
}

export const EntityInfluencerLinks: React.FC<EntityInfluencerLinksProps> = ({
  entityId,
  entityType,
  entityTitle,
  customSlug,
  currency = 'NGN',
}) => {
  const { user } = useAuth();
  const { confirm } = useConfirmDialog();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLink, setNewLink] = useState({
    name: '',
    code: '',
    commission_type: 'percentage',
    commission_value: '',
  });

  // Fetch influencer links for this entity
  const { data: links, isLoading } = useQuery({
    queryKey: ['entity-influencer-links', entityId, entityType],
    queryFn: async () => {
      const column = entityType === 'contest' ? 'contest_id' : 'event_id';
      const { data, error } = await supabase
        .from('influencer_links')
        .select('*')
        .eq(column, entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InfluencerLink[];
    },
    enabled: !!entityId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const code = newLink.code.toUpperCase().trim();
      if (!code) throw new Error('Tracking code is required');
      if (!newLink.name.trim()) throw new Error('Influencer name is required');
      
      // Check if code already exists
      const { data: existingLink } = await supabase
        .from('influencer_links')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      
      if (existingLink) {
        throw new Error('This tracking code is already in use. Please choose a different code.');
      }

      const { error } = await supabase.from('influencer_links').insert({
        organization_id: user.id,
        name: newLink.name.trim(),
        code: code,
        contest_id: entityType === 'contest' ? entityId : null,
        event_id: entityType === 'event' ? entityId : null,
        commission_type: newLink.commission_type,
        commission_value: Number(newLink.commission_value) || 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-influencer-links', entityId] });
      setIsCreateOpen(false);
      setNewLink({
        name: '',
        code: '',
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
      queryClient.invalidateQueries({ queryKey: ['entity-influencer-links', entityId] });
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
      queryClient.invalidateQueries({ queryKey: ['entity-influencer-links', entityId] });
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

  const copyLink = (code: string) => {
    const baseUrl = window.location.origin;
    let url = baseUrl;
    
    if (entityType === 'contest') {
      url = customSlug 
        ? `${baseUrl}/c/${customSlug}?ref=${code}`
        : `${baseUrl}/contests/${entityId}?ref=${code}`;
    } else {
      url = customSlug
        ? `${baseUrl}/e/${customSlug}?ref=${code}`
        : `${baseUrl}/events/${entityId}?ref=${code}`;
    }
    
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

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
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue, currency)}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(totalCommission, currency)}</p>
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
              <CardDescription>Trackable links for {entityTitle}</CardDescription>
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
                          <SelectItem value="fixed">Fixed Amount ({getCurrencySymbol(currency)})</SelectItem>
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
                        {link.commission_type === 'percentage' 
                          ? `${link.commission_value}% commission`
                          : `${formatCurrency(link.commission_value, currency)} per conversion`}
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
                        onClick={() => copyLink(link.code)}
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
                      <p className="text-lg font-bold">{formatCurrency(link.total_revenue, currency)}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{formatCurrency(link.total_commission, currency)}</p>
                      <p className="text-xs text-muted-foreground">Commission</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No influencer links for this {entityType} yet</p>
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
