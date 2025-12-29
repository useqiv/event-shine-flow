import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, PlusCircle, Trash2, Copy, Percent, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TicketType {
  id: string;
  name: string;
  event_id: string;
}

interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_until: string | null;
  is_active: boolean;
  applicable_to: string;
  ticket_type_id: string | null;
}

interface EntityPromoCodesProps {
  entityId: string;
  entityType: 'contest' | 'event';
  entityTitle: string;
}

export const EntityPromoCodes: React.FC<EntityPromoCodesProps> = ({
  entityId,
  entityType,
  entityTitle,
}) => {
  const { user } = useAuth();
  const { confirm } = useConfirmDialog();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    max_uses: '',
    valid_until: '',
    applicable_to: entityType === 'event' ? 'events' : 'contests',
    ticket_type_id: '',
  });

  // Fetch ticket types for events
  useEffect(() => {
    const fetchTicketTypes = async () => {
      if (entityType === 'event' && newPromo.applicable_to === 'ticket_type') {
        const { data } = await supabase
          .from('ticket_types')
          .select('id, name, event_id')
          .eq('event_id', entityId);
        setTicketTypes(data || []);
      } else {
        setTicketTypes([]);
        setNewPromo(prev => ({ ...prev, ticket_type_id: '' }));
      }
    };
    fetchTicketTypes();
  }, [entityId, entityType, newPromo.applicable_to]);

  // Fetch promo codes for this entity
  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ['entity-promo-codes', entityId, entityType],
    queryFn: async () => {
      const column = entityType === 'contest' ? 'contest_id' : 'event_id';
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq(column, entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PromoCode[];
    },
    enabled: !!entityId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('promo_codes').insert({
        organization_id: user.id,
        code: newPromo.code.toUpperCase(),
        discount_type: newPromo.discount_type,
        discount_value: Number(newPromo.discount_value),
        max_uses: newPromo.max_uses ? Number(newPromo.max_uses) : null,
        valid_until: newPromo.valid_until || null,
        applicable_to: newPromo.applicable_to === 'ticket_type' ? 'events' : newPromo.applicable_to,
        contest_id: entityType === 'contest' ? entityId : null,
        event_id: entityType === 'event' ? entityId : null,
        ticket_type_id: newPromo.ticket_type_id || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-promo-codes', entityId] });
      setIsCreateOpen(false);
      setNewPromo({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        max_uses: '',
        valid_until: '',
        applicable_to: entityType === 'event' ? 'events' : 'contests',
        ticket_type_id: '',
      });
      toast.success('Promo code created!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create promo code');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-promo-codes', entityId] });
      toast.success('Promo code deleted');
    },
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPromo(prev => ({ ...prev, code: result }));
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
      deleteMutation.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Promo Codes
            </CardTitle>
            <CardDescription>Discount codes for {entityTitle}</CardDescription>
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

                {/* Ticket type selection for events */}
                {entityType === 'event' && (
                  <div className="space-y-2">
                    <Label>Apply To</Label>
                    <Select
                      value={newPromo.applicable_to}
                      onValueChange={(value) => setNewPromo(prev => ({ 
                        ...prev, 
                        applicable_to: value,
                        ticket_type_id: '',
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="events">All Ticket Types</SelectItem>
                        <SelectItem value="ticket_type">Specific Ticket Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {entityType === 'event' && newPromo.applicable_to === 'ticket_type' && (
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
                            No ticket types found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button 
                  onClick={() => createMutation.mutate()} 
                  className="w-full" 
                  disabled={!newPromo.code || !newPromo.discount_value || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Promo Code'}
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
            {promoCodes.map((promo) => (
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
            <p className="text-muted-foreground mb-4">No promo codes for this {entityType} yet</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
